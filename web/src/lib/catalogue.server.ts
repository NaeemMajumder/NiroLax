import { SEED_PIECES, type Piece } from './pieces';

/** The published season from the API (revalidated every 30 s), or the built-in seed */
export async function getCatalogue(fresh = false): Promise<Piece[]> {
  const api = process.env.API_URL?.replace(/\/+$/, '');
  if (!api || process.env.NEXT_PUBLIC_EXPORT === '1') return SEED_PIECES;
  try {
    // `fresh` uses its own cache entry that expires after a second (a no-store fetch would turn the page dynamic)
    const r = await fetch(`${api}/api/v1/catalogue/pieces${fresh ? '?fresh=1' : ''}`, { next: { revalidate: fresh ? 1 : 30, tags: ['catalogue'] }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return SEED_PIECES;
    const j = (await r.json()) as { pieces: Piece[] };
    return j.pieces?.length ? j.pieces.map((p) => ({ ...p, remaining: p.remaining ?? 0 })) : SEED_PIECES;
  } catch {
    return SEED_PIECES;
  }
}

export type PublicSettings = { atelier: { name: string; address1: string; address2: string; phone: string; whatsapp: string; email: string }; social: { instagram: string; facebook: string; youtube: string; pinterest: string }; hours: string[]; closedWeekdays: number[]; closedDates: string[]; deposit: number };
export const DEFAULT_PUBLIC: PublicSettings = {
  atelier: { name: 'Nirolax', address1: 'House 21, Road 113', address2: 'Gulshan 2, Dhaka 1212', phone: '+880 1711-000000', whatsapp: '8801711000000', email: 'atelier@nirolax.com' },
  social: {
    instagram: 'https://www.instagram.com/nirolax.atelier',
    facebook: 'https://www.facebook.com/nirolax.atelier',
    youtube: 'https://www.youtube.com/@nirolax.atelier',
    pinterest: 'https://www.pinterest.com/nirolax_atelier',
  },
  hours: ['11:00', '13:00', '15:00', '17:00', '19:00'],
  closedWeekdays: [5],
  closedDates: [],
  deposit: 10000,
};
export async function getPublicSettings(): Promise<PublicSettings> {
  const api = process.env.API_URL?.replace(/\/+$/, '');
  if (!api || process.env.NEXT_PUBLIC_EXPORT === '1') return DEFAULT_PUBLIC;
  try {
    const r = await fetch(`${api}/api/v1/settings`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return DEFAULT_PUBLIC;
    const j = (await r.json()) as PublicSettings;
    return { ...DEFAULT_PUBLIC, ...j, social: { ...DEFAULT_PUBLIC.social, ...j.social } };
  } catch {
    return DEFAULT_PUBLIC;
  }
}
