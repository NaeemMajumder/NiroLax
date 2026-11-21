/**
 * End-to-end check of the API against the in-memory store:   npm test
 * Runs every flow the website and the console use, and stops at the first wrong answer.
 */
process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'memory';
process.env.DEMO_MODE = 'true';
process.env.DEMO_OTP_CODE = '222222';
process.env.PAYMENT_PROVIDER = 'demo';
// Ignore real keys from .env: tests never send SMS/email or upload anywhere
for (const k of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'SMS_API_URL', 'SMS_API_KEY', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MONGODB_URI', 'CLIENT_URL', 'CORS_ORIGINS']) process.env[k] = '';

const { default: app, ready } = await import('./app.js');
await ready();
const server = app.listen(0);
const port = (server.address() as { port: number }).port;
const base = `http://127.0.0.1:${port}/api/v1`;

const jar = new Map<string, string>();
async function call(method: string, path: string, body?: unknown, raw = false) {
  const r = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const c of r.headers.getSetCookie()) {
    const [kv] = c.split(';');
    const [k, v] = kv.split('=');
    if (v) jar.set(k, v);
    else jar.delete(k);
  }
  if (raw) return { status: r.status, j: {} as Record<string, any>, type: r.headers.get('content-type') ?? '', size: (await r.arrayBuffer()).byteLength };
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j: j as Record<string, any>, type: '', size: 0 };
}
let n = 0;
function ok(cond: unknown, msg: string, extra?: unknown) {
  n++;
  if (!cond) {
    console.error('✗', msg, extra ?? '');
    server.close();
    process.exit(1);
  }
  console.log('✓', msg);
}
const day = (k: number) => {
  let d = Date.now() + k * 86400000;
  while (new Date(d + 6 * 3600_000).getUTCDay() === 5) d += 86400000;
  return new Date(d + 6 * 3600_000).toISOString().slice(0, 10);
};

/* ── shop ── */
let r = await call('GET', '/health');
ok(r.status === 200 && r.j.ok, 'health');
r = await call('GET', '/catalogue/pieces');
ok(r.j.pieces.length === 10 && r.j.pieces[0].slug === 'midnight-tuxedo' && !('published' in r.j.pieces[0]), 'catalogue: 10 published pieces from the database');
r = await call('GET', '/settings');
ok(r.j.deposit === 10000 && r.j.hours.length === 5 && r.j.atelier.address1, 'settings: public atelier details');

r = await call('POST', '/orders', {
  items: [{ slug: 'midnight-tuxedo', size: '48' }],
  customer: { name: 'Arif Hossain', phone: '01912345678', email: 'arif@example.com', address: 'House 12, Road 5', area: 'Banani' },
  delivery: 'dhaka',
  payment: 'bkash',
});
ok(r.status === 201 && r.j.order.total === 110000 && r.j.next.startsWith('/pay?order='), 'order: priced by the server, sent to payment');
const orderId = r.j.order._id as string;
const orderKey = r.j.key as string;
r = await call('POST', '/orders', { items: [{ slug: 'midnight-tuxedo', size: '46' }], customer: { name: 'A B', phone: '01912345678', address: 'House 12, Road 5' }, delivery: 'dhaka', payment: 'cod' });
ok(r.status === 422, 'order: a sold-out size is refused');
r = await call('POST', '/payments/demo', { kind: 'order', id: orderId, key: orderKey, approve: true });
ok(r.j.order.status === 'confirmed' && r.j.order.items[0].editionNo === 24 && r.j.order.timeline.length === 2, 'payment: numbered Nº 24, timeline kept');

/* ── fittings ── */
const d1 = day(3);
r = await call('GET', '/slots');
const taken = new Set(r.j.taken as string[]);
const free = (r.j.hours as string[]).find((t) => !taken.has(`${d1} ${t}`))!;
r = await call('POST', '/bookings', { date: d1, time: free, purpose: 'new-piece', pieceSlug: 'ivory-raw-silk-sherwani', name: 'Arif Hossain', phone: '01912345678', method: 'bkash' });
ok(r.status === 201 && r.j.booking.deposit === 10000, 'booking: deposit asked');
const bk = r.j.booking._id as string;
r = await call('POST', '/payments/demo', { kind: 'booking', id: bk, key: r.j.key, approve: true });
ok(r.j.booking.status === 'confirmed', 'booking: confirmed after deposit');
r = await call('POST', '/contact', { name: 'Rumana Akter', email: 'rumana@example.com', topic: 'made-to-measure', message: 'Do you make waistcoats to order?' });
ok(r.status === 201, 'contact: note saved');
r = await call('POST', '/newsletter', { email: 'reader@example.com' });
ok(r.status === 201, 'newsletter: joined');

/* ── client accounts ── */
r = await call('POST', '/auth/register', { name: 'Arif Hossain', email: 'arif@example.com', phone: '01912345678', password: 'short' });
ok(r.status === 422, 'register: weak password refused');
r = await call('POST', '/auth/register', { name: 'Arif Hossain', email: 'arif@example.com', phone: '01912345678', password: 'Tailored1' });
ok(r.j.sent && r.j.demoCode === '222222', 'register: code sent (demo 222222)');
r = await call('POST', '/auth/register/verify', { phone: '01912345678', code: '111111' });
ok(r.status === 400, 'register: wrong code refused');
r = await call('POST', '/auth/register/verify', { phone: '01912345678', code: '222222' });
ok(r.j.role === 'client' && r.j.attached && r.j.orders.length === 1 && r.j.bookings.length === 1 && r.j.client.hasPassword && !r.j.client.passwordHash, 'register: guest orders and fittings attach to the new account');
await call('POST', '/auth/logout');
r = await call('POST', '/auth/login', { id: 'arif@example.com', password: 'wrong-pass1' });
ok(r.status === 401, 'login: wrong password refused');
r = await call('POST', '/auth/login', { id: '01912-345678', password: 'Tailored1' });
ok(r.j.role === 'client', 'login: by phone + password');
r = await call('PATCH', '/me', { name: 'Arif H. Hossain' });
ok(r.j.client.name === 'Arif H. Hossain', 'account: profile saved');
r = await call('PUT', '/me/saved/silk-column-gown');
ok(r.j.client.saved.includes('silk-column-gown'), 'account: piece saved to the wish list');
for (let i = 0; i < 5; i++) await call('POST', '/auth/login', { id: 'arif@example.com', password: 'nope-nope1' });
r = await call('POST', '/auth/login', { id: 'arif@example.com', password: 'Tailored1' });
ok(r.status === 429, 'login: locked after 5 wrong passwords');
r = await call('POST', '/auth/forgot', { phone: '01912345678' });
ok(r.j.sent, 'forgot: code sent');
r = await call('POST', '/auth/forgot', { phone: '01399999999' });
ok(r.j.sent, 'forgot: same answer for a number with no account');
r = await call('POST', '/auth/reset', { phone: '01912345678', code: '222222', password: 'NewTailored2' });
ok(r.j.role === 'client', 'reset: new password, signed in');
r = await call('POST', '/auth/login', { id: 'arif@example.com', password: 'NewTailored2' });
ok(r.j.role === 'client', 'login: works with the new password (lock cleared)');
r = await call('GET', '/console/state');
ok(r.status === 401, 'console: a client session cannot open it');
await call('POST', '/auth/logout');

/* ── staff & roles ── */
r = await call('POST', '/staff/login', { email: 'karim@nirolax.com', password: 'Tailor@1234' });
ok(r.j.staff.role === 'tailor', 'staff: tailor signs in');
r = await call('GET', '/console/state');
ok(r.j.orders.length === 0 && r.j.messages.length === 0 && r.j.staff.length === 0 && r.j.commissions.length === 2, 'staff: tailor sees only what the role allows (no orders, messages or staff)');
r = await call('PATCH', `/console/orders/${orderId}`, { status: 'packed' });
ok(r.status === 403, 'staff: tailor cannot change orders');
r = await call('PATCH', '/console/commissions/MT-261114-0701', { move: 1 });
ok(r.j.stage === 6, 'production: tailor moves a commission');
await call('POST', '/staff/logout');
r = await call('POST', '/staff/login', { email: 'atelier@nirolax.com', password: 'atelier2026' });
ok(r.j.staff.role === 'owner', 'staff: owner signs in');
r = await call('GET', '/console/state');
ok(r.j.orders.length === 2 && r.j.messages.length === 3 && r.j.staff.length === 5 && r.j.pieces.length === 10 && r.j.settings.deposit === 10000, 'console: owner sees everything');

/* orders */
r = await call('POST', `/console/orders/${orderId}/notes`, { text: 'Client asked for a fitting before delivery.' });
ok(r.j.notes.length === 1, 'orders: note added');
r = await call('POST', `/console/orders/${orderId}/courier`, { name: 'Pathao' });
ok(r.j.courier.tracking && r.j.status === 'packed', 'orders: courier booked, pressed & boxed');
r = await call('GET', '/catalogue');
const before = r.j.remaining['midnight-tuxedo'];
r = await call('POST', `/console/orders/${orderId}/cancel`, { reason: 'Client changed his mind', refund: true });
ok(r.j.status === 'cancelled' && r.j.refund.amount === 110000, 'orders: cancelled with a refund');
r = await call('GET', '/catalogue');
ok(r.j.remaining['midnight-tuxedo'] === before + 1, 'orders: the piece goes back to its edition');

/* fittings */
const d2 = day(5);
r = await call('GET', '/slots');
const t2 = new Set(r.j.taken as string[]);
const h2 = (r.j.hours as string[]).find((t) => !t2.has(`${d2} ${t}`))!;
r = await call('POST', '/console/bookings', { date: d2, time: h2, purpose: 'consultation', name: 'Walk-in Client', phone: '01612345678' });
ok(r.status === 201 && r.j.source === 'atelier', 'fittings: walk-in booked at the atelier');
const walk = r.j._id;
r = await call('PATCH', `/console/bookings/${bk}`, { date: d2, time: h2 });
ok(r.status === 409, 'fittings: cannot move onto a taken hour');

/* settings */
r = await call('GET', '/console/state');
const st = r.j.settings;
r = await call('PUT', '/console/settings', { ...st, closedDates: [d2], deposit: 15000, _id: undefined, updatedAt: undefined });
ok(r.j.deposit === 15000 && r.j.closedDates.includes(d2), 'settings: saved');
r = await call('GET', '/slots');
ok((r.j.taken as string[]).filter((x) => x.startsWith(d2)).length === r.j.hours.length, 'settings: a closed date shows no free hours');
r = await call('PATCH', `/console/bookings/${walk}`, { status: 'cancelled' });
ok(r.j.status === 'cancelled' && r.j.history.length === 2, 'fittings: cancelled with history');

/* catalogue */
r = await call('POST', '/console/pieces', { name: 'Midnight Waistcoat', no: '11', kind: 'Evening', cloth: 'Silk faille', tint: '#1b1b22', rtw: 38000, mtm: 46000, edition: 20, sizes: ['46', '48', '50'], line: 'Low-cut, shawl collar.', story: 'For the dinner jacket.', details: [], composition: '100% silk', care: 'Dry clean.', published: false });
ok(r.status === 201 && r.j.slug === 'midnight-waistcoat', 'catalogue: piece added (unpublished)');
r = await call('GET', '/catalogue/pieces');
ok(r.j.pieces.length === 10, 'catalogue: unpublished piece stays off the shop');
r = await call('PATCH', '/console/pieces/midnight-waistcoat', { published: true, rtw: 39000 });
ok(r.j.published && r.j.rtw === 39000, 'catalogue: published and repriced');
r = await call('GET', '/catalogue/pieces');
ok(r.j.pieces.length === 11, 'catalogue: now on the shop');
r = await call('DELETE', '/console/pieces/midnight-tuxedo');
ok(r.status === 409, 'catalogue: a sold piece cannot be deleted');
r = await call('POST', '/console/uploads/sign', { folder: 'pieces' });
ok(r.j.cloudinary === false, 'uploads: no Cloudinary keys here — falls back to resized images');

/* clients */
r = await call('POST', '/console/clients', { name: 'Sabrina Haque', phone: '01911223344', email: 'sabrina@example.com' });
ok(r.status === 201, 'clients: added by hand');
const sab = r.j._id;
r = await call('PATCH', `/console/clients/${sab}`, { measures: { Chest: 88 }, notes: 'Sherwani for her husband.' });
ok(r.j.measures.Chest === 88, 'clients: measure sheet saved');
r = await call('DELETE', `/console/clients/${sab}`);
ok(r.j.ok, 'clients: deleted on request');

/* staff */
r = await call('POST', '/console/staff', { name: 'New Tailor', email: 'new@nirolax.com', role: 'tailor', password: 'Welcome@123' });
ok(r.status === 201, 'staff: owner adds a tailor');
const newId = r.j._id;
r = await call('PATCH', '/console/staff/st-owner', { role: 'manager' });
ok(r.status === 409, 'staff: the last owner cannot be demoted');
r = await call('PATCH', `/console/staff/${newId}`, { active: false });
ok(r.j.active === false, 'staff: account switched off');

/* audit, exports, backup */
r = await call('GET', '/console/audit');
ok(r.j.audit.length >= 10 && r.j.audit.some((a: any) => a.staffName === 'Abdul Karim'), 'audit: who did what is recorded');
r = await call('GET', '/console/export/orders', undefined, true);
ok(r.status === 200 && r.type.includes('spreadsheetml') && r.size > 4000, 'export: orders as Excel');
r = await call('GET', '/console/backup');
ok(r.j.app === 'nirolax' && r.j.collections.orders.length === 2 && !r.j.collections.staff[0].passwordHash, 'backup: everything, without password hashes');
const backup = r.j;
await call('PATCH', '/console/messages/' + backup.collections.messages[0]._id, { read: true });
r = await call('POST', '/console/restore', backup);
ok(r.j.ok && r.j.counts.orders === 2, 'restore: backup put back');
r = await call('GET', '/console/outbox');
ok(r.j.outbox.some((o: any) => o.kind === 'receipt') && r.j.outbox.some((o: any) => o.kind === 'staff'), 'outbox: receipts and atelier notices logged');

/* client sees the console's changes */
await call('POST', '/staff/logout');
await call('POST', '/auth/demo-client');
r = await call('GET', '/me');
ok(r.j.commissions.find((x: any) => x._id === 'MT-261114-0701').stage === 6 && r.j.client.saved.length === 1, 'portal: new stage visible to the client');

console.log(`\nAll ${n} checks passed.`);
server.close();
process.exit(0);
