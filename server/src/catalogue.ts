/**
 * Season I lives in the database (`pieces` + `editions`). The server is the
 * source of truth for prices and edition numbers; the web app only displays them.
 */
import { db } from './db.js';
import type { Piece } from './types.js';

export const STAGE_SLUGS = ['measured', 'pattern', 'cutting', 'basting', 'first-fitting', 'stitching', 'second-fitting', 'finishing', 'pressing', 'final-fitting', 'ready'];
export const DEFAULT_HOURS = ['11:00', '13:00', '15:00', '17:00', '19:00'];
export const DEFAULT_DEPOSIT = 10_000;

export const getPiece = (slug: string) => db().pieces.get(slug);
export const allPieces = async (publishedOnly = false) => {
  const list = await db().pieces.all(undefined, { by: 'order', dir: 1 });
  return publishedOnly ? list.filter((p) => p.published) : list;
};
/** What the shop is allowed to see of a piece */
export const publicPiece = (p: Piece) => {
  const { _id, published, order, updatedAt, ...rest } = p;
  void _id; void published; void order; void updatedAt;
  return rest;
};
