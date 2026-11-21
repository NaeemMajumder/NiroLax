import { db } from '../db.js';
import { DEFAULT_DEPOSIT, DEFAULT_HOURS } from '../catalogue.js';
import type { Settings } from '../types.js';

export const DEFAULT_SETTINGS: Settings = {
  _id: 'site',
  atelier: {
    name: 'Nirolax',
    address1: 'House 21, Road 113',
    address2: 'Gulshan 2, Dhaka 1212',
    phone: '+880 1711-000000',
    whatsapp: '8801711000000',
    email: 'atelier@nirolax.com',
  },
  // Demo handles: change them in Console → Settings
  social: {
    instagram: 'https://www.instagram.com/nirolax.atelier',
    facebook: 'https://www.facebook.com/nirolax.atelier',
    youtube: 'https://www.youtube.com/@nirolax.atelier',
    pinterest: 'https://www.pinterest.com/nirolax_atelier',
  },
  hours: DEFAULT_HOURS,
  closedWeekdays: [5],
  closedDates: [],
  deposit: DEFAULT_DEPOSIT,
  bookingDaysAhead: 60,
  notify: { phone: '01711000000', email: 'atelier@nirolax.com', onOrder: true, onBooking: true, onMessage: true },
  updatedAt: 0,
};

/** Site settings, cached for a few seconds (they change rarely, and every booking reads them) */
let cache: { at: number; s: Settings } | null = null;
export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < 5000) return cache.s;
  const s = (await db().settings.get('site')) ?? DEFAULT_SETTINGS;
  const merged = { ...DEFAULT_SETTINGS, ...s, atelier: { ...DEFAULT_SETTINGS.atelier, ...s.atelier }, social: { ...DEFAULT_SETTINGS.social, ...s.social }, notify: { ...DEFAULT_SETTINGS.notify, ...s.notify } };
  cache = { at: Date.now(), s: merged };
  return merged;
}
export const forgetSettings = () => (cache = null);

/** What the website may read */
export const publicSettings = (s: Settings) => ({ atelier: s.atelier, social: s.social, hours: s.hours, closedWeekdays: s.closedWeekdays, closedDates: s.closedDates, deposit: s.deposit, bookingDaysAhead: s.bookingDaysAhead });

/** Is the atelier open on this Dhaka date? */
export const openOn = (s: Settings, date: string) => !s.closedWeekdays.includes(new Date(date + 'T12:00:00Z').getUTCDay()) && !s.closedDates.includes(date);
