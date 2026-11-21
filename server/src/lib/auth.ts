import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { env } from '../env.js';
import { db } from '../db.js';
import { HttpError } from './util.js';
import type { Role, Staff } from '../types.js';

/**
 * Two separate sessions, as in Ruposhi 2:
 *  - clients: cookie `nx_session`, signed with JWT_SECRET, CUSTOMER_SESSION_DAYS
 *  - staff:   cookie `nx_staff`,   signed with JWT_ADMIN_SECRET, ADMIN_SESSION_HOURS
 * A client session can never open the console. Each token carries a version:
 * changing a password, a role or deactivating someone signs out every other device.
 */
const CLIENT = 'nx_session';
const STAFF = 'nx_staff';

const cookie = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax', // the site reaches the API through its own /api proxy, so cookies are first-party
  maxAge,
  path: '/',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

/* ── passwords ───────────────────────────────────────────────────────── */

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const checkPassword = (p: string, h?: string) => (h ? bcrypt.compare(p, h) : Promise.resolve(false));
/** Spend the same time when the account does not exist, so timing reveals nothing */
let dummy: string | null = null;
export async function burn(p: string) {
  dummy ??= await hashPassword('not-a-real-password-1');
  await checkPassword(p, dummy);
}
export const MAX_TRIES = 5;
export const LOCK_MS = 15 * 60_000;

/* ── clients ─────────────────────────────────────────────────────────── */

type ClientToken = { sub: string; tv: number };
export function setClientSession(res: Response, id: string, tokenVersion = 0) {
  const days = env.CUSTOMER_SESSION_DAYS;
  res.cookie(CLIENT, jwt.sign({ sub: id, tv: tokenVersion } satisfies ClientToken, env.JWT_SECRET, { expiresIn: `${days}d` }), cookie(days * 86_400_000));
}
export const clearClientSession = (res: Response) => res.clearCookie(CLIENT, { path: '/', ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}) });

export async function readClient(req: Request) {
  const t = req.cookies?.[CLIENT];
  if (!t) return null;
  try {
    const p = jwt.verify(t, env.JWT_SECRET) as ClientToken;
    const c = await db().clients.get(p.sub);
    if (!c || (c.tokenVersion ?? 0) !== (p.tv ?? 0)) return null;
    return c;
  } catch {
    return null;
  }
}
export const requireClient = async (req: Request, _res: Response, next: NextFunction) => {
  const c = await readClient(req);
  if (!c) return next(new HttpError(401, 'SIGN_IN', 'Please sign in.'));
  (req as Request & { clientId: string }).clientId = c._id;
  next();
};
export const clientId = (req: Request) => (req as Request & { clientId: string }).clientId;

/* ── staff ───────────────────────────────────────────────────────────── */

export const ROLES: Record<Role, { label: string; can: Perm[] }> = {
  owner: { label: 'Owner', can: ['overview', 'fittings', 'production', 'orders', 'clients', 'catalogue', 'editions', 'messages', 'reports', 'settings', 'staff', 'audit', 'backup'] },
  manager: { label: 'Manager', can: ['overview', 'fittings', 'production', 'orders', 'clients', 'catalogue', 'editions', 'messages', 'reports', 'settings', 'audit'] },
  tailor: { label: 'Tailor', can: ['overview', 'fittings', 'production', 'clients'] },
  orders: { label: 'Orders', can: ['overview', 'orders', 'fittings', 'clients', 'messages'] },
  content: { label: 'Content', can: ['overview', 'catalogue', 'editions', 'messages'] },
};
export type Perm = 'overview' | 'fittings' | 'production' | 'orders' | 'clients' | 'catalogue' | 'editions' | 'messages' | 'reports' | 'settings' | 'staff' | 'audit' | 'backup';
export const can = (s: Pick<Staff, 'role'>, p: Perm) => ROLES[s.role].can.includes(p);

type StaffToken = { sub: string; tv: number };
export function setStaffSession(res: Response, s: Staff) {
  const h = env.ADMIN_SESSION_HOURS;
  res.cookie(STAFF, jwt.sign({ sub: s._id, tv: s.tokenVersion } satisfies StaffToken, env.JWT_ADMIN_SECRET, { expiresIn: `${h}h` }), cookie(h * 3_600_000));
}
export const clearStaffSession = (res: Response) => res.clearCookie(STAFF, { path: '/', ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}) });

export async function readStaff(req: Request) {
  const t = req.cookies?.[STAFF];
  if (!t) return null;
  try {
    const p = jwt.verify(t, env.JWT_ADMIN_SECRET) as StaffToken;
    const s = await db().staff.get(p.sub);
    if (!s || !s.active || s.tokenVersion !== p.tv) return null;
    return s;
  } catch {
    return null;
  }
}
/** Signed-in staff, optionally with one permission */
export const requireStaff = (perm?: Perm) => async (req: Request, _res: Response, next: NextFunction) => {
  const s = await readStaff(req);
  if (!s) return next(new HttpError(401, 'SIGN_IN', 'Atelier sign-in required.'));
  if (perm && !can(s, perm)) return next(new HttpError(403, 'FORBIDDEN', `Your role (${ROLES[s.role].label}) cannot do this.`));
  (req as Request & { staff: Staff }).staff = s;
  next();
};
export const staffOf = (req: Request) => (req as Request & { staff: Staff }).staff;
export const publicStaff = (s: Staff) => ({ _id: s._id, name: s.name, email: s.email, role: s.role, active: s.active, lastLoginAt: s.lastLoginAt, createdAt: s.createdAt, can: ROLES[s.role].can });

/* ── one-time codes ──────────────────────────────────────────────────── */

export const hashCode = (phone: string, codeV: string) => crypto.createHmac('sha256', env.OTP_SECRET).update(phone + ':' + codeV).digest('hex');
export const newCode = () => (env.DEMO_MODE ? env.DEMO_OTP_CODE : String(crypto.randomInt(100000, 1000000)));
export const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
/** Link keys for receipts and invitations */
export const viewKey = (id: string) => crypto.createHmac('sha256', env.PAYMENT_SECRET).update(id).digest('hex').slice(0, 20);
