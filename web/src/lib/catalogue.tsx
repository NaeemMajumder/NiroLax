'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setPieces, type Piece } from './pieces';
import { API_MODE } from './store';

export type Site = { atelier: { name: string; address1: string; address2: string; phone: string; whatsapp: string; email: string }; social: { instagram: string; facebook: string; youtube: string; pinterest: string }; hours: string[]; closedWeekdays: number[]; closedDates: string[]; deposit: number };
const SiteCtx = createContext<Site | null>(null);
/** Atelier details from Settings (address, phone, WhatsApp, hours, deposit) */
export function useSite(): Site {
  const v = useContext(SiteCtx);
  if (!v) throw new Error('useSite outside CatalogueProvider');
  return v;
}

const Ctx = createContext<Piece[] | null>(null);
let latest: ((p: Piece[]) => void) | null = null;
/** After an edit in the console, show the new catalogue at once */
export const refreshCatalogue = async () => {
  if (!API_MODE) return;
  const r = await fetch('/api/v1/catalogue/pieces', { cache: 'no-store' }).catch(() => null);
  const j = r?.ok ? ((await r.json()) as { pieces: Piece[] }) : null;
  if (j?.pieces?.length) latest?.(j.pieces);
};

/** The season, rendered on the server from the API (or the built-in seed), refreshed in the browser */
export function CatalogueProvider({ pieces, site, children }: { pieces: Piece[]; site: Site; children: React.ReactNode }) {
  const [list, setList] = useState(pieces);
  setPieces(list);
  useEffect(() => {
    latest = setList;
    refreshCatalogue();
    return () => {
      latest = null;
    };
  }, []);
  const value = useMemo(() => list, [list]);
  return (
    <SiteCtx.Provider value={site}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </SiteCtx.Provider>
  );
}

export function usePieces(): Piece[] {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePieces outside CatalogueProvider');
  return v;
}
export const usePiece = (slug: string) => usePieces().find((p) => p.slug === slug);
