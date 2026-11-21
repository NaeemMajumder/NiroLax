/**
 * Data layer. Two implementations of the same small interface:
 *  - mongo: MongoDB (Atlas in production)
 *  - memory: an in-process store for local work without a database, and for tests
 * Routes only ever talk to `db()`, so they do not care which one is running.
 */
import { MongoClient, type Db as MongoDb, type Filter, type Document } from 'mongodb';
import { env } from './env.js';
import { COLLECTIONS, type Collections, type Edition } from './types.js';

type Doc = { _id: string };
export type Coll<T extends Doc> = {
  all(filter?: Partial<T>, sort?: { by: keyof T & string; dir: 1 | -1 }): Promise<T[]>;
  get(id: string): Promise<T | null>;
  one(filter: Partial<T>): Promise<T | null>;
  insert(doc: T): Promise<T>;
  set(id: string, patch: Partial<T>): Promise<T | null>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
  /** Remove every document (backup restore only) */
  clear(): Promise<void>;
};
export type Store = { [K in keyof Collections]: Coll<Collections[K]> } & {
  /** Atomically take the next edition number of a piece; null when the edition is closed. */
  takeEdition(slug: string): Promise<number | null>;
};

/* ── memory ─────────────────────────────────────────────────────────── */

function memColl<T extends Doc>(): Coll<T> {
  const m = new Map<string, T>();
  const clone = <X>(x: X): X => structuredClone(x);
  const match = (d: T, f?: Partial<T>) => !f || Object.entries(f).every(([k, v]) => (d as Record<string, unknown>)[k] === v);
  return {
    async all(f, sort) {
      const out = [...m.values()].filter((d) => match(d, f)).map(clone);
      if (sort) out.sort((a, b) => (a[sort.by] > b[sort.by] ? 1 : a[sort.by] < b[sort.by] ? -1 : 0) * sort.dir);
      return out;
    },
    async get(id) {
      const d = m.get(id);
      return d ? clone(d) : null;
    },
    async one(f) {
      for (const d of m.values()) if (match(d, f)) return clone(d);
      return null;
    },
    async insert(doc) {
      if (m.has(doc._id)) throw new Error('duplicate id ' + doc._id);
      m.set(doc._id, clone(doc));
      return clone(doc);
    },
    async set(id, patch) {
      const d = m.get(id);
      if (!d) return null;
      const next = { ...d, ...clone(patch) };
      m.set(id, next);
      return clone(next);
    },
    async remove(id) {
      m.delete(id);
    },
    async count() {
      return m.size;
    },
    async clear() {
      m.clear();
    },
  };
}

function memoryStore(): Store {
  const s = Object.fromEntries(COLLECTIONS.map((n) => [n, memColl()])) as unknown as Store;
  s.takeEdition = async (slug) => {
    const e = await s.editions.get(slug);
    if (!e || e.remaining <= 0) return null;
    await s.editions.set(slug, { remaining: e.remaining - 1, next: e.next + 1 });
    return e.next;
  };
  return s;
}

/* ── mongo ──────────────────────────────────────────────────────────── */

function mongoColl<T extends Doc>(db: MongoDb, name: string): Coll<T> {
  const c = db.collection<T>(name);
  const strip = (d: unknown) => d as T;
  return {
    async all(f, sort) {
      const cur = c.find((f ?? {}) as Filter<T>);
      if (sort) cur.sort({ [sort.by]: sort.dir });
      return (await cur.toArray()).map(strip);
    },
    async get(id) {
      return strip(await c.findOne({ _id: id } as Filter<T>));
    },
    async one(f) {
      return strip(await c.findOne(f as Filter<T>));
    },
    async insert(doc) {
      await c.insertOne(doc as never);
      return doc;
    },
    async set(id, patch) {
      const { _id, ...rest } = patch as Document;
      void _id;
      return strip(await c.findOneAndUpdate({ _id: id } as Filter<T>, { $set: rest as Partial<T> }, { returnDocument: 'after' }));
    },
    async remove(id) {
      await c.deleteOne({ _id: id } as Filter<T>);
    },
    async count() {
      return c.countDocuments();
    },
    async clear() {
      await c.deleteMany({});
    },
  };
}

let client: MongoClient | null = null;
async function mongoStore(): Promise<Store> {
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  client ??= new MongoClient(env.MONGODB_URI, { maxPoolSize: process.env.VERCEL ? 5 : 10 });
  await client.connect();
  const db = client.db(env.MONGODB_DB);
  await Promise.all([
    db.collection('bookings').createIndex({ date: 1, time: 1 }),
    db.collection('clients').createIndex({ phone: 1 }, { unique: true }),
    db.collection('orders').createIndex({ clientId: 1 }),
    db.collection('commissions').createIndex({ clientId: 1 }),
    db.collection('otps').createIndex({ expires: 1 }),
    db.collection('messages').createIndex({ createdAt: -1 }),
    db.collection('clients').createIndex({ email: 1 }),
    db.collection('staff').createIndex({ email: 1 }, { unique: true }),
    db.collection('audit').createIndex({ at: -1 }),
    db.collection('outbox').createIndex({ at: -1 }),
    db.collection('pieces').createIndex({ order: 1 }),
  ]);
  const s = Object.fromEntries(COLLECTIONS.map((n) => [n, mongoColl(db, n)])) as unknown as Store;
  s.takeEdition = async (slug) => {
    const r = await db
      .collection<Edition>('editions')
      .findOneAndUpdate({ _id: slug, remaining: { $gt: 0 } }, { $inc: { remaining: -1, next: 1 } }, { returnDocument: 'before' });
    return r ? r.next : null;
  };
  return s;
}

/* ── access ─────────────────────────────────────────────────────────── */

let store: Store | null = null;
let connecting: Promise<Store> | null = null;

export async function connect(): Promise<Store> {
  if (store) return store;
  connecting ??= (env.DATA_SOURCE === 'mongo' ? mongoStore() : Promise.resolve(memoryStore()))
    .then((s) => (store = s))
    .catch((e) => {
      connecting = null;
      throw e;
    });
  return connecting;
}

export function db(): Store {
  if (!store) throw new Error('Database not ready');
  return store;
}

/** Tests: start again from an empty memory store */
export function resetMemory() {
  store = memoryStore();
  connecting = Promise.resolve(store);
  return store;
}
