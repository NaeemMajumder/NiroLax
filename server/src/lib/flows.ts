/** Business steps shared by several routes (payment callbacks, demo gateway, COD). All are idempotent. */
import { db } from '../db.js';
import { normPhone, uid } from './util.js';
import { later, sendEmail, sendSms } from './notify.js';
import { getSettings } from './settings.js';
import { env } from '../env.js';
import type { Booking, Client, Order } from '../types.js';

const taka = (n: number) => 'BDT ' + n.toLocaleString('en-IN');
const when = (date: string, time: string) => {
  const d = new Date(date + 'T12:00:00+06:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });
  const [h, m] = time.split(':').map(Number);
  return `${d}, ${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`;
};
/** Tell the atelier (settings → notifications) */
export async function tellAtelier(kind: 'onOrder' | 'onBooking' | 'onMessage', subject: string, text: string) {
  const s = await getSettings();
  if (!s.notify[kind]) return;
  if (s.notify.phone) later(sendSms(s.notify.phone, `Nirolax atelier: ${subject}`, 'staff'));
  if (s.notify.email) later(sendEmail(s.notify.email, subject, text, 'staff'));
}

/** SMS (and email, if given) receipt once an order is confirmed */
export function orderReceipt(o: Order) {
  const nos = o.items.map((i) => (i.editionNo ? `${i.name} No.${String(i.editionNo).padStart(2, '0')}` : i.name)).join(', ');
  const pay = o.paid ? 'Paid ' + taka(o.total) : 'Pay ' + taka(o.total) + ' on delivery';
  later(sendSms(o.customer.phone, `Nirolax: thank you, ${o.customer.name.split(' ')[0]}. Order ${o._id} is confirmed — ${nos}. ${pay}. Track it: ${env.WEB_URL}/portal`, 'receipt'));
  if (o.customer.email)
    later(
      sendEmail(
        o.customer.email,
        `Your Nirolax order ${o._id}`,
        [`Dear ${o.customer.name},`, '', 'Thank you. Your order is confirmed:', ...o.items.map((i) => `  · ${i.name}, size ${i.size}${i.editionNo ? ` — Nº ${String(i.editionNo).padStart(2, '0')}` : ''} — ${taka(i.price)}`), '', `${pay}. Delivery is complimentary.`, `Follow it in your portal: ${env.WEB_URL}/portal`, '', 'With thanks,', 'The Nirolax atelier'].join('\n'),
        'receipt',
      ),
    );
  later(tellAtelier('onOrder', `new order ${o._id} — ${nos} — ${taka(o.total)} (${o.payment.toUpperCase()})`, `New order ${o._id} from ${o.customer.name} (${o.customer.phone}).\n${nos}\n${pay}`));
}

/** SMS confirmation once an appointment is confirmed */
export async function bookingConfirmation(b: Booking) {
  const s = await getSettings();
  later(sendSms(b.phone, `Nirolax: you are expected on ${when(b.date, b.time)} at ${s.atelier.address1}, ${s.atelier.address2.split(',')[0]}. Ref ${b._id}. To change it: ${env.WEB_URL}/portal`, 'booking'));
  if (b.email) later(sendEmail(b.email, 'Your fitting at Nirolax', `Dear ${b.name},\n\nYou are expected on ${when(b.date, b.time)} at ${s.atelier.address1}, ${s.atelier.address2}.\nReference ${b._id}.\n\nTo change or cancel: ${env.WEB_URL}/portal\n\nThe Nirolax atelier`, 'booking'));
  later(tellAtelier('onBooking', `${b.purpose.replace('-', ' ')} booked — ${b.name}, ${when(b.date, b.time)}`, `${b.name} (${b.phone}) booked ${b.purpose} on ${when(b.date, b.time)}. Ref ${b._id}.`));
}

/** Payment cleared or COD accepted: number each piece from its edition and confirm. */
export async function finaliseOrder(id: string, paid: boolean, ref?: string): Promise<Order | null> {
  const s = db();
  const o = await s.orders.get(id);
  if (!o || o.status === 'cancelled') return o;
  if (o.status !== 'awaiting-payment' && o.items.every((i) => i.editionNo)) return o; // already done
  const items = [];
  for (const it of o.items) {
    if (it.editionNo) {
      items.push(it);
      continue;
    }
    const n = await s.takeEdition(it.slug);
    // Edition closed between checkout and payment: keep the order but flag it for the atelier (refund or alternative size)
    items.push({ ...it, editionNo: n ?? 0 });
  }
  const timeline = [...(o.timeline ?? []), { at: Date.now(), by: 'System', text: paid ? `Payment received${ref ? ` (${ref})` : ''} — pieces numbered` : 'Confirmed — cash on delivery, pieces numbered' }];
  const done = await s.orders.set(id, { items, paid: paid || o.paid, status: 'confirmed', timeline, ...(ref ? { paymentRef: ref } : {}) });
  if (done) orderReceipt(done);
  return done;
}

export async function cancelOrder(id: string) {
  const o = await db().orders.get(id);
  if (o && o.status === 'awaiting-payment') await db().orders.set(id, { status: 'cancelled', timeline: [...(o.timeline ?? []), { at: Date.now(), by: 'System', text: 'Payment not completed — cancelled' }] });
}

export async function confirmBookingDeposit(id: string, ref?: string): Promise<Booking | null> {
  const b = await db().bookings.get(id);
  if (!b || b.status !== 'awaiting-deposit') return b;
  const done = await db().bookings.set(id, { status: 'confirmed', ...(ref ? { paymentRef: ref } : {}) });
  if (done) later(bookingConfirmation(done));
  return done;
}

export async function cancelBooking(id: string) {
  const b = await db().bookings.get(id);
  if (b && b.status === 'awaiting-deposit') await db().bookings.set(id, { status: 'cancelled' });
}

/** Find the client for a phone number, creating them on first contact */
export async function clientFor(p: { name: string; phone: string; email?: string }): Promise<Client> {
  const s = db();
  const phone = normPhone(p.phone)!;
  const found = await s.clients.one({ phone });
  if (found) {
    if (!found.email && p.email) return (await s.clients.set(found._id, { email: p.email }))!;
    return found;
  }
  return s.clients.insert({ _id: 'c-' + uid(), name: p.name, phone, email: p.email ?? '', since: Date.now(), measures: {}, notes: '' });
}
