import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

/** Dhaka is UTC+6 with no daylight saving */
export const dhakaDate = (ms = Date.now()) => new Date(ms + 6 * 3600_000).toISOString().slice(0, 10);

/** Reference codes like NX-261120-4417 (Dhaka date) */
export const code = (prefix: string) => {
  const d = dhakaDate().replace(/-/g, '').slice(2);
  return `${prefix}-${d}-${String(1000 + Math.floor(Math.random() * 9000))}`;
};
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Bangladeshi mobile → 01XXXXXXXXX, or null */
export const normPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  const local = d.startsWith('880') ? d.slice(2) : d;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
};
export const phone = z.string().transform((v, ctx) => {
  const n = normPhone(v);
  if (!n) {
    ctx.addIssue({ code: 'custom', message: 'A Bangladeshi mobile number, e.g. 01700 000000.' });
    return z.NEVER;
  }
  return n;
});

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
export const bad = (message: string, c = 'BAD_REQUEST') => new HttpError(400, c, message);

/** Validate a request body with zod and return the typed result */
export function body<S extends z.ZodType>(req: Request, schema: S): z.infer<S> {
  const r = schema.safeParse(req.body);
  if (!r.success) throw new HttpError(422, 'INVALID', r.error.issues[0]?.message ?? 'Invalid input');
  return r.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  void _next;
  if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  console.error(err);
  res.status(500).json({ error: { code: 'SERVER', message: 'Something went wrong on our side. Please try again.' } });
}
