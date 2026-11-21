import { Router, type Request } from 'express';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { allPieces, getPiece, STAGE_SLUGS } from '../catalogue.js';
import { connect, db, resetMemory } from '../db.js';
import { env } from '../env.js';
import { can, hashPassword, publicStaff, requireStaff, ROLES, staffOf, type Perm } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { body, code, dhakaDate, HttpError, normPhone, phone, uid } from '../lib/util.js';
import { checkImage, signUpload } from '../lib/uploads.js';
import { forgetSettings, getSettings, openOn } from '../lib/settings.js';
import { later, sendSms } from '../lib/notify.js';
import { seedIfEmpty } from '../seed.js';
import { COLLECTIONS, type Client, type Collections, type Order, type Piece, type Role } from '../types.js';

export const atelier = Router();
atelier.use(requireStaff());

const p = (v: unknown) => String(v);
const by = (req: Request) => staffOf(req).name;
const step = (req: Request, text: string) => ({ at: Date.now(), by: by(req), text });
const need = (perm: Perm) => requireStaff(perm);
const notFound = () => new HttpError(404, 'NOT_FOUND', 'Not found.');
const safeClient = (c: Client) => {
  const { passwordHash, tokenVersion, failedLogins, lockedUntil, ...rest } = c;
  void tokenVersion; void failedLogins; void lockedUntil;
  return { ...rest, hasPassword: !!passwordHash };
};

/* ── Everything the console shows, in one call (trimmed to the role) ── */

atelier.get('/state', async (req, res) => {
  const me = staffOf(req);
  const s = db();
  const has = (x: Perm) => can(me, x);
  const [orders, bookings, clients, commissions, editions, messages, subscribers, pieces, settings, staff] = await Promise.all([
    has('orders') || has('reports') ? s.orders.all(undefined, { by: 'createdAt', dir: -1 }) : [],
    has('fittings') || has('overview') ? s.bookings.all(undefined, { by: 'date', dir: 1 }) : [],
    has('clients') || has('fittings') || has('production') || has('orders') ? s.clients.all(undefined, { by: 'name', dir: 1 }) : [],
    has('production') || has('overview') ? s.commissions.all() : [],
    s.editions.all(),
    has('messages') ? s.messages.all(undefined, { by: 'createdAt', dir: -1 }) : [],
    has('messages') ? s.subscribers.count() : 0,
    allPieces(),
    getSettings(),
    has('staff') ? s.staff.all(undefined, { by: 'createdAt', dir: 1 }) : [],
  ]);
  res.json({
    me: publicStaff(me),
    roles: Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v])),
    orders,
    bookings,
    clients: clients.map(safeClient),
    commissions,
    remaining: Object.fromEntries(editions.map((e) => [e._id, e.remaining])),
    messages,
    subscribers,
    pieces,
    settings,
    staff: staff.map(publicStaff),
    cloudinary: !!env.cloudinary,
    demo: env.DEMO_MODE,
  });
});

/* ── Fittings ───────────────────────────────────────────────────────── */

async function checkSlot(date: string, time: string, exceptId?: string) {
  const st = await getSettings();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(422, 'INVALID', 'Choose a date.');
  if (!st.hours.includes(time)) throw new HttpError(422, 'INVALID', 'Choose one of the atelier’s hours.');
  if (!openOn(st, date)) throw new HttpError(422, 'INVALID', 'The atelier is closed that day (see Settings).');
  const clash = (await db().bookings.all({ date, time })).some((x) => x.status !== 'cancelled' && x._id !== exceptId);
  if (clash) throw new HttpError(409, 'TAKEN', 'Someone is already booked at that hour.');
}

/** A walk-in or a booking taken by phone */
atelier.post('/bookings', need('fittings'), async (req, res) => {
  const b = body(
    req,
    z.object({
      date: z.string(),
      time: z.string(),
      purpose: z.enum(['new-piece', 'fitting', 'alteration', 'consultation']),
      pieceSlug: z.string().optional(),
      name: z.string().trim().min(2).max(80),
      phone,
      email: z.union([z.literal(''), z.string().email()]).default(''),
      note: z.string().max(500).default(''),
      depositPaid: z.boolean().default(false),
    }),
  );
  await checkSlot(b.date, b.time);
  const { clientFor } = await import('../lib/flows.js');
  const client = await clientFor(b);
  const st = await getSettings();
  const deposit = b.purpose === 'new-piece' ? st.deposit : 0;
  const booking = await db().bookings.insert({
    _id: code('FT'),
    createdAt: Date.now(),
    date: b.date,
    time: b.time,
    purpose: b.purpose,
    pieceSlug: b.pieceSlug || undefined,
    name: b.name,
    phone: b.phone,
    email: b.email,
    note: b.note,
    deposit,
    depositMethod: deposit && b.depositPaid ? 'cash' : undefined,
    status: deposit && !b.depositPaid ? 'awaiting-deposit' : 'confirmed',
    clientId: client._id,
    source: 'atelier',
    history: [step(req, 'Booked at the atelier')],
  });
  if (booking.status === 'confirmed') {
    const { bookingConfirmation } = await import('../lib/flows.js');
    later(bookingConfirmation(booking));
  }
  await audit(req, 'Booked a fitting', booking._id, undefined, booking);
  res.status(201).json(booking);
});

atelier.patch('/bookings/:id', need('fittings'), async (req, res) => {
  const b = body(req, z.object({ status: z.enum(['confirmed', 'attended', 'cancelled']).optional(), date: z.string().optional(), time: z.string().optional(), note: z.string().max(500).optional(), depositPaid: z.boolean().optional() }));
  const before = await db().bookings.get(p(req.params.id));
  if (!before) throw notFound();
  const history = [...(before.history ?? [])];
  const patch: Record<string, unknown> = {};
  if (b.date || b.time) {
    const date = b.date ?? before.date;
    const time = b.time ?? before.time;
    await checkSlot(date, time, before._id);
    Object.assign(patch, { date, time });
    history.push(step(req, `Moved from ${before.date} ${before.time} to ${date} ${time}`));
    later(sendSms(before.phone, `Nirolax: your appointment ${before._id} has moved to ${date} at ${time}. We look forward to seeing you.`, 'booking'));
  }
  if (b.status && b.status !== before.status) {
    patch.status = b.status;
    history.push(step(req, { confirmed: 'Confirmed', attended: 'Marked as attended', cancelled: 'Cancelled' }[b.status]));
  }
  if (b.depositPaid && before.status === 'awaiting-deposit') {
    Object.assign(patch, { status: 'confirmed', depositMethod: 'cash' });
    history.push(step(req, 'Deposit received at the atelier'));
  }
  if (b.note !== undefined) patch.note = b.note;
  const out = await db().bookings.set(before._id, { ...patch, history });
  await audit(req, 'Updated a fitting', before._id, before, out);
  res.json(out);
});

/* ── Production ─────────────────────────────────────────────────────── */

atelier.post('/commissions', need('production'), async (req, res) => {
  const b = body(req, z.object({ clientId: z.string(), pieceSlug: z.string() }));
  const item = await getPiece(b.pieceSlug);
  if (!item || !(await db().clients.get(b.clientId))) throw new HttpError(422, 'INVALID', 'Unknown client or piece.');
  const n = await db().takeEdition(b.pieceSlug);
  if (n === null) throw new HttpError(409, 'SOLD_OUT', 'This edition has closed.');
  const c = await db().commissions.insert({
    _id: code('MT'),
    clientId: b.clientId,
    pieceSlug: b.pieceSlug,
    editionNo: n,
    price: item.mtm,
    stage: 1,
    stageDates: STAGE_SLUGS.map((_, i) => (i === 0 ? Date.now() : null)),
    photos: {},
    readyBy: dhakaDate(Date.now() + 35 * 86400000),
    notes: '',
  });
  await audit(req, 'Opened a commission', c._id, undefined, c);
  res.status(201).json(c);
});

atelier.patch('/commissions/:id', need('production'), async (req, res) => {
  const b = body(req, z.object({ move: z.union([z.literal(1), z.literal(-1)]).optional(), readyBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), notes: z.string().max(2000).optional() }));
  const c = await db().commissions.get(p(req.params.id));
  if (!c) throw notFound();
  const patch: Partial<typeof c> = {};
  if (b.move) {
    const stage = Math.min(STAGE_SLUGS.length - 1, Math.max(0, c.stage + b.move));
    const stageDates = [...c.stageDates];
    if (b.move === 1 && stage !== c.stage) stageDates[c.stage] = Date.now();
    if (b.move === -1) stageDates[stage] = null;
    Object.assign(patch, { stage, stageDates });
  }
  if (b.readyBy) patch.readyBy = b.readyBy;
  if (b.notes !== undefined) patch.notes = b.notes;
  const out = await db().commissions.set(c._id, patch);
  await audit(req, b.move ? `Moved to ${STAGE_SLUGS[out!.stage]}` : 'Updated a commission', c._id, c, out);
  res.json(out);
});

atelier.put('/commissions/:id/photos/:stage', need('production'), async (req, res) => {
  const stage = p(req.params.stage);
  if (!STAGE_SLUGS.includes(stage)) throw new HttpError(422, 'INVALID', 'Unknown stage.');
  const c = await db().commissions.get(p(req.params.id));
  if (!c) throw notFound();
  const { url, dataUrl } = body(req, z.object({ url: z.string().optional(), dataUrl: z.string().optional() }));
  const img = checkImage(url ?? dataUrl ?? '');
  const out = await db().commissions.set(c._id, { photos: { ...c.photos, [stage]: img } });
  await audit(req, `Added a ${stage} photo`, c._id);
  res.json(out);
});

atelier.delete('/commissions/:id/photos/:stage', need('production'), async (req, res) => {
  const c = await db().commissions.get(p(req.params.id));
  if (!c) throw notFound();
  const photos = { ...c.photos };
  delete photos[p(req.params.stage)];
  const out = await db().commissions.set(c._id, { photos });
  await audit(req, `Removed a ${p(req.params.stage)} photo`, c._id);
  res.json(out);
});

/* ── Orders ─────────────────────────────────────────────────────────── */

const statusText: Record<Order['status'], string> = { 'awaiting-payment': 'Awaiting payment', confirmed: 'Confirmed', packed: 'Pressed & boxed', shipped: 'With the courier', delivered: 'Delivered', cancelled: 'Cancelled' };

atelier.patch('/orders/:id', need('orders'), async (req, res) => {
  const b = body(req, z.object({ status: z.enum(['confirmed', 'packed', 'shipped', 'delivered']) }));
  const o = await db().orders.get(p(req.params.id));
  if (!o) throw notFound();
  if (o.status === 'cancelled') throw new HttpError(409, 'CANCELLED', 'This order is cancelled.');
  const patch: Partial<Order> = { status: b.status, timeline: [...(o.timeline ?? []), step(req, statusText[b.status])] };
  if (b.status === 'delivered' && o.payment === 'cod' && !o.paid) {
    patch.paid = true;
    patch.timeline!.push(step(req, 'Cash received on delivery'));
  }
  const out = await db().orders.set(o._id, patch);
  if (b.status === 'shipped' || b.status === 'delivered')
    later(sendSms(o.customer.phone, b.status === 'shipped' ? `Nirolax: your order ${o._id} is on its way${o.courier ? ` with ${o.courier.name} (${o.courier.tracking})` : ''}. The courier will call before arriving.` : `Nirolax: your order ${o._id} has been delivered. Thank you — we hope it fits beautifully.`, 'order'));
  await audit(req, `Order → ${statusText[b.status]}`, o._id, { status: o.status }, { status: b.status });
  res.json(out);
});

atelier.post('/orders/:id/notes', need('orders'), async (req, res) => {
  const { text } = body(req, z.object({ text: z.string().trim().min(1).max(1000) }));
  const o = await db().orders.get(p(req.params.id));
  if (!o) throw notFound();
  const out = await db().orders.set(o._id, { notes: [...(o.notes ?? []), step(req, text)] });
  await audit(req, 'Added an order note', o._id, undefined, { text });
  res.json(out);
});

atelier.post('/orders/:id/courier', need('orders'), async (req, res) => {
  const { name } = body(req, z.object({ name: z.enum(['Steadfast', 'Pathao', 'RedX', 'Atelier']) }));
  const o = await db().orders.get(p(req.params.id));
  if (!o) throw notFound();
  if (o.status === 'cancelled' || o.status === 'awaiting-payment') throw new HttpError(409, 'NOT_READY', 'Only confirmed orders can be sent.');
  // Demo booking: a real integration would call the courier's API here and keep its consignment id
  const tracking = name === 'Atelier' ? 'NX-' + uid().slice(0, 6).toUpperCase() : `${name.slice(0, 2).toUpperCase()}${Date.now().toString().slice(-8)}`;
  const out = await db().orders.set(o._id, {
    courier: { name, tracking, bookedAt: Date.now() },
    status: o.status === 'confirmed' ? 'packed' : o.status,
    timeline: [...(o.timeline ?? []), step(req, `Courier booked — ${name} ${tracking}`)],
  });
  await audit(req, `Booked ${name}`, o._id, undefined, { tracking });
  res.json(out);
});

atelier.post('/orders/:id/cancel', need('orders'), async (req, res) => {
  const b = body(req, z.object({ reason: z.string().trim().min(3, 'Give a short reason.').max(300), refund: z.boolean().default(true) }));
  const o = await db().orders.get(p(req.params.id));
  if (!o) throw notFound();
  if (o.status === 'cancelled') throw new HttpError(409, 'CANCELLED', 'Already cancelled.');
  if (o.status === 'delivered') throw new HttpError(409, 'DELIVERED', 'Delivered orders are returned, not cancelled.');
  // Each numbered piece goes back to its edition (the number itself is retired, never reused)
  for (const it of o.items) {
    if (!it.editionNo) continue;
    const e = await db().editions.get(it.slug);
    if (e) await db().editions.set(it.slug, { remaining: e.remaining + 1 });
  }
  const refund = o.paid && b.refund ? { amount: o.total, at: Date.now(), method: o.payment === 'cod' ? 'bKash' : o.payment === 'bkash' ? 'bKash (original account)' : 'Card (original card)', reason: b.reason } : undefined;
  const out = await db().orders.set(o._id, {
    status: 'cancelled',
    ...(refund ? { refund } : {}),
    timeline: [...(o.timeline ?? []), step(req, `Cancelled — ${b.reason}${refund ? ` · refund of BDT ${o.total.toLocaleString('en-IN')} started` : ''}`)],
  });
  later(sendSms(o.customer.phone, `Nirolax: your order ${o._id} has been cancelled.${refund ? ' Your refund is on its way and arrives within 7 working days.' : ''} We are sorry for the trouble.`, 'order'));
  await audit(req, 'Cancelled an order', o._id, { status: o.status }, { status: 'cancelled', reason: b.reason, refund });
  res.json(out);
});

/* ── Clients ────────────────────────────────────────────────────────── */

atelier.post('/clients', need('clients'), async (req, res) => {
  const b = body(req, z.object({ name: z.string().trim().min(2).max(80), phone, email: z.union([z.literal(''), z.string().trim().toLowerCase().email()]).default(''), notes: z.string().max(2000).default('') }));
  if (await db().clients.one({ phone: b.phone })) throw new HttpError(409, 'EXISTS', 'A client with this number already exists.');
  const c = await db().clients.insert({ _id: 'c-' + uid(), name: b.name, phone: b.phone, email: b.email, since: Date.now(), measures: {}, notes: b.notes });
  await audit(req, 'Added a client', c._id, undefined, c);
  res.status(201).json(safeClient(c));
});

atelier.patch('/clients/:id', need('clients'), async (req, res) => {
  const b = body(
    req,
    z.object({
      name: z.string().trim().min(2).max(80).optional(),
      phone: z.string().optional(),
      email: z.union([z.literal(''), z.string().trim().toLowerCase().email()]).optional(),
      measures: z.record(z.string(), z.number().min(0).max(300).optional()).optional(),
      notes: z.string().max(2000).optional(),
      measuredBy: z.string().max(60).optional(),
    }),
  );
  const before = await db().clients.get(p(req.params.id));
  if (!before) throw notFound();
  const patch: Partial<Client> = { ...b, ...(b.measures ? { measuredAt: Date.now() } : {}) };
  if (b.phone !== undefined) {
    const np = normPhone(b.phone);
    if (!np) throw new HttpError(422, 'INVALID', 'A Bangladeshi mobile number, e.g. 01700 000000.');
    const other = await db().clients.one({ phone: np });
    if (other && other._id !== before._id) throw new HttpError(409, 'EXISTS', 'Another client has this number.');
    patch.phone = np;
  }
  const out = await db().clients.set(before._id, patch);
  await audit(req, b.measures ? 'Saved a measure sheet' : 'Updated a client', before._id, before, out);
  res.json(safeClient(out!));
});

/** Privacy: the client asked to be forgotten. Orders stay (tax law) but lose the personal details. */
atelier.delete('/clients/:id', need('settings'), async (req, res) => {
  const c = await db().clients.get(p(req.params.id));
  if (!c) throw notFound();
  if ((await db().commissions.all({ clientId: c._id })).some((x) => x.stage < STAGE_SLUGS.length - 1)) throw new HttpError(409, 'IN_WORK', 'This client has a piece in the workroom. Finish it first.');
  for (const o of await db().orders.all({ clientId: c._id }))
    await db().orders.set(o._id, { clientId: undefined, customer: { ...o.customer, name: 'Removed client', phone: '00000000000', email: '', address: '' } });
  for (const bk of await db().bookings.all({ clientId: c._id })) await db().bookings.set(bk._id, { clientId: undefined, name: 'Removed client', phone: '00000000000', email: '', note: '' });
  for (const m of await db().commissions.all({ clientId: c._id })) await db().commissions.remove(m._id);
  await db().clients.remove(c._id);
  await audit(req, 'Deleted a client (privacy request)', c._id, { name: c.name, phone: c.phone }, undefined);
  res.json({ ok: true });
});

/* ── Catalogue ──────────────────────────────────────────────────────── */

const pieceIn = z.object({
  name: z.string().trim().min(2).max(80),
  no: z.string().trim().max(4),
  kind: z.enum(['Tailoring', 'Evening', 'Ceremony']),
  cloth: z.string().trim().max(120),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i, 'A colour like #16161a.'),
  rtw: z.number().int().min(0).max(10_000_000),
  mtm: z.number().int().min(0).max(10_000_000),
  edition: z.number().int().min(1).max(999),
  sizes: z.array(z.string().trim().min(1).max(6)).min(1).max(12),
  soldOut: z.array(z.string()).default([]),
  line: z.string().trim().max(160),
  story: z.string().trim().max(2000),
  details: z.array(z.object({ title: z.string().trim().max(60), body: z.string().trim().max(400) })).max(8),
  composition: z.string().trim().max(300),
  care: z.string().trim().max(400),
  images: z.partialRecord(z.enum(['front', 'left', 'back', 'right']), z.string()).optional(),
  published: z.boolean().default(false),
});
const slugify = (s: string) => s.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

atelier.post('/pieces', need('catalogue'), async (req, res) => {
  const b = body(req, pieceIn);
  let slug = slugify(b.name);
  if (await getPiece(slug)) slug = `${slug}-${uid().slice(0, 4)}`;
  const images = b.images ? Object.fromEntries(Object.entries(b.images).filter(([, v]) => v).map(([k, v]) => [k, checkImage(v)])) : undefined;
  const count = await db().pieces.count();
  const piece: Piece = { _id: slug, slug, ...b, images, order: count + 1, updatedAt: Date.now() };
  await db().pieces.insert(piece);
  await db().editions.insert({ _id: slug, remaining: b.edition, next: 1 });
  await audit(req, 'Added a piece', slug, undefined, piece);
  res.status(201).json(piece);
});

atelier.patch('/pieces/:slug', need('catalogue'), async (req, res) => {
  const b = body(req, pieceIn.partial());
  const before = await getPiece(p(req.params.slug));
  if (!before) throw notFound();
  const patch: Partial<Piece> = { ...b, updatedAt: Date.now() };
  if (b.images) patch.images = Object.fromEntries(Object.entries(b.images).filter(([, v]) => v).map(([k, v]) => [k, checkImage(v)]));
  if (b.edition !== undefined && b.edition !== before.edition) {
    const e = await db().editions.get(before.slug);
    const sold = e ? before.edition - e.remaining : 0;
    if (b.edition < sold) throw new HttpError(422, 'INVALID', `${sold} are already numbered — the edition cannot be smaller.`);
    if (e) await db().editions.set(before.slug, { remaining: b.edition - sold });
  }
  const out = await db().pieces.set(before._id, patch);
  await audit(req, 'Edited a piece', before._id, before, out);
  res.json(out);
});

atelier.post('/pieces/reorder', need('catalogue'), async (req, res) => {
  const { slugs } = body(req, z.object({ slugs: z.array(z.string()).min(1) }));
  for (const [i, s] of slugs.entries()) await db().pieces.set(s, { order: i + 1 });
  await audit(req, 'Reordered the season', 'pieces', undefined, slugs);
  res.json({ ok: true });
});

atelier.delete('/pieces/:slug', need('catalogue'), async (req, res) => {
  const piece = await getPiece(p(req.params.slug));
  if (!piece) throw notFound();
  const sold = (await db().orders.all()).some((o) => o.items.some((i) => i.slug === piece.slug)) || (await db().commissions.all({ pieceSlug: piece.slug })).length > 0;
  if (sold) throw new HttpError(409, 'SOLD', 'This piece has been sold, so it stays on record. Unpublish it instead.');
  await db().pieces.remove(piece._id);
  await db().editions.remove(piece._id);
  await audit(req, 'Deleted a piece', piece._id, piece, undefined);
  res.json({ ok: true });
});

atelier.post('/uploads/sign', async (req, res) => {
  const { folder } = body(req, z.object({ folder: z.enum(['pieces', 'stages']) }));
  const me = staffOf(req);
  if (!can(me, folder === 'pieces' ? 'catalogue' : 'production')) throw new HttpError(403, 'FORBIDDEN', 'Your role cannot upload here.');
  res.json(signUpload(folder) ?? { cloudinary: false });
});

atelier.patch('/editions/:slug', need('editions'), async (req, res) => {
  const item = await getPiece(p(req.params.slug));
  if (!item) throw notFound();
  const { remaining } = body(req, z.object({ remaining: z.number().int().min(0).max(item.edition) }));
  const before = await db().editions.get(item.slug);
  const out = await db().editions.set(item.slug, { remaining });
  await audit(req, 'Changed edition count', item.slug, { remaining: before?.remaining }, { remaining });
  res.json(out);
});

/* ── Messages, outbox, subscribers ──────────────────────────────────── */

atelier.patch('/messages/:id', need('messages'), async (req, res) => {
  const b = body(req, z.object({ read: z.boolean() }));
  const out = await db().messages.set(p(req.params.id), b);
  if (!out) throw notFound();
  res.json(out);
});
atelier.get('/outbox', need('messages'), async (_req, res) => {
  res.json({ outbox: (await db().outbox.all(undefined, { by: 'at', dir: -1 })).slice(0, 200) });
});
atelier.get('/subscribers', need('messages'), async (_req, res) => {
  res.json({ subscribers: await db().subscribers.all(undefined, { by: 'createdAt', dir: -1 }) });
});

/* ── Settings ───────────────────────────────────────────────────────── */

const time = z.string().regex(/^\d{2}:\d{2}$/);
atelier.put('/settings', need('settings'), async (req, res) => {
  const b = body(
    req,
    z.object({
      atelier: z.object({ name: z.string().trim().min(1).max(60), address1: z.string().trim().max(120), address2: z.string().trim().max(120), phone: z.string().trim().max(30), whatsapp: z.string().trim().regex(/^\d{8,15}$/, 'WhatsApp number in digits, e.g. 8801711000000.'), email: z.string().trim().email() }),
      social: z
        .object({
          instagram: z.union([z.literal(''), z.string().trim().url().max(200)]),
          facebook: z.union([z.literal(''), z.string().trim().url().max(200)]),
          youtube: z.union([z.literal(''), z.string().trim().url().max(200)]),
          pinterest: z.union([z.literal(''), z.string().trim().url().max(200)]),
        })
        .optional(),
      hours: z.array(time).min(1).max(12),
      closedWeekdays: z.array(z.number().int().min(0).max(6)).max(6),
      closedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(200),
      deposit: z.number().int().min(0).max(1_000_000),
      bookingDaysAhead: z.number().int().min(7).max(180),
      notify: z.object({ phone: z.string().trim().max(20), email: z.union([z.literal(''), z.string().trim().email()]), onOrder: z.boolean(), onBooking: z.boolean(), onMessage: z.boolean() }),
    }),
  );
  const before = await getSettings();
  const next = { ...b, social: b.social ?? before.social, _id: 'site' as const, hours: [...new Set(b.hours)].sort(), closedDates: [...new Set(b.closedDates)].sort(), updatedAt: Date.now() };
  if (await db().settings.get('site')) await db().settings.set('site', next);
  else await db().settings.insert(next);
  forgetSettings();
  await audit(req, 'Changed settings', 'settings', before, next);
  res.json(await getSettings());
});

/* ── Staff ──────────────────────────────────────────────────────────── */

const roleIn = z.enum(['owner', 'manager', 'tailor', 'orders', 'content']);
const owners = async () => (await db().staff.all({ role: 'owner' as Role })).filter((s) => s.active);

atelier.post('/staff', need('staff'), async (req, res) => {
  const b = body(req, z.object({ name: z.string().trim().min(2).max(60), email: z.string().trim().toLowerCase().email(), role: roleIn, password: z.string().min(8, 'At least 8 characters.') }));
  if (await db().staff.one({ email: b.email })) throw new HttpError(409, 'EXISTS', 'Someone already uses this email.');
  const s = await db().staff.insert({ _id: 'st-' + uid(), name: b.name, email: b.email, role: b.role, passwordHash: await hashPassword(b.password), active: true, tokenVersion: 0, failedLogins: 0, createdAt: Date.now() });
  await audit(req, `Added ${ROLES[b.role].label.toLowerCase()} ${b.name}`, s._id, undefined, s);
  res.status(201).json(publicStaff(s));
});

atelier.patch('/staff/:id', need('staff'), async (req, res) => {
  const b = body(req, z.object({ name: z.string().trim().min(2).max(60).optional(), role: roleIn.optional(), active: z.boolean().optional() }));
  const s = await db().staff.get(p(req.params.id));
  if (!s) throw notFound();
  const demoting = s.role === 'owner' && ((b.role && b.role !== 'owner') || b.active === false);
  if (demoting && (await owners()).length <= 1) throw new HttpError(409, 'LAST_OWNER', 'The atelier needs at least one owner.');
  const signOut = (b.role && b.role !== s.role) || b.active === false;
  const out = await db().staff.set(s._id, { ...b, ...(signOut ? { tokenVersion: s.tokenVersion + 1 } : {}) });
  await audit(req, 'Changed a staff account', s._id, publicStaff(s), publicStaff(out!));
  res.json(publicStaff(out!));
});

atelier.post('/staff/:id/password', need('staff'), async (req, res) => {
  const { password } = body(req, z.object({ password: z.string().min(8, 'At least 8 characters.') }));
  const s = await db().staff.get(p(req.params.id));
  if (!s) throw notFound();
  await db().staff.set(s._id, { passwordHash: await hashPassword(password), tokenVersion: s.tokenVersion + 1, failedLogins: 0, lockedUntil: 0 });
  await audit(req, 'Reset a staff password', s._id);
  res.json({ ok: true });
});

atelier.delete('/staff/:id', need('staff'), async (req, res) => {
  const s = await db().staff.get(p(req.params.id));
  if (!s) throw notFound();
  if (s._id === staffOf(req)._id) throw new HttpError(409, 'SELF', 'You cannot remove your own account.');
  if (s.role === 'owner' && (await owners()).length <= 1) throw new HttpError(409, 'LAST_OWNER', 'The atelier needs at least one owner.');
  await db().staff.remove(s._id);
  await audit(req, `Removed ${s.name}`, s._id, publicStaff(s), undefined);
  res.json({ ok: true });
});

atelier.get('/audit', need('audit'), async (_req, res) => {
  res.json({ audit: (await db().audit.all(undefined, { by: 'at', dir: -1 })).slice(0, 500) });
});

/* ── Excel exports ──────────────────────────────────────────────────── */

const bdt = (n: number) => n;
const when = (ms?: number) => (ms ? new Date(ms + 6 * 3600_000).toISOString().replace('T', ' ').slice(0, 16) : '');
async function sheet(kind: string): Promise<{ name: string; columns: { header: string; key: string; width: number }[]; rows: Record<string, unknown>[] }> {
  const s = db();
  switch (kind) {
    case 'orders': {
      const rows = (await s.orders.all(undefined, { by: 'createdAt', dir: -1 })).map((o) => ({ id: o._id, date: when(o.createdAt), name: o.customer.name, phone: o.customer.phone, email: o.customer.email, pieces: o.items.map((i) => `${i.name} (${i.size})${i.editionNo ? ' Nº' + i.editionNo : ''}`).join('; '), total: bdt(o.total), payment: o.payment, paid: o.paid ? 'yes' : 'no', status: o.status, delivery: o.delivery, area: o.customer.area, courier: o.courier ? `${o.courier.name} ${o.courier.tracking}` : '', refund: o.refund ? o.refund.amount : '' }));
      return { name: 'Orders', columns: ['id:Order:18', 'date:Date:18', 'name:Client:22', 'phone:Mobile:14', 'email:Email:24', 'pieces:Pieces:44', 'total:Total (BDT):14', 'payment:Payment:10', 'paid:Paid:8', 'status:Status:14', 'delivery:Delivery:10', 'area:Area:14', 'courier:Courier:20', 'refund:Refund:10'].map(col), rows };
    }
    case 'clients': {
      const rows = (await s.clients.all(undefined, { by: 'name', dir: 1 })).map((c) => ({ id: c._id, name: c.name, phone: c.phone, email: c.email, since: when(c.since), account: c.passwordHash ? 'yes' : 'no', measured: when(c.measuredAt), notes: c.notes }));
      return { name: 'Clients', columns: ['id:ID:14', 'name:Name:22', 'phone:Mobile:14', 'email:Email:26', 'since:Client since:18', 'account:Account:10', 'measured:Measured:18', 'notes:Notes:50'].map(col), rows };
    }
    case 'bookings': {
      const rows = (await s.bookings.all(undefined, { by: 'date', dir: -1 })).map((b) => ({ id: b._id, date: b.date, time: b.time, purpose: b.purpose, piece: b.pieceSlug ?? '', name: b.name, phone: b.phone, deposit: b.deposit, status: b.status, source: b.source ?? 'web', note: b.note }));
      return { name: 'Fittings', columns: ['id:Ref:16', 'date:Date:12', 'time:Hour:8', 'purpose:Purpose:14', 'piece:Piece:24', 'name:Client:22', 'phone:Mobile:14', 'deposit:Deposit:10', 'status:Status:16', 'source:Source:10', 'note:Note:40'].map(col), rows };
    }
    case 'pieces': {
      const eds = Object.fromEntries((await s.editions.all()).map((e) => [e._id, e.remaining]));
      const rows = (await allPieces()).map((x) => ({ no: x.no, name: x.name, kind: x.kind, rtw: x.rtw, mtm: x.mtm, edition: x.edition, remaining: eds[x.slug] ?? '', sizes: x.sizes.join(' '), published: x.published ? 'yes' : 'no' }));
      return { name: 'Season', columns: ['no:Nº:6', 'name:Piece:28', 'kind:Kind:12', 'rtw:Ready-to-wear:14', 'mtm:Made to measure:16', 'edition:Edition:10', 'remaining:Remaining:10', 'sizes:Sizes:20', 'published:Published:10'].map(col), rows };
    }
    case 'subscribers':
      return { name: 'Letter', columns: ['email:Email:32', 'date:Joined:18'].map(col), rows: (await s.subscribers.all(undefined, { by: 'createdAt', dir: -1 })).map((x) => ({ email: x._id, date: when(x.createdAt) })) };
    case 'audit':
      return { name: 'Audit', columns: ['at:When:18', 'who:Who:20', 'action:Action:36', 'target:On:22'].map(col), rows: (await s.audit.all(undefined, { by: 'at', dir: -1 })).map((a) => ({ at: when(a.at), who: a.staffName, action: a.action, target: a.target })) };
    default:
      throw notFound();
  }
}
function col(spec: string) {
  const [key, header, width] = spec.split(':');
  return { key, header, width: Number(width) };
}
async function xlsx(sheets: Awaited<ReturnType<typeof sheet>>[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Nirolax';
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name, { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = s.columns;
    ws.getRow(1).font = { bold: true };
    ws.addRows(s.rows);
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
const exportPerm: Record<string, Perm> = { orders: 'orders', clients: 'clients', bookings: 'fittings', pieces: 'catalogue', subscribers: 'messages', audit: 'audit' };

atelier.get('/export/:kind', async (req, res) => {
  const kind = p(req.params.kind);
  const perm = exportPerm[kind];
  if (!perm) throw notFound();
  if (!can(staffOf(req), perm) && !can(staffOf(req), 'reports')) throw new HttpError(403, 'FORBIDDEN', 'Your role cannot export this.');
  const buf = await xlsx([await sheet(kind)]);
  await audit(req, `Exported ${kind}`, kind);
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="nirolax-${kind}-${dhakaDate()}.xlsx"`);
  res.send(buf);
});

/* ── Backup & restore (owner) ───────────────────────────────────────── */

const scrubStaff = (rows: unknown[]) => rows.map((r) => ({ ...(r as object), passwordHash: undefined }));

atelier.get('/backup', need('backup'), async (req, res) => {
  const out: Record<string, unknown[]> = {};
  for (const n of COLLECTIONS) if (n !== 'otps') out[n] = n === 'staff' ? scrubStaff(await db()[n].all()) : n === 'clients' ? (await db()[n].all()).map(safeClient) : await db()[n].all();
  await audit(req, 'Downloaded a backup', 'all');
  res.set('Content-Disposition', `attachment; filename="nirolax-backup-${dhakaDate()}.json"`);
  res.json({ app: 'nirolax', version: 1, at: Date.now(), collections: out });
});

atelier.get('/backup.xlsx', need('backup'), async (req, res) => {
  const buf = await xlsx(await Promise.all(['orders', 'clients', 'bookings', 'pieces', 'subscribers', 'audit'].map(sheet)));
  await audit(req, 'Downloaded an Excel backup', 'all');
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="nirolax-backup-${dhakaDate()}.xlsx"`);
  res.send(buf);
});

/** Puts back everything except staff accounts and passwords (so nobody can lock the owner out with a file) */
atelier.post('/restore', need('backup'), async (req, res) => {
  const b = body(req, z.object({ app: z.literal('nirolax'), collections: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))) }));
  const restorable = COLLECTIONS.filter((n) => !['staff', 'otps', 'audit'].includes(n)) as (keyof Collections)[];
  const counts: Record<string, number> = {};
  for (const n of restorable) {
    const rows = b.collections[n];
    if (!rows) continue;
    const keepAccounts = n === 'clients' ? Object.fromEntries((await db().clients.all()).map((c) => [c._id, c])) : {};
    await db()[n].clear();
    for (const r of rows) {
      if (typeof r._id !== 'string') continue;
      const doc = n === 'clients' ? { ...r, ...(keepAccounts[r._id as string] ? { passwordHash: keepAccounts[r._id as string].passwordHash, tokenVersion: keepAccounts[r._id as string].tokenVersion } : {}), hasPassword: undefined } : r;
      await (db()[n] as unknown as { insert: (d: unknown) => Promise<unknown> }).insert(JSON.parse(JSON.stringify(doc)));
    }
    counts[n] = rows.length;
  }
  forgetSettings();
  await audit(req, 'Restored a backup', 'all', undefined, counts);
  res.json({ ok: true, counts });
});

/** Demo only: put the sample data back (memory store only — never wipes a real database) */
atelier.post('/reset', need('backup'), async (_req, res) => {
  if (!env.DEMO_MODE || env.DATA_SOURCE !== 'memory') throw new HttpError(403, 'FORBIDDEN', 'Reset is only available on the in-memory demo.');
  resetMemory();
  await connect();
  await seedIfEmpty();
  forgetSettings();
  res.json({ ok: true });
});
