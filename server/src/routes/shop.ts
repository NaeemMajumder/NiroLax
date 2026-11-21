import { Router } from 'express';
import { z } from 'zod';
import { allPieces, getPiece, publicPiece } from '../catalogue.js';
import { viewKey } from '../lib/auth.js';
import { getSettings, openOn, publicSettings } from '../lib/settings.js';
import { later } from '../lib/notify.js';
import { db } from '../db.js';
import { env } from '../env.js';
import { body, code, dhakaDate, HttpError, phone } from '../lib/util.js';
import { startPayment } from '../lib/payments.js';
import { bookingConfirmation, cancelBooking, cancelOrder, clientFor, confirmBookingDeposit, finaliseOrder, tellAtelier } from '../lib/flows.js';
import type { Booking, Order } from '../types.js';

export const shop = Router();

/** View keys let the confirmation pages show a receipt without signing in, without making ids guessable */
const key = viewKey;
const checkKey = (id: string, k: unknown) => {
  if (typeof k !== 'string' || k !== key(id)) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
};

shop.get('/health', (_req, res) => res.json({ ok: true, demo: env.DEMO_MODE, provider: env.PAYMENT_PROVIDER, data: env.DATA_SOURCE }));

shop.get('/catalogue', async (_req, res) => {
  const eds = await db().editions.all();
  res.json({ remaining: Object.fromEntries(eds.map((e) => [e._id, e.remaining])) });
});

/** The published pieces, in the order the atelier set */
shop.get('/catalogue/pieces', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
  const eds = Object.fromEntries((await db().editions.all()).map((e) => [e._id, e.remaining]));
  res.json({ pieces: (await allPieces(true)).map((x) => ({ ...publicPiece(x), remaining: eds[x.slug] ?? 0 })) });
});

shop.get('/settings', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  res.json(publicSettings(await getSettings()));
});

/* ── Orders ─────────────────────────────────────────────────────────── */

const orderIn = z.object({
  items: z.array(z.object({ slug: z.string(), size: z.string() })).min(1).max(6),
  customer: z.object({
    name: z.string().trim().min(2, 'Please write your full name.').max(80),
    phone,
    email: z.union([z.literal(''), z.string().email('This email looks incomplete.')]).default(''),
    address: z.string().trim().max(200).default(''),
    area: z.string().trim().max(60).default(''),
    city: z.string().trim().max(60).default('Dhaka'),
  }),
  delivery: z.enum(['dhaka', 'outside', 'collect']),
  payment: z.enum(['card', 'bkash', 'cod']),
});

shop.post('/orders', async (req, res) => {
  const b = body(req, orderIn);
  if (b.delivery !== 'collect' && b.customer.address.length < 5) throw new HttpError(422, 'INVALID', 'House, road and block, please.');
  if (b.payment === 'cod' && b.delivery === 'outside') throw new HttpError(422, 'INVALID', 'Cash on delivery is only for Dhaka and collection.');

  const items: Order['items'] = [];
  for (const it of b.items) {
    const c = await getPiece(it.slug);
    if (!c || !c.published || !c.sizes.includes(it.size) || c.soldOut.includes(it.size)) throw new HttpError(422, 'INVALID', 'One of the pieces is not available in that size.');
    const ed = await db().editions.get(c.slug);
    if (!ed || ed.remaining <= 0) throw new HttpError(409, 'SOLD_OUT', `${c.name} — the edition has closed.`);
    items.push({ slug: c.slug, name: c.name, size: it.size, price: c.rtw, editionNo: 0 });
  }
  const client = await clientFor(b.customer);
  const total = items.reduce((s, i) => s + i.price, 0);
  const order: Order = {
    _id: code('NX'),
    createdAt: Date.now(),
    items,
    customer: { ...b.customer, city: b.delivery === 'outside' ? b.customer.city : 'Dhaka' },
    delivery: b.delivery,
    deliveryFee: 0,
    payment: b.payment,
    paid: false,
    total,
    status: 'awaiting-payment',
    clientId: client._id,
    timeline: [{ at: Date.now(), by: b.customer.name, text: `Order placed on the website — ${b.payment === 'cod' ? 'cash on delivery' : b.payment === 'bkash' ? 'bKash' : 'card'}` }],
  };
  await db().orders.insert(order);
  const k = key(order._id);
  if (b.payment === 'cod') {
    const done = await finaliseOrder(order._id, false);
    return res.status(201).json({ order: done, key: k, next: `/order?id=${order._id}&key=${k}` });
  }
  const payUrl = await startPayment({ kind: 'order', id: order._id, amount: total, method: b.payment, customer: b.customer });
  res.status(201).json({ order, key: k, next: payUrl.startsWith('/') ? `${payUrl}&key=${k}` : payUrl });
});

shop.get('/orders/:id', async (req, res) => {
  checkKey(req.params.id, req.query.key);
  const o = await db().orders.get(req.params.id);
  if (!o) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  res.json({ order: o });
});

/* ── Fittings ───────────────────────────────────────────────────────── */

/** Demo-only pattern so the calendar looks lived-in */
const demoTaken = (date: string, time: string) => env.DEMO_MODE && (date.charCodeAt(9) + time.charCodeAt(1)) % 4 === 0;

shop.get('/slots', async (req, res) => {
  const s = await getSettings();
  const from = typeof req.query.from === 'string' ? req.query.from : dhakaDate();
  const bookings = await db().bookings.all();
  const taken = new Set(bookings.filter((b) => b.status !== 'cancelled' && b.date >= from).map((b) => `${b.date} ${b.time}`));
  const out: string[] = [];
  for (let i = 0; i < s.bookingDaysAhead; i++) {
    const d = dhakaDate(Date.now() + i * 86400000);
    for (const t of s.hours) if (taken.has(`${d} ${t}`) || demoTaken(d, t) || !openOn(s, d)) out.push(`${d} ${t}`);
  }
  res.json({ taken: out, hours: s.hours, closedWeekdays: s.closedWeekdays, closedDates: s.closedDates, deposit: s.deposit });
});

const bookingIn = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  purpose: z.enum(['new-piece', 'fitting', 'alteration', 'consultation']),
  pieceSlug: z.string().optional(),
  name: z.string().trim().min(2, 'How should we greet you?').max(80),
  phone,
  email: z.union([z.literal(''), z.string().email('This email looks incomplete.')]).default(''),
  note: z.string().trim().max(500).default(''),
  method: z.enum(['card', 'bkash']).default('bkash'),
});

shop.post('/bookings', async (req, res) => {
  const b = body(req, bookingIn);
  const s = await getSettings();
  const today = dhakaDate();
  const last = dhakaDate(Date.now() + s.bookingDaysAhead * 86400000);
  if (b.date <= today || b.date > last) throw new HttpError(422, 'INVALID', 'Please choose a day within the booking window.');
  if (!openOn(s, b.date)) throw new HttpError(422, 'INVALID', 'The atelier is closed that day.');
  if (!s.hours.includes(b.time)) throw new HttpError(422, 'INVALID', 'Please choose one of the atelier’s hours.');
  if (b.pieceSlug && !(await getPiece(b.pieceSlug))) throw new HttpError(422, 'INVALID', 'Unknown piece.');
  const clash = (await db().bookings.all({ date: b.date, time: b.time })).some((x) => x.status !== 'cancelled');
  if (clash || demoTaken(b.date, b.time)) throw new HttpError(409, 'TAKEN', 'That hour has just been taken. Please choose another.');

  const client = await clientFor(b);
  const deposit = b.purpose === 'new-piece' ? s.deposit : 0;
  const booking: Booking = {
    _id: code('FT'),
    createdAt: Date.now(),
    date: b.date,
    time: b.time,
    purpose: b.purpose,
    pieceSlug: b.purpose === 'new-piece' || b.purpose === 'fitting' ? b.pieceSlug : undefined,
    name: b.name,
    phone: b.phone,
    email: b.email,
    note: b.note,
    deposit,
    depositMethod: deposit ? b.method : undefined,
    status: deposit ? 'awaiting-deposit' : 'confirmed',
    clientId: client._id,
    source: 'web',
    history: [{ at: Date.now(), by: b.name, text: 'Requested on the website' }],
  };
  await db().bookings.insert(booking);
  const k = key(booking._id);
  if (!deposit) {
    later(bookingConfirmation(booking));
    return res.status(201).json({ booking, key: k, next: `/fittings/confirmed?id=${booking._id}&key=${k}` });
  }
  const payUrl = await startPayment({ kind: 'booking', id: booking._id, amount: deposit, method: b.method, customer: b });
  res.status(201).json({ booking, key: k, next: payUrl.startsWith('/') ? `${payUrl}&key=${k}` : payUrl });
});

shop.get('/bookings/:id', async (req, res) => {
  checkKey(req.params.id, req.query.key);
  const b = await db().bookings.get(req.params.id);
  if (!b) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  res.json({ booking: b });
});

/* ── Payments ───────────────────────────────────────────────────────── */

/** The demo gateway's approve / cancel buttons. Only exists while PAYMENT_PROVIDER=demo. */
shop.post('/payments/demo', async (req, res) => {
  if (env.PAYMENT_PROVIDER !== 'demo') throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  const p = body(req, z.object({ kind: z.enum(['order', 'booking']), id: z.string(), key: z.string(), approve: z.boolean() }));
  checkKey(p.id, p.key);
  if (p.kind === 'order') {
    if (p.approve) {
      const o = await finaliseOrder(p.id, true, 'DEMO-' + Date.now());
      return res.json({ next: `/order?id=${p.id}&key=${p.key}`, order: o });
    }
    await cancelOrder(p.id);
    return res.json({ next: '/checkout?failed=1' });
  }
  if (p.approve) {
    const b = await confirmBookingDeposit(p.id, 'DEMO-' + Date.now());
    return res.json({ next: `/fittings/confirmed?id=${p.id}&key=${p.key}`, booking: b });
  }
  await cancelBooking(p.id);
  res.json({ next: '/fittings?failed=1' });
});

/** SSLCommerz sends the customer's browser back here (POST), and calls the IPN separately. Both are verified with SSLCommerz. */
async function settleSsl(valId: string | undefined, tranId: string | undefined) {
  const { validateSsl } = await import('../lib/payments.js');
  if (!valId || !tranId) return { ok: false as const, kind: tranId?.split(':')[0], id: tranId?.split(':')[1] };
  const v = await validateSsl(valId);
  const [kind, id] = tranId.split(':');
  if (!v.ok || v.tranId !== tranId) return { ok: false as const, kind, id };
  if (kind === 'order') {
    const o = await db().orders.get(id);
    if (!o || Number(v.amount) < o.total) return { ok: false as const, kind, id };
    await finaliseOrder(id, true, valId);
  } else {
    const b = await db().bookings.get(id);
    if (!b || Number(v.amount) < b.deposit) return { ok: false as const, kind, id };
    await confirmBookingDeposit(id, valId);
  }
  return { ok: true as const, kind, id };
}

shop.post('/payments/sslcommerz/return', async (req, res) => {
  const r = await settleSsl(req.body?.val_id, req.body?.tran_id);
  if (r.ok && r.kind === 'order') return res.redirect(303, `${env.WEB_URL}/order?id=${r.id}&key=${key(r.id!)}`);
  if (r.ok) return res.redirect(303, `${env.WEB_URL}/fittings/confirmed?id=${r.id}&key=${key(r.id!)}`);
  if (r.kind === 'order' && r.id) await cancelOrder(r.id);
  if (r.kind === 'booking' && r.id) await cancelBooking(r.id);
  res.redirect(303, `${env.WEB_URL}${r.kind === 'booking' ? '/fittings' : '/checkout'}?failed=1`);
});

shop.post('/payments/sslcommerz/ipn', async (req, res) => {
  await settleSsl(req.body?.val_id, req.body?.tran_id);
  res.json({ ok: true });
});


/* ── The Letter and the contact form ─────────────────────────────────── */

shop.post('/newsletter', async (req, res) => {
  const { email } = body(req, z.object({ email: z.string().trim().toLowerCase().email('Please check this email address.') }));
  const had = await db().subscribers.get(email);
  if (!had) await db().subscribers.insert({ _id: email, createdAt: Date.now() });
  res.status(had ? 200 : 201).json({ ok: true, already: !!had });
});

shop.post('/contact', async (req, res) => {
  const b = body(
    req,
    z.object({
      name: z.string().trim().min(2, 'How should we address you?').max(80),
      phone: z.union([z.literal(''), phone]).default(''),
      email: z.union([z.literal(''), z.string().trim().email('This email looks incomplete.')]).default(''),
      topic: z.enum(['appointment', 'order', 'made-to-measure', 'press', 'other']).default('other'),
      message: z.string().trim().min(10, 'A line or two more, please.').max(2000),
    }),
  );
  if (!b.phone && !b.email) throw new HttpError(422, 'INVALID', 'Leave a mobile number or an email so we can reply.');
  const m = await db().messages.insert({ _id: code('MSG'), createdAt: Date.now(), ...b, read: false });
  later(tellAtelier('onMessage', `note from ${b.name} (${b.topic})`, `${b.name} ${b.phone || ''} ${b.email || ''}\n\n${b.message}`));
  res.status(201).json({ ok: true, id: m._id });
});
