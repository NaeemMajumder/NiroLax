/** Documents as stored. Shapes match the web app's store (web/src/lib/store.ts). */
export type Customer = { name: string; phone: string; email: string; address: string; area: string; city: string };
export type OrderStatus = 'awaiting-payment' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type PayMethod = 'card' | 'bkash' | 'cod';
export type Step = { at: number; by: string; text: string };

export type Edition = { _id: string; remaining: number; next: number };

export type Kind = 'Tailoring' | 'Evening' | 'Ceremony';
export type PieceView = 'front' | 'left' | 'back' | 'right';
export type Piece = {
  _id: string; // the slug
  slug: string;
  no: string;
  name: string;
  kind: Kind;
  cloth: string;
  tint: string;
  rtw: number;
  mtm: number;
  edition: number;
  sizes: string[];
  soldOut: string[];
  line: string;
  story: string;
  details: { title: string; body: string }[];
  composition: string;
  care: string;
  /** Folder in the web app's /public/pieces (the built-in photographs) */
  photos?: string;
  /** Uploaded photographs (Cloudinary URLs), by view */
  images?: Partial<Record<PieceView, string>>;
  published: boolean;
  order: number;
  updatedAt: number;
};

export type Order = {
  _id: string;
  createdAt: number;
  items: { slug: string; name: string; size: string; price: number; editionNo: number }[];
  customer: Customer;
  delivery: 'dhaka' | 'outside' | 'collect';
  deliveryFee: number;
  payment: PayMethod;
  paid: boolean;
  total: number;
  status: OrderStatus;
  clientId?: string;
  paymentRef?: string;
  timeline?: Step[];
  notes?: Step[];
  courier?: { name: 'Steadfast' | 'Pathao' | 'RedX' | 'Atelier'; tracking: string; bookedAt: number };
  refund?: { amount: number; at: number; method: string; reason: string };
};
export type Booking = {
  _id: string;
  createdAt: number;
  date: string;
  time: string;
  purpose: 'new-piece' | 'fitting' | 'alteration' | 'consultation';
  pieceSlug?: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  deposit: number;
  depositMethod?: 'card' | 'bkash' | 'cash';
  status: 'awaiting-deposit' | 'confirmed' | 'attended' | 'cancelled';
  clientId?: string;
  paymentRef?: string;
  source?: 'web' | 'atelier';
  history?: Step[];
};
export type Client = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  since: number;
  measures: Record<string, number | undefined>;
  notes: string;
  measuredBy?: string;
  measuredAt?: number;
  /** Account (set when the client registers) */
  passwordHash?: string;
  verified?: boolean;
  tokenVersion?: number;
  failedLogins?: number;
  lockedUntil?: number;
  saved?: string[];
  address?: { address: string; area: string; city: string };
};
export type Commission = {
  _id: string;
  clientId: string;
  pieceSlug: string;
  editionNo: number;
  price: number;
  stage: number;
  stageDates: (number | null)[];
  photos: Record<string, string>;
  readyBy: string;
  notes: string;
};
export type OtpPurpose = 'signin' | 'register' | 'reset';
export type Otp = { _id: string; hash: string; expires: number; tries: number; sentAt: number; purpose?: OtpPurpose; payload?: Record<string, string> };
export type Message = {
  _id: string;
  createdAt: number;
  name: string;
  phone: string;
  email: string;
  topic: 'appointment' | 'order' | 'made-to-measure' | 'press' | 'other';
  message: string;
  read: boolean;
};
export type Subscriber = { _id: string; createdAt: number };

export type Role = 'owner' | 'manager' | 'tailor' | 'orders' | 'content';
export type Staff = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  tokenVersion: number;
  failedLogins: number;
  lockedUntil?: number;
  lastLoginAt?: number;
  createdAt: number;
};
export type AuditEntry = { _id: string; at: number; staffId: string; staffName: string; action: string; target: string; before?: unknown; after?: unknown };
export type Social = { instagram: string; facebook: string; youtube: string; pinterest: string };
export type Settings = {
  _id: 'site';
  atelier: { name: string; address1: string; address2: string; phone: string; whatsapp: string; email: string };
  /** Full profile URLs; an empty string hides that link */
  social: Social;
  hours: string[];
  /** 0 = Sunday … 6 = Saturday */
  closedWeekdays: number[];
  closedDates: string[];
  deposit: number;
  bookingDaysAhead: number;
  notify: { phone: string; email: string; onOrder: boolean; onBooking: boolean; onMessage: boolean };
  updatedAt: number;
};
export type OutboxEntry = { _id: string; at: number; channel: 'sms' | 'email'; to: string; subject?: string; body: string; status: 'sent' | 'logged' | 'failed'; kind: string };

export type Collections = {
  editions: Edition;
  pieces: Piece;
  orders: Order;
  bookings: Booking;
  clients: Client;
  commissions: Commission;
  otps: Otp;
  messages: Message;
  subscribers: Subscriber;
  staff: Staff;
  audit: AuditEntry;
  settings: Settings;
  outbox: OutboxEntry;
};
export const COLLECTIONS: (keyof Collections)[] = ['editions', 'pieces', 'orders', 'bookings', 'clients', 'commissions', 'otps', 'messages', 'subscribers', 'staff', 'audit', 'settings', 'outbox'];
