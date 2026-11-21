import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.js';
import { env } from '../env.js';
import {
  burn,
  checkPassword,
  clearClientSession,
  clearStaffSession,
  clientId,
  hashCode,
  hashPassword,
  LOCK_MS,
  MAX_TRIES,
  newCode,
  publicStaff,
  readClient,
  readStaff,
  requireClient,
  requireStaff,
  same,
  setClientSession,
  setStaffSession,
  staffOf,
} from '../lib/auth.js';
import { body, HttpError, normPhone, phone, uid } from '../lib/util.js';
import { sendSms } from '../lib/notify.js';
import { audit } from '../lib/audit.js';
import type { Client, OtpPurpose } from '../types.js';

export const account = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true, // only wrong numbers, codes and passwords count
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'unknown'),
  skip: () => env.NODE_ENV === 'test',
  message: { error: { code: 'SLOW_DOWN', message: 'Too many attempts. Please wait a few minutes.' } },
});

const password = z
  .string()
  .min(8, 'At least 8 characters.')
  .max(72)
  .regex(/[A-Za-z]/, 'Use at least one letter.')
  .regex(/\d/, 'Use at least one number.');
const email = z.string().trim().toLowerCase().email('This email looks incomplete.');
const codeField = z.string().regex(/^\d{6}$/, 'The code has six digits.');

/* ── one-time codes (SMS) ────────────────────────────────────────────── */

const otpKey = (purpose: OtpPurpose, p: string) => `${purpose}:${p}`;

async function sendOtp(purpose: OtpPurpose, p: string, payload?: Record<string, string>) {
  const id = otpKey(purpose, p);
  const prev = await db().otps.get(id);
  if (prev && Date.now() - prev.sentAt < 30_000) throw new HttpError(429, 'SLOW_DOWN', 'A code was sent a moment ago. Please wait 30 seconds before asking for another.');
  const c = newCode();
  const doc = { _id: id, hash: hashCode(p, c), expires: Date.now() + 5 * 60_000, tries: 0, sentAt: Date.now(), purpose, payload };
  if (prev) await db().otps.set(id, doc);
  else await db().otps.insert(doc);
  await sendSms(p, `Your Nirolax code is ${c}. It expires in 5 minutes.`, 'otp');
  return env.DEMO_MODE ? { sent: true, demoCode: c } : { sent: true };
}

async function useOtp(purpose: OtpPurpose, p: string, c: string) {
  const id = otpKey(purpose, p);
  const o = await db().otps.get(id);
  if (!o || o.expires < Date.now()) throw new HttpError(400, 'EXPIRED', 'That code has expired. Ask for a new one.');
  if (o.tries >= 5) throw new HttpError(429, 'LOCKED', 'Too many wrong codes. Ask for a new one.');
  if (!same(o.hash, hashCode(p, c))) {
    await db().otps.set(id, { tries: o.tries + 1 });
    throw new HttpError(400, 'WRONG', 'That code is not right.');
  }
  await db().otps.remove(id);
  return o;
}

/* ── who am I ────────────────────────────────────────────────────────── */

const safeClient = (c: Client) => {
  const { passwordHash, tokenVersion, failedLogins, lockedUntil, ...rest } = c;
  void tokenVersion; void failedLogins; void lockedUntil;
  return { ...rest, hasPassword: !!passwordHash };
};

async function me(id: string) {
  const s = db();
  const client = await s.clients.get(id);
  if (!client) return { role: null };
  const [orders, bookings, commissions] = await Promise.all([
    s.orders.all({ clientId: id }, { by: 'createdAt', dir: -1 }),
    s.bookings.all({ clientId: id }, { by: 'date', dir: -1 }),
    s.commissions.all({ clientId: id }),
  ]);
  return { role: 'client' as const, client: safeClient(client), orders, bookings, commissions };
}

account.get('/me', async (req, res) => {
  const c = await readClient(req);
  res.json(c ? await me(c._id) : { role: null });
});

/* ── register: name, email, phone, password → SMS code ──────────────── */

account.post('/auth/register', authLimit, async (req, res) => {
  const b = body(req, z.object({ name: z.string().trim().min(2, 'Your full name, please.').max(80), email, phone, password }));
  const byPhone = await db().clients.one({ phone: b.phone });
  if (byPhone?.passwordHash) throw new HttpError(409, 'EXISTS', 'This number already has an account. Sign in, or reset your password.');
  const byEmail = await db().clients.one({ email: b.email });
  if (byEmail?.passwordHash && byEmail.phone !== b.phone) throw new HttpError(409, 'EXISTS', 'This email already has an account. Sign in instead.');
  res.json(await sendOtp('register', b.phone, { name: b.name, email: b.email, hash: await hashPassword(b.password) }));
});

account.post('/auth/register/verify', authLimit, async (req, res) => {
  const b = body(req, z.object({ phone, code: codeField }));
  const o = await useOtp('register', b.phone, b.code);
  const p = o.payload!;
  const found = await db().clients.one({ phone: b.phone });
  // A guest who ordered or booked with this number keeps everything — the account simply attaches to it
  const client = found
    ? (await db().clients.set(found._id, { name: p.name, email: p.email, passwordHash: p.hash, verified: true, failedLogins: 0 }))!
    : await db().clients.insert({ _id: 'c-' + uid(), name: p.name, phone: b.phone, email: p.email, since: Date.now(), measures: {}, notes: '', passwordHash: p.hash, verified: true, tokenVersion: 0, failedLogins: 0 });
  setClientSession(res, client._id, client.tokenVersion ?? 0);
  res.status(found ? 200 : 201).json({ ...(await me(client._id)), attached: !!found });
});

/* ── sign in: email or phone + password ─────────────────────────────── */

account.post('/auth/login', authLimit, async (req, res) => {
  const b = body(req, z.object({ id: z.string().trim().min(3, 'Your email or mobile number.'), password: z.string().min(1, 'Your password.') }));
  const asPhone = normPhone(b.id);
  const c = asPhone ? await db().clients.one({ phone: asPhone }) : await db().clients.one({ email: b.id.toLowerCase() });
  const wrong = new HttpError(401, 'WRONG', 'That email or number and password do not match.');
  if (!c || !c.passwordHash) {
    await burn(b.password); // same time either way
    throw wrong;
  }
  if (c.lockedUntil && c.lockedUntil > Date.now()) throw new HttpError(429, 'LOCKED', `Too many attempts. Try again in ${Math.ceil((c.lockedUntil - Date.now()) / 60_000)} minutes, or reset your password.`);
  if (!(await checkPassword(b.password, c.passwordHash))) {
    const n = (c.failedLogins ?? 0) + 1;
    await db().clients.set(c._id, n >= MAX_TRIES ? { failedLogins: 0, lockedUntil: Date.now() + LOCK_MS } : { failedLogins: n });
    throw n >= MAX_TRIES ? new HttpError(429, 'LOCKED', 'Too many attempts. Your account is locked for 15 minutes.') : wrong;
  }
  await db().clients.set(c._id, { failedLogins: 0, lockedUntil: 0 });
  setClientSession(res, c._id, c.tokenVersion ?? 0);
  res.json(await me(c._id));
});

/** Sign in with a one-time code instead of a password */
account.post('/auth/otp', authLimit, async (req, res) => {
  const { phone: p } = body(req, z.object({ phone }));
  const client = await db().clients.one({ phone: p });
  if (!client) throw new HttpError(404, 'UNKNOWN', 'We do not have this number yet. Create an account, or book a fitting and your portal opens.');
  res.json(await sendOtp('signin', p));
});
account.post('/auth/otp/verify', authLimit, async (req, res) => {
  const b = body(req, z.object({ phone, code: codeField }));
  await useOtp('signin', b.phone, b.code);
  const c = (await db().clients.one({ phone: b.phone }))!;
  setClientSession(res, c._id, c.tokenVersion ?? 0);
  res.json(await me(c._id));
});

/* ── forgot password ─────────────────────────────────────────────────── */

/** Always answers the same, so it cannot be used to find out who has an account */
account.post('/auth/forgot', authLimit, async (req, res) => {
  const { phone: p } = body(req, z.object({ phone }));
  const c = await db().clients.one({ phone: p });
  let demo: { demoCode?: string } = {};
  if (c?.passwordHash) demo = await sendOtp('reset', p).catch(() => ({}));
  res.json({ sent: true, ...(env.DEMO_MODE ? { demoCode: demo.demoCode ?? env.DEMO_OTP_CODE } : {}) });
});
account.post('/auth/reset', authLimit, async (req, res) => {
  const b = body(req, z.object({ phone, code: codeField, password }));
  await useOtp('reset', b.phone, b.code);
  const c = await db().clients.one({ phone: b.phone });
  if (!c) throw new HttpError(400, 'WRONG', 'That code is not right.');
  const tv = (c.tokenVersion ?? 0) + 1; // signs out every other device
  await db().clients.set(c._id, { passwordHash: await hashPassword(b.password), tokenVersion: tv, failedLogins: 0, lockedUntil: 0 });
  setClientSession(res, c._id, tv);
  res.json(await me(c._id));
});

/** Demo only: one tap into the sample client's portal */
account.post('/auth/demo-client', async (_req, res) => {
  if (!env.DEMO_MODE) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  const c = await db().clients.one({ phone: '01700000000' });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Demo client missing.');
  setClientSession(res, c._id, c.tokenVersion ?? 0);
  res.json(await me(c._id));
});

account.post('/auth/logout', (_req, res) => {
  clearClientSession(res);
  res.json({ ok: true });
});

/* ── the client's own account ────────────────────────────────────────── */

account.patch('/me', requireClient, async (req, res) => {
  const b = body(req, z.object({ name: z.string().trim().min(2).max(80).optional(), email: z.union([z.literal(''), email]).optional(), address: z.object({ address: z.string().trim().max(200), area: z.string().trim().max(60), city: z.string().trim().max(60) }).optional() }));
  if (b.email) {
    const other = await db().clients.one({ email: b.email });
    if (other && other._id !== clientId(req)) throw new HttpError(409, 'EXISTS', 'Another account uses this email.');
  }
  await db().clients.set(clientId(req), b);
  res.json(await me(clientId(req)));
});

account.post('/me/password', requireClient, async (req, res) => {
  const b = body(req, z.object({ current: z.string().default(''), next: password }));
  const c = (await db().clients.get(clientId(req)))!;
  if (c.passwordHash && !(await checkPassword(b.current, c.passwordHash))) throw new HttpError(400, 'WRONG', 'Your current password is not right.');
  const tv = (c.tokenVersion ?? 0) + 1;
  await db().clients.set(c._id, { passwordHash: await hashPassword(b.next), tokenVersion: tv, verified: true });
  setClientSession(res, c._id, tv);
  res.json(await me(c._id));
});

account.put('/me/saved/:slug', requireClient, async (req, res) => {
  const c = (await db().clients.get(clientId(req)))!;
  const slug = String(req.params.slug);
  const saved = c.saved?.includes(slug) ? c.saved.filter((s) => s !== slug) : [...(c.saved ?? []), slug];
  await db().clients.set(c._id, { saved });
  res.json(await me(c._id));
});

account.post('/me/bookings/:id/cancel', requireClient, async (req, res) => {
  const id = String(req.params.id);
  const b = await db().bookings.get(id);
  if (!b || b.clientId !== clientId(req)) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  if (b.status === 'attended') throw new HttpError(409, 'DONE', 'This appointment has already happened.');
  await db().bookings.set(id, { status: 'cancelled', history: [...(b.history ?? []), { at: Date.now(), by: b.name, text: 'Cancelled by the client in the portal' }] });
  res.json(await me(clientId(req)));
});

/* ── staff sign-in (separate cookie, separate secret) ───────────────── */

account.post('/staff/login', authLimit, async (req, res) => {
  const b = body(req, z.object({ email: z.string().trim().toLowerCase(), password: z.string() }));
  const s = await db().staff.one({ email: b.email });
  const wrong = new HttpError(401, 'WRONG', 'That email and password do not match.');
  if (!s) {
    await burn(b.password);
    throw wrong;
  }
  if (!s.active) throw new HttpError(403, 'INACTIVE', 'This account has been switched off. Ask the owner.');
  if (s.lockedUntil && s.lockedUntil > Date.now()) throw new HttpError(429, 'LOCKED', `Too many attempts. Try again in ${Math.ceil((s.lockedUntil - Date.now()) / 60_000)} minutes.`);
  if (!(await checkPassword(b.password, s.passwordHash))) {
    const n = s.failedLogins + 1;
    await db().staff.set(s._id, n >= MAX_TRIES ? { failedLogins: 0, lockedUntil: Date.now() + LOCK_MS } : { failedLogins: n });
    throw n >= MAX_TRIES ? new HttpError(429, 'LOCKED', 'Too many attempts. This account is locked for 15 minutes.') : wrong;
  }
  const done = (await db().staff.set(s._id, { failedLogins: 0, lockedUntil: 0, lastLoginAt: Date.now() }))!;
  setStaffSession(res, done);
  res.json({ staff: publicStaff(done) });
});

account.post('/staff/logout', (_req, res) => {
  clearStaffSession(res);
  res.json({ ok: true });
});

account.get('/staff/me', async (req, res) => {
  const s = await readStaff(req);
  res.json({ staff: s ? publicStaff(s) : null });
});

account.post('/staff/password', requireStaff(), async (req, res) => {
  const b = body(req, z.object({ current: z.string(), next: password }));
  const s = staffOf(req);
  if (!(await checkPassword(b.current, s.passwordHash))) throw new HttpError(400, 'WRONG', 'Your current password is not right.');
  const done = (await db().staff.set(s._id, { passwordHash: await hashPassword(b.next), tokenVersion: s.tokenVersion + 1 }))!;
  await audit(req, 'Changed own password', s.email);
  setStaffSession(res, done);
  res.json({ staff: publicStaff(done) });
});
