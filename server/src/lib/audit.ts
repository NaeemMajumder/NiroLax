import type { Request } from 'express';
import { db } from '../db.js';
import { staffOf } from './auth.js';
import { uid } from './util.js';

/** Who changed what — with the document before and after. Never stores password hashes. */
const scrub = (v: unknown): unknown => {
  if (!v || typeof v !== 'object') return v;
  const { passwordHash, tokenVersion, failedLogins, lockedUntil, ...rest } = v as Record<string, unknown>;
  void passwordHash; void tokenVersion; void failedLogins; void lockedUntil;
  // photos as data URLs would bloat the log
  return JSON.parse(JSON.stringify(rest, (_k, x) => (typeof x === 'string' && x.startsWith('data:') ? '[image]' : x)));
};

export async function audit(req: Request, action: string, target: string, before?: unknown, after?: unknown) {
  const s = staffOf(req);
  await db()
    .audit.insert({ _id: 'au-' + uid(), at: Date.now(), staffId: s?._id ?? 'system', staffName: s?.name ?? 'System', action, target, before: scrub(before), after: scrub(after) })
    .catch(() => {});
}
