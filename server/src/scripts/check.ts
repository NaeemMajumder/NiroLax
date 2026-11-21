/**
 * Checks the real services from your own computer:
 *   npm run check        → MongoDB (and seeds an empty database), Cloudinary, SMS/email setup
 */
import { env } from '../env.js';

const line = (ok: boolean | null, label: string, detail = '') => console.log(`${ok === null ? '·' : ok ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`);

console.log(`\nNirolax API check (${env.NODE_ENV}, demo: ${env.DEMO_MODE})\n`);

if (env.DATA_SOURCE === 'mongo') {
  try {
    const { connect, db } = await import('../db.js');
    const { seedIfEmpty } = await import('../seed.js');
    await connect();
    await seedIfEmpty();
    const s = db();
    const counts = await Promise.all((['pieces', 'editions', 'staff', 'clients', 'orders', 'bookings'] as const).map(async (k) => `${k} ${await s[k].count()}`));
    line(true, `MongoDB "${env.MONGODB_DB}"`, counts.join(' · '));
  } catch (e) {
    line(false, 'MongoDB', (e as Error).message);
  }
} else line(null, 'MongoDB', 'DATA_SOURCE=memory (nothing to check)');

if (env.cloudinary) {
  const { cloud, key, secret } = env.cloudinary;
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, { headers: { Authorization: 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64') } }).catch((e: Error) => e);
  line(r instanceof Response && r.ok, `Cloudinary "${cloud}" → folder "${env.CLOUDINARY_FOLDER}"`, r instanceof Response ? `HTTP ${r.status}` : r.message);
} else line(null, 'Cloudinary', 'not set — uploads are kept in the database');

line(env.SMS_API_URL ? true : null, 'SMS', env.SMS_API_URL ? 'gateway set' : 'not set — messages go to the console outbox');
line(env.SMTP_HOST ? true : null, 'Email', env.SMTP_HOST ? `SMTP ${env.SMTP_HOST}` : 'not set — emails go to the console outbox');
line(null, 'Payments', env.PAYMENT_PROVIDER === 'demo' ? 'demo gateway' : `SSLCommerz${env.SSLCZ_SANDBOX ? ' (sandbox)' : ''}`);
process.exit(0);
