'use client';

/**
 * Demo data store.
 *
 * Holds everything the shop, the client portal and the Atelier Console share:
 * cart, orders, fittings, clients, made-to-measure commissions and editions.
 * It lives in the browser (localStorage) so the demo works without a server,
 * and every change is visible across pages and tabs. The Express API (Phase 6)
 * serves the same shapes; the action functions below are the seam where the
 * fetch calls go.
 */
import { useSyncExternalStore } from 'react';
import { getPieces } from './pieces';
import { STAGES } from './stages';

/* ── Types ───────────────────────────────────────────────────────────── */

export type CartItem = { id: string; slug: string; size: string; price: number; addedAt: number };

export type PaymentMethod = 'card' | 'bkash' | 'cod';
export type DeliveryMethod = 'dhaka' | 'outside' | 'collect';

export type Customer = { name: string; phone: string; email: string; address: string; area: string; city: string };

export type OrderStatus = 'awaiting-payment' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type Order = {
  id: string;
  createdAt: number;
  items: { slug: string; name: string; size: string; price: number; editionNo: number }[];
  customer: Customer;
  delivery: DeliveryMethod;
  deliveryFee: number;
  payment: PaymentMethod;
  paid: boolean;
  total: number;
  status: OrderStatus;
  clientId?: string;
  timeline?: Step[];
  notes?: Step[];
  courier?: { name: string; tracking: string; bookedAt: number };
  refund?: { amount: number; at: number; method: string; reason: string };
};
export type Step = { at: number; by: string; text: string };

export type Purpose = 'new-piece' | 'fitting' | 'alteration' | 'consultation';
export type BookingStatus = 'awaiting-deposit' | 'confirmed' | 'attended' | 'cancelled';
export type Booking = {
  id: string;
  createdAt: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  purpose: Purpose;
  pieceSlug?: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  deposit: number;
  depositMethod?: Exclude<PaymentMethod, 'cod'> | 'cash';
  status: BookingStatus;
  clientId?: string;
  source?: 'web' | 'atelier';
  history?: Step[];
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  since: number;
  measures: Record<string, number | undefined>;
  notes: string;
  measuredBy?: string;
  measuredAt?: number;
  hasPassword?: boolean;
  saved?: string[];
  address?: { address: string; area: string; city: string };
  /** Static demo only: accounts live in the browser */
  demoPassword?: string;
};

export type Commission = {
  id: string;
  clientId: string;
  pieceSlug: string;
  editionNo: number;
  price: number;
  stage: number; // index into STAGES of the stage in progress
  stageDates: (number | null)[]; // when each stage was completed
  photos: Record<string, string>; // stage slug -> data URL uploaded from the console
  readyBy: string; // YYYY-MM-DD
  notes: string;
};

export type MessageTopic = 'appointment' | 'order' | 'made-to-measure' | 'press' | 'other';
export type Message = { id: string; createdAt: number; name: string; phone: string; email: string; topic: MessageTopic; message: string; read: boolean };

export type Session = { role: 'client'; clientId: string } | null;
export type Role = 'owner' | 'manager' | 'tailor' | 'orders' | 'content';
export type Perm = 'overview' | 'fittings' | 'production' | 'orders' | 'clients' | 'catalogue' | 'editions' | 'messages' | 'reports' | 'settings' | 'staff' | 'audit' | 'backup';
export type StaffMe = { _id: string; name: string; email: string; role: Role; can: Perm[]; active?: boolean; lastLoginAt?: number; createdAt?: number };
export const ALL_PERMS: Perm[] = ['overview', 'fittings', 'production', 'orders', 'clients', 'catalogue', 'editions', 'messages', 'reports', 'settings', 'staff', 'audit', 'backup'];

export type DB = {
  v: number;
  cart: CartItem[];
  orders: Order[];
  bookings: Booking[];
  clients: Client[];
  commissions: Commission[];
  /** remaining in each edition, by piece slug */
  remaining: Record<string, number>;
  /** next edition number to give out, by piece slug */
  nextEdition: Record<string, number>;
  session: Session;
  /** Atelier staff signed in to the console (separate from the client session) */
  staff?: StaffMe | null;
  messages: Message[];
  /** Emails on the Letter list (count only in server mode) */
  subscribers: string[];
  subscriberCount?: number;
  /** Server mode: the API runs with sample data (codes shown on screen, demo gateway) */
  demo?: boolean;
  /** Server mode: taken fitting slots as "YYYY-MM-DD HH:MM" */
  taken?: string[];
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

const DAY = 86_400_000;
export const RESERVE_MS = DAY;
export const DEPOSIT = 10_000;
export const DELIVERY_FEES: Record<DeliveryMethod, number> = { dhaka: 0, outside: 0, collect: 0 };

export const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const fmtDate = (ms: number | string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(typeof ms === 'string' ? ms + 'T12:00:00' : ms).toLocaleDateString('en-GB', opts);
export const fmtHour = (t: string) => {
  const h = Number(t.slice(0, 2));
  return `${h > 12 ? h - 12 : h} ${h >= 12 ? 'pm' : 'am'}`;
};

const rand = (n: number) => Math.floor(Math.random() * n);
const code = (prefix: string) => {
  const d = new Date();
  const yymmdd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}-${yymmdd}-${String(1000 + rand(9000))}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);

/** Normalise Bangladeshi mobile numbers to 01XXXXXXXXX */
export const normPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  const local = d.startsWith('880') ? d.slice(2) : d;
  return local.length === 11 && local.startsWith('01') ? local : null;
};

/* ── Seed ────────────────────────────────────────────────────────────── */

export const DEMO_CLIENT_PHONE = '01700000000';

function seed(): DB {
  const now = Date.now();
  const remaining = Object.fromEntries(getPieces().map((p) => [p.slug, p.remaining]));
  const nextEdition = Object.fromEntries(getPieces().map((p) => [p.slug, p.edition - p.remaining + 1]));
  const tanvir: Client = {
    id: 'c-tanvir',
    name: 'Tanvir Rahman',
    phone: DEMO_CLIENT_PHONE,
    email: 'tanvir@example.com',
    since: now - 40 * DAY,
    measures: { Chest: 102, Waist: 86, Seat: 100, Shoulder: 46.5, Sleeve: 64, 'Back length': 76, Neck: 40, 'Trouser waist': 84, Inseam: 81, Thigh: 58 },
    notes: 'Left shoulder sits 1 cm low — pad lightly. Likes a close waist, half-break on the trouser.',
    measuredBy: 'A. Karim',
    measuredAt: now - 6 * DAY,
  };
  const nadia: Client = {
    id: 'c-nadia',
    name: 'Nadia Chowdhury',
    phone: '01811111111',
    email: 'nadia@example.com',
    since: now - 12 * DAY,
    measures: { Chest: 88, Waist: 70, Seat: 96, Shoulder: 39, Sleeve: 58, 'Back length': 40 },
    notes: 'Champagne gown for a February wedding. Drape to be set at first fitting.',
    measuredBy: 'A. Karim',
    measuredAt: now - 3 * DAY,
  };
  const stageDates = (doneUpTo: number, start: number) => STAGES.map((_, i) => (i < doneUpTo ? start + i * 1.6 * DAY : null));
  return {
    v: 1,
    cart: [],
    messages: [
      { id: 'MSG-261119-4410', createdAt: now - 20 * 3600_000, name: 'Sabrina Haque', phone: '01911223344', email: 'sabrina@example.com', topic: 'made-to-measure', message: 'Could the Ivory Raw Silk Sherwani be made for my husband by the 20th of January? We would like to come in together for the first fitting.', read: false },
      { id: 'MSG-261117-1093', createdAt: now - 3 * DAY, name: 'Farhan Kabir', phone: '', email: 'farhan@example.com', topic: 'order', message: 'My Noir Bandhgala arrived today — thank you. Is it possible to have the sleeves shortened by a centimetre?', read: true },
    ],
    subscribers: [],
    orders: [
      {
        id: 'NX-261102-4417',
        createdAt: now - 18 * DAY,
        items: [{ slug: 'noir-bandhgala', name: 'Noir Bandhgala', size: '50', price: 76000, editionNo: 9 }],
        customer: { name: 'Tanvir Rahman', phone: DEMO_CLIENT_PHONE, email: 'tanvir@example.com', address: 'House 8, Road 27', area: 'Banani', city: 'Dhaka' },
        delivery: 'dhaka',
        deliveryFee: 0,
        payment: 'card',
        paid: true,
        total: 76000,
        status: 'delivered',
        clientId: 'c-tanvir',
      },
    ],
    bookings: [
      {
        id: 'FT-261114-2210',
        createdAt: now - 9 * DAY,
        date: ymd(new Date(now - 6 * DAY)),
        time: '15:00',
        purpose: 'new-piece',
        pieceSlug: 'midnight-tuxedo',
        name: 'Tanvir Rahman',
        phone: DEMO_CLIENT_PHONE,
        email: 'tanvir@example.com',
        note: 'For my brother’s wedding in December.',
        deposit: DEPOSIT,
        depositMethod: 'bkash',
        status: 'attended',
        clientId: 'c-tanvir',
      },
      {
        id: 'FT-261120-3381',
        createdAt: now - 2 * DAY,
        date: ymd(new Date(now + 4 * DAY)),
        time: '17:00',
        purpose: 'fitting',
        pieceSlug: 'midnight-tuxedo',
        name: 'Tanvir Rahman',
        phone: DEMO_CLIENT_PHONE,
        email: 'tanvir@example.com',
        note: 'Second fitting.',
        deposit: 0,
        status: 'confirmed',
        clientId: 'c-tanvir',
      },
      {
        id: 'FT-261120-5120',
        createdAt: now - DAY,
        date: ymd(new Date(now + 1 * DAY)),
        time: '13:00',
        purpose: 'fitting',
        pieceSlug: 'champagne-draped-gown',
        name: 'Nadia Chowdhury',
        phone: '01811111111',
        email: 'nadia@example.com',
        note: 'First fitting — set the drape.',
        deposit: 0,
        status: 'confirmed',
        clientId: 'c-nadia',
      },
    ],
    clients: [tanvir, nadia],
    commissions: [
      {
        id: 'MT-261114-0701',
        clientId: 'c-tanvir',
        pieceSlug: 'midnight-tuxedo',
        editionNo: 7,
        price: 135000,
        stage: 5,
        stageDates: stageDates(5, now - 6 * DAY),
        photos: {},
        readyBy: ymd(new Date(now + 27 * DAY)),
        notes: 'Satin facings to be cut from the second bolt.',
      },
      {
        id: 'MT-261117-0902',
        clientId: 'c-nadia',
        pieceSlug: 'champagne-draped-gown',
        editionNo: 12,
        price: 168000,
        stage: 3,
        stageDates: stageDates(3, now - 3 * DAY),
        photos: {},
        readyBy: ymd(new Date(now + 40 * DAY)),
        notes: '',
      },
    ],
    remaining,
    nextEdition,
    session: null,
  };
}

/* ── Persistence + subscription ──────────────────────────────────────── */

const KEY = 'nirolax-demo-v1';
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE === 'server';

/** Server mode starts from nothing but the catalogue's edition counts; the API fills the rest. */
function blank(): DB {
  const s = seed();
  return { ...s, orders: [], bookings: [], clients: [], commissions: [], messages: [], subscribers: [], session: null, taken: [] };
}
let db: DB | null = null;
const listeners = new Set<() => void>();

export function load(): DB {
  if (db) return db;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(API_MODE ? KEY + '-cart' : KEY) : null;
    if (API_MODE) db = { ...blank(), cart: raw ? (JSON.parse(raw) as CartItem[]) : [] };
    else db = raw ? (JSON.parse(raw) as DB) : seed();
    if (!db.messages) db = { ...db, messages: seed().messages, subscribers: [] };
  } catch {
    db = API_MODE ? blank() : seed();
  }
  // Expired cart reservations go back to the edition
  const cut = Date.now() - RESERVE_MS;
  if (db.cart.some((c) => c.addedAt < cut)) db = { ...db, cart: db.cart.filter((c) => c.addedAt >= cut) };
  return db;
}

function save() {
  try {
    if (API_MODE) window.localStorage.setItem(KEY + '-cart', JSON.stringify(db!.cart));
    else window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable (private mode / sandbox) — keep in memory */
  }
}

function set(next: DB) {
  db = next;
  save();
  listeners.forEach((l) => l());
}

export function mutate(fn: (d: DB) => DB) {
  set(fn(load()));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    db = null;
    load();
    listeners.forEach((l) => l());
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const SERVER_SNAPSHOT = API_MODE ? blank() : seed();

/** Read from the store; re-renders when it changes. */
export function useDB<T>(select: (d: DB) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(load()),
    () => select(SERVER_SNAPSHOT),
  );
}

export function resetDemo() {
  set({ ...seed(), session: load().session, staff: load().staff });
}

/* ── UI: cart drawer open state (not persisted) ──────────────────────── */

let drawer = false;
const drawerListeners = new Set<() => void>();
export const openCart = (v = true) => {
  drawer = v;
  drawerListeners.forEach((l) => l());
};
export const useCartOpen = () =>
  useSyncExternalStore(
    (l) => {
      drawerListeners.add(l);
      return () => drawerListeners.delete(l);
    },
    () => drawer,
    () => false,
  );

/* ── Actions: shop ───────────────────────────────────────────────────── */

export function addToCart(slug: string, size: string, price: number) {
  mutate((d) => {
    if (d.cart.some((c) => c.slug === slug && c.size === size)) return d;
    return { ...d, cart: [...d.cart, { id: uid(), slug, size, price, addedAt: Date.now() }] };
  });
  openCart(true);
}

export function clearCart() {
  mutate((d) => (d.cart.length ? { ...d, cart: [] } : d));
}

export function removeFromCart(id: string) {
  mutate((d) => ({ ...d, cart: d.cart.filter((c) => c.id !== id) }));
}

export function placeOrder(input: { customer: Customer; delivery: DeliveryMethod; payment: PaymentMethod }): Order {
  const d = load();
  const items = d.cart.map((c) => {
    const p = getPieces().find((x) => x.slug === c.slug)!;
    return { slug: c.slug, name: p.name, size: c.size, price: c.price, editionNo: 0 };
  });
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const deliveryFee = DELIVERY_FEES[input.delivery];
  const phone = normPhone(input.customer.phone);
  const client = d.clients.find((c) => c.phone === phone);
  const order: Order = {
    id: code('NX'),
    createdAt: Date.now(),
    items,
    customer: input.customer,
    delivery: input.delivery,
    deliveryFee,
    payment: input.payment,
    paid: false,
    total: subtotal + deliveryFee,
    status: input.payment === 'cod' ? 'confirmed' : 'awaiting-payment',
    clientId: client?.id,
  };
  mutate((x) => ({ ...x, orders: [order, ...x.orders] }));
  if (input.payment === 'cod') finaliseOrder(order.id, false);
  return order;
}

/** Payment cleared (or COD accepted): number the pieces, close the reservation, empty the cart. */
export function finaliseOrder(id: string, paid: boolean) {
  mutate((d) => {
    const remaining = { ...d.remaining };
    const nextEdition = { ...d.nextEdition };
    const orders = d.orders.map((o) => {
      if (o.id !== id) return o;
      const items = o.items.map((it) => {
        if (it.editionNo) return it;
        const n = nextEdition[it.slug] ?? 1;
        nextEdition[it.slug] = n + 1;
        remaining[it.slug] = Math.max(0, (remaining[it.slug] ?? 0) - 1);
        return { ...it, editionNo: n };
      });
      return { ...o, items, paid: paid || o.paid, status: 'confirmed' as const };
    });
    return { ...d, orders, remaining, nextEdition, cart: [] };
  });
}

export function failOrder(id: string) {
  mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' as const } : o)) }));
}

/* ── Actions: fittings ───────────────────────────────────────────────── */

export const HOURS = ['11:00', '13:00', '15:00', '17:00', '19:00'];

/** Atelier days: closed on Fridays */
/** The next open days, in Dhaka time (the same on the server and in the browser) */
export function atelierDays(count = 14, closedWeekdays: number[] = [5], closedDates: string[] = []): string[] {
  const out: string[] = [];
  let t = Date.now() + 6 * 3600_000 + 86_400_000; // tomorrow in Dhaka
  for (let guard = 0; out.length < count && guard < 120; guard++, t += 86_400_000) {
    const d = new Date(t);
    const key = d.toISOString().slice(0, 10);
    if (!closedWeekdays.includes(d.getUTCDay()) && !closedDates.includes(key)) out.push(key);
  }
  return out;
}

/** A slot is taken if a live booking holds it, or (demo) by a stable pattern so the calendar looks real. */
export function slotTaken(d: DB, date: string, time: string) {
  if (API_MODE) return !!d.taken?.includes(`${date} ${time}`);
  if (d.bookings.some((b) => b.date === date && b.time === time && b.status !== 'cancelled')) return true;
  return (date.charCodeAt(9) + time.charCodeAt(1)) % 4 === 0;
}

export function createBooking(input: Omit<Booking, 'id' | 'createdAt' | 'status' | 'deposit' | 'clientId'>): Booking {
  const d = load();
  const phone = normPhone(input.phone) ?? input.phone;
  let client = d.clients.find((c) => c.phone === phone);
  const clients = [...d.clients];
  if (!client) {
    client = { id: 'c-' + uid(), name: input.name, phone, email: input.email, since: Date.now(), measures: {}, notes: '' };
    clients.push(client);
  }
  const deposit = input.purpose === 'new-piece' ? DEPOSIT : 0;
  const booking: Booking = {
    ...input,
    phone,
    id: code('FT'),
    createdAt: Date.now(),
    deposit,
    status: deposit ? 'awaiting-deposit' : 'confirmed',
    clientId: client.id,
  };
  mutate((x) => ({ ...x, clients, bookings: [booking, ...x.bookings] }));
  return booking;
}

export function confirmDeposit(id: string, method: Exclude<PaymentMethod, 'cod'>) {
  mutate((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? { ...b, depositMethod: method, status: 'confirmed' as const } : b)) }));
}

export function setBookingStatus(id: string, status: BookingStatus) {
  mutate((d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }));
}

/* ── Actions: sessions ───────────────────────────────────────────────── */

/** Demo sign-in: any registered phone; the code is always accepted (no SMS in the demo). */
export function signInClient(phone: string): Client | null {
  const p = normPhone(phone);
  const c = load().clients.find((x) => x.phone === p);
  if (!c) return null;
  mutate((d) => ({ ...d, session: { role: 'client', clientId: c.id } }));
  return c;
}
export const ATELIER_DEMO = { email: 'atelier@nirolax.com', password: 'atelier2026' };
export const DEMO_CLIENT_PASSWORD = 'Demo@1234';
export const DEMO_OTP = '222222';
export function signInAtelier(email: string, password: string) {
  if (email.trim().toLowerCase() !== ATELIER_DEMO.email || password !== ATELIER_DEMO.password) return false;
  mutate((d) => ({ ...d, staff: { _id: 'st-owner', name: 'Imran Chowdhury', email: ATELIER_DEMO.email, role: 'owner', can: ALL_PERMS } }));
  return true;
}
export function signOutStaff() {
  mutate((d) => ({ ...d, staff: null }));
}

/* Static demo accounts (the real ones live on the server) */
export function findAccount(id: string) {
  const p = normPhone(id);
  const e = id.trim().toLowerCase();
  return load().clients.find((c) => (p ? c.phone === p : c.email.toLowerCase() === e));
}
export function passwordOf(c: Client) {
  return c.demoPassword ?? (c.id === 'c-tanvir' || c.id === 'c-nadia' ? DEMO_CLIENT_PASSWORD : undefined);
}
export function registerLocal(r: { name: string; email: string; phone: string; password: string }) {
  const phone = normPhone(r.phone)!;
  const found = load().clients.find((c) => c.phone === phone);
  const client: Client = found
    ? { ...found, name: r.name, email: r.email, demoPassword: r.password, hasPassword: true }
    : { id: 'c-' + Math.random().toString(36).slice(2, 8), name: r.name, phone, email: r.email, since: Date.now(), measures: {}, notes: '', demoPassword: r.password, hasPassword: true };
  mutate((d) => ({ ...d, clients: [...d.clients.filter((c) => c.id !== client.id), client], session: { role: 'client', clientId: client.id } }));
  return { client, attached: !!found };
}
export function updateMe(patch: Partial<Pick<Client, 'name' | 'email' | 'address' | 'saved' | 'demoPassword' | 'hasPassword'>>) {
  mutate((d) => {
    const s = d.session;
    if (!s) return d;
    return { ...d, clients: d.clients.map((c) => (c.id === s.clientId ? { ...c, ...patch } : c)) };
  });
}

export function signOut() {
  mutate((d) => ({ ...d, session: null }));
}

/* ── Actions: atelier console ────────────────────────────────────────── */

export function advanceStage(id: string, dir: 1 | -1) {
  mutate((d) => ({
    ...d,
    commissions: d.commissions.map((c) => {
      if (c.id !== id) return c;
      const stage = Math.min(STAGES.length - 1, Math.max(0, c.stage + dir));
      const stageDates = [...c.stageDates];
      if (dir === 1) stageDates[c.stage] = Date.now();
      else stageDates[stage] = null;
      return { ...c, stage, stageDates };
    }),
  }));
}

export function setStagePhoto(id: string, stageSlug: string, dataUrl: string | null) {
  mutate((d) => ({
    ...d,
    commissions: d.commissions.map((c) => {
      if (c.id !== id) return c;
      const photos = { ...c.photos };
      if (dataUrl) photos[stageSlug] = dataUrl;
      else delete photos[stageSlug];
      return { ...c, photos };
    }),
  }));
}

export function updateCommission(id: string, patch: Partial<Commission>) {
  mutate((d) => ({ ...d, commissions: d.commissions.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}

export function createCommission(clientId: string, pieceSlug: string) {
  const p = getPieces().find((x) => x.slug === pieceSlug)!;
  mutate((d) => {
    const n = d.nextEdition[pieceSlug] ?? 1;
    const c: Commission = {
      id: code('MT'),
      clientId,
      pieceSlug,
      editionNo: n,
      price: p.mtm,
      stage: 1,
      stageDates: STAGES.map((_, i) => (i === 0 ? Date.now() : null)),
      photos: {},
      readyBy: ymd(new Date(Date.now() + 35 * DAY)),
      notes: '',
    };
    return {
      ...d,
      commissions: [c, ...d.commissions],
      nextEdition: { ...d.nextEdition, [pieceSlug]: n + 1 },
      remaining: { ...d.remaining, [pieceSlug]: Math.max(0, (d.remaining[pieceSlug] ?? 0) - 1) },
    };
  });
}

export function updateClient(id: string, patch: Partial<Client>) {
  mutate((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}

export function setOrderStatus(id: string, status: OrderStatus) {
  mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
}

export function setRemaining(slug: string, n: number) {
  mutate((d) => ({ ...d, remaining: { ...d.remaining, [slug]: Math.max(0, n) } }));
}

/* ── Actions: the Letter, contact, messages ──────────────────────────── */

export function joinLetter(email: string): boolean {
  const e = email.trim().toLowerCase();
  const had = load().subscribers.includes(e);
  if (!had) mutate((d) => ({ ...d, subscribers: [...d.subscribers, e] }));
  return had;
}

export function sendMessage(m: Omit<Message, 'id' | 'createdAt' | 'read'>): Message {
  const msg: Message = { ...m, id: code('MSG'), createdAt: Date.now(), read: false };
  mutate((d) => ({ ...d, messages: [msg, ...d.messages] }));
  return msg;
}

export function setMessageRead(id: string, read: boolean) {
  mutate((d) => ({ ...d, messages: d.messages.map((m) => (m.id === id ? { ...m, read } : m)) }));
}
