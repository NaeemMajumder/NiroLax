import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { connect } from './db.js';
import { env, corsOrigins } from './env.js';
import { seedIfEmpty } from './seed.js';
import { errorHandler } from './lib/util.js';
import { shop } from './routes/shop.js';
import { account } from './routes/account.js';
import { atelier } from './routes/console.js';

/** Connect + seed once per process (and retry if it failed) */
let booting: Promise<void> | null = null;
export const ready = () =>
  (booting ??= (async () => {
    await connect();
    await seedIfEmpty();
  })().catch((e) => {
    booting = null;
    throw e;
  }));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || corsOrigins.includes(origin)),
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use('/api/v1/console/restore', express.json({ limit: '25mb' })); // a full backup file
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: false, limit: '200kb' })); // SSLCommerz posts form data
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'unknown'),
      skip: () => env.NODE_ENV === 'test',
    }),
  );
  // CSRF: a browser request that changes something must come from the site itself
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path.startsWith('/api/v1/payments/sslcommerz')) return next();
    const origin = req.get('origin');
    if (origin && !corsOrigins.includes(origin) && origin !== env.WEB_URL) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This request did not come from the Nirolax site.' } });
    next();
  });
  // No MongoDB operators from outside ("$where", "$gt" …) — every input is plain data
  app.use((req, _res, next) => {
    const clean = (v: unknown): unknown => {
      if (Array.isArray(v)) return v.map(clean);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('$') && !k.includes('.')).map(([k, x]) => [k, clean(x)]));
      return v;
    };
    if (req.body && typeof req.body === 'object') req.body = clean(req.body);
    next();
  });
  app.use((_req, res, next) => {
    ready().then(
      () => next(),
      (e) => {
        console.error('Start-up failed:', e);
        res.status(503).json({ error: { code: 'UNAVAILABLE', message: 'The atelier is opening — please try again in a moment.' } });
      },
    );
  });

  app.get('/', (_req, res) => res.json({ name: 'Nirolax API', docs: '/api/v1/health' }));
  app.use('/api/v1', shop);
  app.use('/api/v1', account);
  app.use('/api/v1/console', atelier);
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }));
  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
