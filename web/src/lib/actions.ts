'use client';

/**
 * Everything the screens can *do*. In server mode (NEXT_PUBLIC_API_MODE=server)
 * each action calls the Express API and refreshes the local copy; in demo mode
 * it runs against the in-browser store. Screens only import from here.
 */
import * as L from './store';
import type { Booking, BookingStatus, Client, Commission, Customer, DeliveryMethod, Message, MessageTopic, Order, OrderStatus, PaymentMethod, Purpose } from './store';
import { STAGES } from './stages';
import { getPieces } from './pieces';
import { toast } from 'sonner';
import { href } from '@/components/ui/Lnk';
import { useEffect, useState, useSyncExternalStore } from 'react';

export const API = L.API_MODE;

export class ActionError extends Error {}

async function call<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch('/api/v1' + path, {
      method,
      credentials: 'include',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ActionError('We could not reach the atelier. Check your connection and try again.');
  }
  const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!r.ok) throw new ActionError(j.error?.message ?? 'Something went wrong. Please try again.');
  return j as T;
}

type WithId = { _id: string };
const local = <T,>(x: WithId & Record<string, unknown>) => {
  const { _id, ...rest } = x;
  return { id: _id, ...rest } as T;
};
const upsert = <K extends 'orders' | 'bookings'>(k: K, item: L.DB[K][number]) =>
  L.mutate((d) => ({ ...d, [k]: [item, ...(d[k] as { id: string }[]).filter((x) => x.id !== item.id)] }));

/** Go to a path the API (or the demo) returned, e.g. "/order?id=…&key=…" or an external gateway URL */
export function go(next: string) {
  if (/^https?:/.test(next)) {
    window.location.href = next;
    return;
  }
  const [path, q] = next.split('?');
  window.location.href = href(path) + (q ? `?${q}` : '');
}

/* ── Keep the local copy in step with the server ────────────────────── */

/** What the console needs beyond the shared slices (server mode) */
export type ConsoleExtras = {
  pieces: ServerPiece[];
  settings: SiteSettings;
  staffList: L.StaffMe[];
  cloudinary: boolean;
  subscribers: number;
};
export type ServerPiece = import('./pieces').Piece & { published: boolean; order: number; updatedAt: number };
export type SiteSettings = {
  atelier: { name: string; address1: string; address2: string; phone: string; whatsapp: string; email: string };
  social: { instagram: string; facebook: string; youtube: string; pinterest: string };
  hours: string[];
  closedWeekdays: number[];
  closedDates: string[];
  deposit: number;
  bookingDaysAhead: number;
  notify: { phone: string; email: string; onOrder: boolean; onBooking: boolean; onMessage: boolean };
};

let extras: ConsoleExtras | null = null;
const extraSubs = new Set<() => void>();
const setExtras = (x: ConsoleExtras | null) => {
  extras = x;
  extraSubs.forEach((f) => f());
};
export const useConsoleExtras = () => useSyncExternalStore((f) => (extraSubs.add(f), () => extraSubs.delete(f)), () => extras, () => null);

export async function sync() {
  if (!API) return;
  const [cat, me, st] = await Promise.all([
    call<{ remaining: Record<string, number> }>('GET', '/catalogue'),
    call<{ role: 'client' | null; client?: WithId; orders?: WithId[]; bookings?: WithId[]; commissions?: WithId[] }>('GET', '/me'),
    call<{ staff: L.StaffMe | null }>('GET', '/staff/me'),
  ]);
  const mine =
    me.role === 'client' && me.client
      ? {
          client: local<Client>(me.client as never),
          orders: me.orders!.map((x) => local<Order>(x as never)),
          bookings: me.bookings!.map((x) => local<Booking>(x as never)),
          commissions: me.commissions!.map((x) => local<Commission>(x as never)),
        }
      : null;
  let staffData: Partial<L.DB> | null = null;
  if (st.staff) {
    const c = await call<{ me: L.StaffMe; orders: WithId[]; bookings: WithId[]; clients: WithId[]; commissions: WithId[]; messages: WithId[]; subscribers: number; remaining: Record<string, number>; pieces: (ServerPiece & WithId)[]; settings: SiteSettings; staff: L.StaffMe[]; cloudinary: boolean }>('GET', '/console/state');
    staffData = {
      staff: c.me,
      orders: c.orders.map((x) => local<Order>(x as never)),
      bookings: c.bookings.map((x) => local<Booking>(x as never)),
      clients: c.clients.map((x) => local<Client>(x as never)),
      commissions: c.commissions.map((x) => local<Commission>(x as never)),
      messages: c.messages.map((x) => local<Message>(x as never)),
      subscriberCount: c.subscribers,
      remaining: c.remaining,
    };
    setExtras({ pieces: c.pieces, settings: c.settings, staffList: c.staff, cloudinary: c.cloudinary, subscribers: c.subscribers });
  } else setExtras(null);
  L.mutate((d) => {
    const clients = staffData?.clients ?? [];
    return {
      ...d,
      remaining: staffData?.remaining ?? cat.remaining,
      session: mine ? { role: 'client', clientId: mine.client.id } : null,
      staff: staffData?.staff ?? null,
      clients: mine ? [...clients.filter((c) => c.id !== mine.client.id), mine.client] : clients,
      orders: staffData?.orders ?? mine?.orders ?? [],
      bookings: staffData?.bookings ?? mine?.bookings ?? [],
      commissions: staffData?.commissions ?? mine?.commissions ?? [],
      messages: staffData?.messages ?? [],
      subscriberCount: staffData?.subscriberCount,
    };
  });
}

/* ── Shop ───────────────────────────────────────────────────────────── */

export async function placeOrder(input: { customer: Customer; delivery: DeliveryMethod; payment: PaymentMethod }): Promise<string> {
  if (!API) {
    const o = L.placeOrder(input);
    return input.payment === 'cod' ? `/order?id=${o.id}` : `/pay?order=${o.id}&method=${input.payment}`;
  }
  const cart = L.load().cart;
  const r = await call<{ order: WithId; next: string }>('POST', '/orders', { items: cart.map((c) => ({ slug: c.slug, size: c.size })), ...input });
  upsert('orders', local<Order>(r.order as never));
  return r.next;
}

export async function fetchOrder(id: string, key: string | null) {
  if (!API || !key) return;
  const r = await call<{ order: WithId }>('GET', `/orders/${encodeURIComponent(id)}?key=${encodeURIComponent(key)}`);
  upsert('orders', local<Order>(r.order as never));
}

export async function fetchBooking(id: string, key: string | null) {
  if (!API || !key) return;
  const r = await call<{ booking: WithId }>('GET', `/bookings/${encodeURIComponent(id)}?key=${encodeURIComponent(key)}`);
  upsert('bookings', local<Booking>(r.booking as never));
}

/** The demo gateway's approve / cancel */
export async function payDemo(kind: 'order' | 'booking', id: string, key: string | null, approve: boolean, method: 'card' | 'bkash'): Promise<string> {
  if (!API) {
    if (kind === 'order') {
      if (approve) L.finaliseOrder(id, true);
      else L.failOrder(id);
      return approve ? `/order?id=${id}` : '/checkout?failed=1';
    }
    if (approve) L.confirmDeposit(id, method);
    else L.setBookingStatus(id, 'cancelled');
    return approve ? `/fittings/confirmed?id=${id}` : '/fittings?failed=1';
  }
  const r = await call<{ next: string; order?: WithId; booking?: WithId }>('POST', '/payments/demo', { kind, id, key, approve });
  if (r.order) upsert('orders', local<Order>(r.order as never));
  if (r.booking) upsert('bookings', local<Booking>(r.booking as never));
  return r.next;
}

/* ── Fittings ───────────────────────────────────────────────────────── */

export async function loadSlots() {
  if (!API) return;
  const r = await call<{ taken: string[] }>('GET', '/slots');
  L.mutate((d) => ({ ...d, taken: r.taken }));
}

export async function createBooking(input: { date: string; time: string; purpose: Purpose; pieceSlug?: string; name: string; phone: string; email: string; note: string; method: 'card' | 'bkash' }): Promise<string> {
  if (!API) {
    const { method, ...rest } = input;
    const b = L.createBooking(rest);
    return b.deposit ? `/pay?booking=${b.id}&method=${method}` : `/fittings/confirmed?id=${b.id}`;
  }
  const r = await call<{ booking: WithId; next: string }>('POST', '/bookings', input);
  upsert('bookings', local<Booking>(r.booking as never));
  return r.next;
}

/* ── Client accounts ────────────────────────────────────────────────── */

const strong = (p: string) => (p.length < 8 ? 'At least 8 characters.' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Use at least one letter and one number.' : null);

/** Email or mobile + password */
export async function login(id: string, password: string) {
  if (!API) {
    const c = L.findAccount(id);
    if (!c || L.passwordOf(c) !== password) throw new ActionError('That email or number and password do not match.');
    L.mutate((d) => ({ ...d, session: { role: 'client', clientId: c.id } }));
    return;
  }
  await call('POST', '/auth/login', { id, password });
  await sync();
}

/** Step 1 of creating an account: sends a code to the mobile number */
export async function register(r: { name: string; email: string; phone: string; password: string }): Promise<{ demoCode?: string }> {
  if (!API) {
    const w = strong(r.password);
    if (w) throw new ActionError(w);
    const c = L.findAccount(r.phone);
    if (c && L.passwordOf(c)) throw new ActionError('This number already has an account. Sign in, or reset your password.');
    pendingLocal = r;
    return { demoCode: L.DEMO_OTP };
  }
  return call('POST', '/auth/register', r);
}
let pendingLocal: { name: string; email: string; phone: string; password: string } | null = null;

/** Step 2: the code from the SMS. Returns true when earlier orders were attached to the account. */
export async function verifyRegister(phone: string, code: string): Promise<boolean> {
  if (!API) {
    if (code !== L.DEMO_OTP || !pendingLocal) throw new ActionError('That code is not right.');
    const { attached } = L.registerLocal(pendingLocal);
    pendingLocal = null;
    return attached;
  }
  const r = await call<{ attached: boolean }>('POST', '/auth/register/verify', { phone, code });
  await sync();
  return r.attached;
}

export async function forgotPassword(phone: string): Promise<{ demoCode?: string }> {
  if (!API) return { demoCode: L.DEMO_OTP };
  return call('POST', '/auth/forgot', { phone });
}
export async function resetPassword(phone: string, code: string, password: string) {
  if (!API) {
    const c = L.findAccount(phone);
    if (code !== L.DEMO_OTP || !c) throw new ActionError('That code is not right.');
    L.mutate((d) => ({ ...d, session: { role: 'client', clientId: c.id } }));
    L.updateMe({ demoPassword: password, hasPassword: true });
    return;
  }
  await call('POST', '/auth/reset', { phone, code, password });
  await sync();
}

/** Sign in with a one-time code instead of a password */
export async function requestOtp(phone: string): Promise<{ demoCode?: string }> {
  if (!API) {
    if (!L.findAccount(phone)) throw new ActionError('We do not have this number yet. Create an account, or book a fitting and your portal opens.');
    return { demoCode: L.DEMO_OTP };
  }
  return call('POST', '/auth/otp', { phone });
}
export async function verifyOtp(phone: string, codeV: string) {
  if (!API) {
    if (codeV !== L.DEMO_OTP) throw new ActionError('That code is not right.');
    if (!L.signInClient(phone)) throw new ActionError('We do not have this number yet.');
    return;
  }
  await call('POST', '/auth/otp/verify', { phone, code: codeV });
  await sync();
}

export async function enterAsDemoClient() {
  if (!API) {
    L.signInClient(L.DEMO_CLIENT_PHONE);
    return;
  }
  await call('POST', '/auth/demo-client');
  await sync();
}

export async function signOut() {
  if (!API) return L.signOut();
  await call('POST', '/auth/logout');
  await sync();
}

export async function updateProfile(patch: { name?: string; email?: string; address?: { address: string; area: string; city: string } }) {
  if (!API) return L.updateMe(patch);
  await call('PATCH', '/me', patch);
  await sync();
}
export async function changePassword(current: string, next: string) {
  if (!API) {
    const w = strong(next);
    if (w) throw new ActionError(w);
    const d = L.load();
    const me = d.clients.find((c) => c.id === d.session?.clientId);
    if (me && L.passwordOf(me) && L.passwordOf(me) !== current) throw new ActionError('Your current password is not right.');
    return L.updateMe({ demoPassword: next, hasPassword: true });
  }
  await call('POST', '/me/password', { current, next });
  await sync();
}
/** Add or remove a piece from the client's wish list */
export async function toggleSaved(slug: string) {
  if (!API) {
    const d = L.load();
    const me = d.clients.find((c) => c.id === d.session?.clientId);
    const saved = me?.saved?.includes(slug) ? me.saved.filter((x) => x !== slug) : [...(me?.saved ?? []), slug];
    return L.updateMe({ saved });
  }
  await call('PUT', `/me/saved/${slug}`);
  await sync();
}

/* ── Staff ──────────────────────────────────────────────────────────── */

export async function signInAtelier(email: string, password: string) {
  if (!API) {
    if (!L.signInAtelier(email, password)) throw new ActionError('That email and password do not match.');
    return;
  }
  await call('POST', '/staff/login', { email, password });
  await sync();
}
export async function signOutStaff() {
  if (!API) return L.signOutStaff();
  await call('POST', '/staff/logout');
  await sync();
}
export async function changeStaffPassword(current: string, next: string) {
  if (!API) throw new ActionError('Connect the API to change passwords.');
  await call('POST', '/staff/password', { current, next });
}

export async function cancelMyBooking(id: string) {
  if (!API) return L.setBookingStatus(id, 'cancelled');
  await call('POST', `/me/bookings/${id}/cancel`);
  await sync();
}

/* ── Atelier console ────────────────────────────────────────────────── */

const STAGE_NAMES = STAGES.map((x) => x.name);
const pieceName = (slug: string) => getPieces().find((p) => p.slug === slug)?.name ?? 'The piece';

/** Run one console change (API or local), refresh, and say what happened */
async function change(ok: string | (() => string), api: () => Promise<unknown>, local: () => unknown, opts: { id?: string; detail?: string } = {}) {
  try {
    if (API) {
      await api();
      await sync();
    } else local();
    toast.success(typeof ok === 'function' ? ok() : ok, { id: opts.id, description: opts.detail });
  } catch (e) {
    toast.error((e as Error).message || 'That change was not saved.', { id: opts.id });
    if (API) await sync().catch(() => {});
  }
}
const cc = (method: string, path: string, body?: unknown) => () => call(method, '/console' + path, body);

const bookingLabel: Record<BookingStatus, string> = { 'awaiting-deposit': 'Awaiting deposit', confirmed: 'Confirmed', attended: 'Marked as attended', cancelled: 'Appointment cancelled' };
const orderLabel: Record<OrderStatus, string> = { 'awaiting-payment': 'awaiting payment', confirmed: 'confirmed', packed: 'pressed & boxed', shipped: 'with the courier', delivered: 'delivered', cancelled: 'cancelled' };

export const setBookingStatus = (id: string, status: BookingStatus) =>
  change(bookingLabel[status], cc('PATCH', `/bookings/${id}`, { status }), () => L.setBookingStatus(id, status), { detail: id });

export const createCommission = (clientId: string, pieceSlug: string) =>
  change(`${pieceName(pieceSlug)} — commission opened`, cc('POST', '/commissions', { clientId, pieceSlug }), () => L.createCommission(clientId, pieceSlug), { detail: 'It is now in Production, at Measured.' });

export const advanceStage = (id: string, dir: 1 | -1) =>
  change(
    () => {
      const c = L.load().commissions.find((x) => x.id === id);
      return c ? `${pieceName(c.pieceSlug)} → ${STAGE_NAMES[c.stage]}` : 'Stage updated';
    },
    cc('PATCH', `/commissions/${id}`, { move: dir }),
    () => L.advanceStage(id, dir),
    { detail: dir === 1 ? 'The client sees the new stage in their portal.' : 'Moved back one stage.' },
  );

export const updateCommission = (id: string, patch: { readyBy?: string; notes?: string }) =>
  change(patch.readyBy ? 'Ready date saved' : 'Notes saved', cc('PATCH', `/commissions/${id}`, patch), () => L.updateCommission(id, patch), { id: `com-${id}` });

export const setStagePhoto = (id: string, stage: string, dataUrl: string | null) =>
  change(
    dataUrl ? `Photo added — ${STAGES.find((x) => x.slug === stage)?.name ?? stage}` : 'Photo removed',
    async () => {
      if (!dataUrl) return call('DELETE', `/console/commissions/${id}/photos/${stage}`);
      const url = await uploadImage(dataUrl, 'stages');
      return call('PUT', `/console/commissions/${id}/photos/${stage}`, url.startsWith('data:') ? { dataUrl: url } : { url });
    },
    () => L.setStagePhoto(id, stage, dataUrl),
    { detail: dataUrl ? 'The client sees it in their portal.' : undefined },
  );

export const setOrderStatus = (id: string, status: OrderStatus) =>
  change(`Order ${id} is ${orderLabel[status]}`, cc('PATCH', `/orders/${id}`, { status }), () => L.setOrderStatus(id, status));

export const updateClient = (id: string, patch: { measures?: Record<string, number | undefined>; notes?: string; measuredBy?: string }) =>
  change('Measure sheet saved', cc('PATCH', `/clients/${id}`, patch), () => L.updateClient(id, { ...patch, measuredAt: Date.now() }), { detail: 'The client sees it in their portal.' });

export const setRemaining = (slug: string, n: number) =>
  change(() => `${pieceName(slug)} — ${L.load().remaining[slug] ?? n} remain`, cc('PATCH', `/editions/${slug}`, { remaining: Math.max(0, n) }), () => L.setRemaining(slug, n), { id: `ed-${slug}` });

export const setMessageRead = (id: string, read: boolean) =>
  change(read ? 'Marked as read' : 'Marked as unread', cc('PATCH', `/messages/${id}`, { read }), () => L.setMessageRead(id, read), { id: `msg-${id}` });

export const resetDemo = () => change('Sample data restored', cc('POST', '/reset'), () => L.resetDemo());

/* ── Console (server mode) ───────────────────────────────────────── */

/** Image upload: straight to Cloudinary as WebP with a signature from the API; without Cloudinary, the resized data URL itself */
export async function uploadImage(dataUrl: string, folder: 'pieces' | 'stages'): Promise<string> {
  if (!API) return dataUrl;
  const sig = await call<{ cloudinary?: false; url: string; apiKey: string; timestamp: number; signature: string; folder: string }>('POST', '/console/uploads/sign', { folder });
  if (sig.cloudinary === false) return dataUrl;
  const form = new FormData();
  form.append('file', dataUrl);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  const r = await fetch(sig.url, { method: 'POST', body: form }).catch(() => null);
  const j = r ? ((await r.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } }) : {};
  if (!r?.ok || !j.secure_url) throw new ActionError(j.error?.message ?? 'The photo did not upload. Please try again.');
  return j.secure_url;
}

const serverOnly = () => {
  throw new ActionError('This part of the console works when the site is connected to the API.');
};
/** A console change that only exists with the API: call, refresh, announce */
async function act<T>(ok: string, run: () => Promise<T>, detail?: string): Promise<T> {
  if (!API) serverOnly();
  try {
    const v = await run();
    await sync();
    toast.success(ok, { description: detail });
    return v;
  } catch (e) {
    toast.error((e as Error).message || 'That change was not saved.');
    throw e;
  }
}

export type PieceInput = Omit<ServerPiece, 'slug' | 'order' | 'updatedAt' | 'remaining' | 'photos' | 'soldOut'> & { soldOut: string[] };
export const createPiece = (p: PieceInput) => act(`${p.name} added`, () => call<ServerPiece>('POST', '/console/pieces', p), p.published ? 'It is on the shop now.' : 'Saved as a draft — publish it when ready.');
export const updatePiece = (slug: string, p: Partial<PieceInput>, label = 'Piece saved') => act(label, () => call<ServerPiece>('PATCH', `/console/pieces/${slug}`, p), 'The shop shows it within a minute.');
export const deletePiece = (slug: string) => act('Piece deleted', () => call('DELETE', `/console/pieces/${slug}`));
export const reorderPieces = (slugs: string[]) => act('Season order saved', () => call('POST', '/console/pieces/reorder', { slugs }));

export const addOrderNote = (id: string, text: string) => act('Note added', () => call('POST', `/console/orders/${id}/notes`, { text }));
export const bookCourier = (id: string, name: 'Steadfast' | 'Pathao' | 'RedX' | 'Atelier') => act(`${name} booked`, () => call('POST', `/console/orders/${id}/courier`, { name }), 'Tracking number added to the order.');
export const cancelOrder = (id: string, reason: string, refund: boolean) => act(`Order ${id} cancelled`, () => call('POST', `/console/orders/${id}/cancel`, { reason, refund }), refund ? 'Refund started; the pieces went back to their editions.' : 'The pieces went back to their editions.');

export const bookWalkIn = (b: { date: string; time: string; purpose: Purpose; pieceSlug?: string; name: string; phone: string; email: string; note: string; depositPaid: boolean }) =>
  act('Fitting booked', () => call('POST', '/console/bookings', b), 'The client gets an SMS confirmation.');
export const updateBooking = (id: string, patch: { date?: string; time?: string; note?: string; depositPaid?: boolean }) =>
  act(patch.date || patch.time ? 'Appointment moved' : patch.depositPaid ? 'Deposit recorded' : 'Appointment saved', () => call('PATCH', `/console/bookings/${id}`, patch), patch.date || patch.time ? 'The client is told by SMS.' : undefined);

export const addClient = (c: { name: string; phone: string; email: string; notes: string }) => act(`${c.name} added`, () => call<{ _id: string }>('POST', '/console/clients', c));
export const editClient = (id: string, c: { name?: string; phone?: string; email?: string }) => act('Client saved', () => call('PATCH', `/console/clients/${id}`, c));
export const deleteClient = (id: string) => act('Client deleted', () => call('DELETE', `/console/clients/${id}`), 'Orders are kept for the records, without personal details.');

export const saveSettings = (s: SiteSettings) => act('Settings saved', () => call('PUT', '/console/settings', s), 'The site and the booking calendar follow them now.');

export const addStaff = (s: { name: string; email: string; role: L.Role; password: string }) => act(`${s.name} added`, () => call('POST', '/console/staff', s), 'Share the first password with them in person.');
export const editStaff = (id: string, s: { name?: string; role?: L.Role; active?: boolean }) => act(s.active === false ? 'Account switched off' : s.active ? 'Account switched on' : 'Staff saved', () => call('PATCH', `/console/staff/${id}`, s));
export const resetStaffPassword = (id: string, password: string) => act('Password reset', () => call('POST', `/console/staff/${id}/password`, { password }), 'They are signed out everywhere.');
export const removeStaff = (id: string) => act('Staff removed', () => call('DELETE', `/console/staff/${id}`));

export type AuditEntry = { _id: string; at: number; staffName: string; action: string; target: string; before?: unknown; after?: unknown };
export type OutboxEntry = { _id: string; at: number; channel: 'sms' | 'email'; to: string; subject?: string; body: string; status: string; kind: string };
export const fetchAudit = () => (API ? call<{ audit: AuditEntry[] }>('GET', '/console/audit').then((r) => r.audit) : Promise.resolve([]));
export const fetchOutbox = () => (API ? call<{ outbox: OutboxEntry[] }>('GET', '/console/outbox').then((r) => r.outbox) : Promise.resolve([]));
/** A file download from the API (the browser keeps the staff cookie) */
export const exportHref = (kind: string) => `/api/v1/console/export/${kind}`;
export const backupHref = (fmt: 'json' | 'xlsx') => (fmt === 'json' ? '/api/v1/console/backup' : '/api/v1/console/backup.xlsx');
export async function restoreBackup(file: File) {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ActionError('That file is not a Nirolax backup.');
  }
  return act('Backup restored', () => call<{ counts: Record<string, number> }>('POST', '/console/restore', data), 'Staff accounts were left as they are.');
}

/* ── The Letter and the contact form ────────────────────────────────── */

/** Returns true if the address was already on the list */
export async function subscribe(email: string): Promise<boolean> {
  if (!API) {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new ActionError('Please check this email address.');
    return L.joinLetter(email);
  }
  const r = await call<{ already: boolean }>('POST', '/newsletter', { email });
  return r.already;
}

export async function sendMessage(m: { name: string; phone: string; email: string; topic: MessageTopic; message: string }) {
  if (!API) {
    L.sendMessage(m);
    return;
  }
  await call('POST', '/contact', m);
}

/* ── Pages opened from a link (receipt, invitation, gateway) ────────── */


/** Loads an order/booking by its link key in server mode; true while loading */
export function useLinked(kind: 'order' | 'booking', id: string | null, key: string | null) {
  const [loading, setLoading] = useState(API && !!id && !!key);
  useEffect(() => {
    if (!API || !id || !key) return;
    (kind === 'order' ? fetchOrder(id, key) : fetchBooking(id, key)).catch(() => {}).finally(() => setLoading(false));
  }, [kind, id, key]);
  return loading;
}

/* ── Start-up: learn who is signed in before choosing a screen ──────── */

let booted = false;
let booting: Promise<void> | null = null;
const bootSubs = new Set<() => void>();
export function boot() {
  if (booted || booting) return;
  booting = (API
    ? Promise.all([
        sync(),
        call<{ demo: boolean; provider: string }>('GET', '/health').then((h) => L.mutate((d) => ({ ...d, demo: h.demo || h.provider === 'demo' }))),
      ]).then(() => {})
    : Promise.resolve())
    .catch(() => {})
    .finally(() => {
      booted = true;
      bootSubs.forEach((f) => f());
    });
}
/** False until the browser knows who is signed in (avoids flashing the sign-in form) */
export const useBooted = () =>
  useSyncExternalStore(
    (f) => {
      bootSubs.add(f);
      boot();
      return () => bootSubs.delete(f);
    },
    () => booted,
    () => false,
  );

/** Jump to the top of the page (e.g. after signing in swaps the screen) */
export function toTop() {
  const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void } }).__lenis;
  if (l) l.scrollTo(0, { immediate: true });
  window.scrollTo(0, 0);
}

/** True when the site runs on sample data — shows the "demo" hints (sign-in code, test gateway, sample logins) */
export const useDemo = () => L.useDB((d) => !API || !!d.demo);
