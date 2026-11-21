/**
 * Fills an empty database: Season I (pieces + editions), settings, the first owner,
 * and — in demo mode — sample staff, clients, commissions, orders and fittings.
 * Safe to run on every start: each part only runs when its collection is empty.
 */
import { STAGE_SLUGS, DEFAULT_DEPOSIT as DEPOSIT } from './catalogue.js';
import { SEED_PIECES } from './data/pieces.js';
import { db } from './db.js';
import { env } from './env.js';
import { hashPassword } from './lib/auth.js';
import { DEFAULT_SETTINGS } from './lib/settings.js';
import type { Role } from './types.js';

/** Sample staff (demo mode only). The owner keeps the original console login. */
export const DEMO_STAFF: { id: string; name: string; email: string; role: Role; password: string }[] = [
  { id: 'st-owner', name: 'Imran Chowdhury', email: 'atelier@nirolax.com', role: 'owner', password: 'atelier2026' },
  { id: 'st-manager', name: 'Farah Ahmed', email: 'farah@nirolax.com', role: 'manager', password: 'Manager@1234' },
  { id: 'st-tailor', name: 'Abdul Karim', email: 'karim@nirolax.com', role: 'tailor', password: 'Tailor@1234' },
  { id: 'st-orders', name: 'Rina Das', email: 'rina@nirolax.com', role: 'orders', password: 'Orders@1234' },
  { id: 'st-content', name: 'Mitu Sarkar', email: 'mitu@nirolax.com', role: 'content', password: 'Content@1234' },
];
export const DEMO_CLIENT_PASSWORD = 'Demo@1234';

const DAY = 86_400_000;
const ymd = (ms: number) => new Date(ms + 6 * 3600_000).toISOString().slice(0, 10); // Dhaka date

export async function seedIfEmpty() {
  const s = db();
  if ((await s.pieces.count()) === 0) {
    for (const [i, x] of SEED_PIECES.entries()) {
      const { remaining, ...rest } = x;
      void remaining;
      await s.pieces.insert({ _id: x.slug, ...rest, soldOut: x.soldOut ?? [], published: true, order: i + 1, updatedAt: Date.now() });
    }
  }
  if ((await s.editions.count()) === 0) {
    for (const x of SEED_PIECES) await s.editions.insert({ _id: x.slug, remaining: x.remaining, next: x.edition - x.remaining + 1 });
  }
  if (!(await s.settings.get('site'))) await s.settings.insert({ ...DEFAULT_SETTINGS, updatedAt: Date.now() });
  if ((await s.staff.count()) === 0) {
    const list = env.DEMO_MODE ? DEMO_STAFF : [{ id: 'st-owner', name: 'Owner', email: env.ATELIER_EMAIL, role: 'owner' as Role, password: env.ATELIER_PASSWORD }];
    for (const m of list) await s.staff.insert({ _id: m.id, name: m.name, email: m.email.toLowerCase(), role: m.role, passwordHash: await hashPassword(m.password), active: true, tokenVersion: 0, failedLogins: 0, createdAt: Date.now() });
  }
  if (!env.DEMO_MODE || (await s.clients.count()) > 0) return;
  const demoHash = await hashPassword(DEMO_CLIENT_PASSWORD);

  const now = Date.now();
  const dates = (done: number, start: number) => STAGE_SLUGS.map((_, i) => (i < done ? start + i * 1.6 * DAY : null));
  await s.clients.insert({
    _id: 'c-tanvir',
    name: 'Tanvir Rahman',
    phone: '01700000000',
    email: 'tanvir@nirolax.demo',
    since: now - 40 * DAY,
    passwordHash: demoHash,
    verified: true,
    tokenVersion: 0,
    saved: ['ivory-raw-silk-sherwani'],
    address: { address: 'House 8, Road 27', area: 'Banani', city: 'Dhaka' },
    measures: { Chest: 102, Waist: 86, Seat: 100, Shoulder: 46.5, Sleeve: 64, 'Back length': 76, Neck: 40, 'Trouser waist': 84, Inseam: 81, Thigh: 58 },
    notes: 'Left shoulder sits 1 cm low — pad lightly. Likes a close waist, half-break on the trouser.',
    measuredBy: 'A. Karim',
    measuredAt: now - 6 * DAY,
  });
  await s.clients.insert({
    _id: 'c-nadia',
    name: 'Nadia Chowdhury',
    phone: '01811111111',
    email: 'nadia@nirolax.demo',
    since: now - 12 * DAY,
    passwordHash: demoHash,
    verified: true,
    tokenVersion: 0,
    measures: { Chest: 88, Waist: 70, Seat: 96, Shoulder: 39, Sleeve: 58, 'Back length': 40 },
    notes: 'Champagne gown for a February wedding. Drape to be set at first fitting.',
    measuredBy: 'A. Karim',
    measuredAt: now - 3 * DAY,
  });
  await s.commissions.insert({ _id: 'MT-261114-0701', clientId: 'c-tanvir', pieceSlug: 'midnight-tuxedo', editionNo: 7, price: 135000, stage: 5, stageDates: dates(5, now - 6 * DAY), photos: {}, readyBy: ymd(now + 27 * DAY), notes: 'Satin facings to be cut from the second bolt.' });
  await s.commissions.insert({ _id: 'MT-261117-0902', clientId: 'c-nadia', pieceSlug: 'champagne-draped-gown', editionNo: 12, price: 168000, stage: 3, stageDates: dates(3, now - 3 * DAY), photos: {}, readyBy: ymd(now + 40 * DAY), notes: '' });
  await s.orders.insert({
    _id: 'NX-261102-4417',
    createdAt: now - 18 * DAY,
    items: [{ slug: 'noir-bandhgala', name: 'Noir Bandhgala', size: '50', price: 76000, editionNo: 9 }],
    customer: { name: 'Tanvir Rahman', phone: '01700000000', email: 'tanvir@nirolax.demo', address: 'House 8, Road 27', area: 'Banani', city: 'Dhaka' },
    delivery: 'dhaka',
    deliveryFee: 0,
    payment: 'card',
    paid: true,
    total: 76000,
    status: 'delivered',
    clientId: 'c-tanvir',
    courier: { name: 'Atelier', tracking: 'NX-4417A', bookedAt: now - 17 * DAY },
    timeline: [
      { at: now - 18 * DAY, by: 'Tanvir Rahman', text: 'Order placed on the website — card' },
      { at: now - 18 * DAY + 60_000, by: 'System', text: 'Payment received — pieces numbered' },
      { at: now - 17 * DAY, by: 'Rina Das', text: 'Courier booked — Atelier NX-4417A' },
      { at: now - 16 * DAY, by: 'Rina Das', text: 'Delivered' },
    ],
  });
  await s.bookings.insert({ _id: 'FT-261114-2210', createdAt: now - 9 * DAY, date: ymd(now - 6 * DAY), time: '15:00', purpose: 'new-piece', pieceSlug: 'midnight-tuxedo', name: 'Tanvir Rahman', phone: '01700000000', email: 'tanvir@nirolax.demo', note: 'For my brother’s wedding in December.', deposit: DEPOSIT, depositMethod: 'bkash', status: 'attended', clientId: 'c-tanvir' });
  await s.bookings.insert({ _id: 'FT-261120-3381', createdAt: now - 2 * DAY, date: ymd(now + 4 * DAY), time: '17:00', purpose: 'fitting', pieceSlug: 'midnight-tuxedo', name: 'Tanvir Rahman', phone: '01700000000', email: 'tanvir@nirolax.demo', note: 'Second fitting.', deposit: 0, status: 'confirmed', clientId: 'c-tanvir' });
  await s.bookings.insert({ _id: 'FT-261120-5120', createdAt: now - DAY, date: ymd(now + DAY), time: '13:00', purpose: 'fitting', pieceSlug: 'champagne-draped-gown', name: 'Nadia Chowdhury', phone: '01811111111', email: 'nadia@nirolax.demo', note: 'First fitting — set the drape.', deposit: 0, status: 'confirmed', clientId: 'c-nadia' });
  await s.messages.insert({ _id: 'MSG-261119-4410', createdAt: now - 20 * 3600_000, name: 'Sabrina Haque', phone: '01911223344', email: 'sabrina@example.com', topic: 'made-to-measure', message: 'Could the Ivory Raw Silk Sherwani be made for my husband by the 20th of January? We would like to come in together for the first fitting.', read: false });
  await s.messages.insert({ _id: 'MSG-261117-1093', createdAt: now - 3 * DAY, name: 'Farhan Kabir', phone: '', email: 'farhan@example.com', topic: 'order', message: 'My Noir Bandhgala arrived today — thank you. Is it possible to have the sleeves shortened by a centimetre?', read: true });
}
