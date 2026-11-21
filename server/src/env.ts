import 'dotenv/config';
import { z } from 'zod';

/**
 * All configuration in one place, using the same names as Ruposhi 2.
 * The server refuses to start with an unsafe production config.
 */
const bool = (d: 'true' | 'false') => z.enum(['true', 'false']).default(d).transform((v) => v === 'true');
const DEV = 'dev-only-secret-change-me-dev-only-secret';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  /** mongo = MongoDB (Atlas); memory = in-process store for local work and tests (resets on restart) */
  DATA_SOURCE: z.enum(['mongo', 'memory']).default('memory'),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.string().default('nirolax'),
  /** Public URL of the website (CLIENT_URL; WEB_URL also accepted) */
  CLIENT_URL: z.string().url().optional(),
  WEB_URL: z.string().url().optional(),
  /** Public URL of this API — used for payment callbacks */
  API_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),

  JWT_SECRET: z.string().min(32).default(DEV),
  JWT_ADMIN_SECRET: z.string().min(32).default(DEV + '-staff'),
  OTP_SECRET: z.string().min(32).default(DEV + '-otp'),
  PAYMENT_SECRET: z.string().min(32).default(DEV + '-pay'),
  WEBHOOK_SECRET: z.string().min(32).default(DEV + '-hook'),
  CUSTOMER_SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  ADMIN_SESSION_HOURS: z.coerce.number().int().min(1).max(72).default(12),

  /** Demo: sample data, OTP is always DEMO_OTP_CODE, demo gateway, sample staff logins */
  DEMO_MODE: bool('true'),
  DEMO_OTP_CODE: z.string().regex(/^\d{6}$/).default('222222'),
  /** First owner account when the database has no staff yet (required outside demo mode) */
  ATELIER_EMAIL: z.string().email().default('atelier@nirolax.com'),
  ATELIER_PASSWORD: z.string().min(8).default('atelier2026'),

  PAYMENT_PROVIDER: z.enum(['demo', 'sslcommerz']).default('demo'),
  SSLCZ_STORE_ID: z.string().optional(),
  SSLCZ_STORE_PASSWORD: z.string().optional(),
  SSLCZ_SANDBOX: bool('true'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('nirolax'),

  /** SMS gateway (BulkSMSBD-style). Without it, messages go to the outbox log only. */
  SMS_API_URL: z.string().url().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  /** Email (e.g. Brevo SMTP). Without it, emails go to the outbox log only. */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Nirolax <atelier@nirolax.com>'),
});

// Empty values (e.g. `COOKIE_DOMAIN=`) count as not set
const parsed = schema.safeParse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '')));
if (!parsed.success) {
  throw new Error('Invalid environment:\n' + parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'));
}
const raw = parsed.data;
const WEB_URL = (raw.CLIENT_URL ?? raw.WEB_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
export const env = {
  ...raw,
  WEB_URL,
  API_URL: (raw.API_URL ?? `http://localhost:${raw.PORT}`).replace(/\/+$/, ''),
  cloudinary: raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET ? { cloud: raw.CLOUDINARY_CLOUD_NAME, key: raw.CLOUDINARY_API_KEY, secret: raw.CLOUDINARY_API_SECRET, folder: raw.CLOUDINARY_FOLDER } : null,
};

if (env.NODE_ENV === 'production') {
  if (env.DATA_SOURCE !== 'mongo' || !env.MONGODB_URI) throw new Error('Production needs DATA_SOURCE=mongo and MONGODB_URI.');
  for (const k of ['JWT_SECRET', 'JWT_ADMIN_SECRET', 'OTP_SECRET', 'PAYMENT_SECRET', 'WEBHOOK_SECRET'] as const) {
    if (env[k].startsWith('dev-only')) throw new Error(`Set a real ${k} (32+ random characters) in production.`);
  }
  if (env.PAYMENT_PROVIDER === 'sslcommerz' && (!env.SSLCZ_STORE_ID || !env.SSLCZ_STORE_PASSWORD)) throw new Error('SSLCommerz needs SSLCZ_STORE_ID and SSLCZ_STORE_PASSWORD.');
  if (WEB_URL.includes('localhost')) console.warn('[env] CLIENT_URL still points at localhost — payment return links will be wrong.');
}

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
