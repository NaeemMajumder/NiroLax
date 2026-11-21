'use client';

import { useMemo, useState } from 'react';
import { kinds, type Kind } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { PieceCard } from '@/components/ui/PieceCard';

type Filter = 'All' | Kind;
type Sort = 'season' | 'price-asc' | 'price-desc' | 'rarest';

export function SeasonGrid() {
  const pieces = usePieces();
  const [filter, setFilter] = useState<Filter>('All');
  const [sort, setSort] = useState<Sort>('season');

  const list = useMemo(() => {
    const l = pieces.filter((p) => filter === 'All' || p.kind === filter);
    if (sort === 'price-asc') return [...l].sort((a, b) => a.rtw - b.rtw);
    if (sort === 'price-desc') return [...l].sort((a, b) => b.rtw - a.rtw);
    if (sort === 'rarest') return [...l].sort((a, b) => a.remaining - b.remaining);
    return l;
  }, [pieces, filter, sort]);

  return (
    <section className="bg-noir pb-28 md:pb-40">
      <div className="mx-auto max-w-[1440px] px-5 md:px-[6vw]">
        <div className="flex flex-wrap items-center justify-between gap-6 border-y border-ivory/10 py-5">
          <div className="-mx-1 flex flex-wrap gap-1" role="tablist" aria-label="Filter the season">
            {(['All', ...kinds] as Filter[]).map((f) => {
              const n = f === 'All' ? pieces.length : pieces.filter((p) => p.kind === f).length;
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                    filter === f ? 'bg-ivory text-noir' : 'text-bone/60 hover:text-ivory'
                  }`}
                >
                  {f} <span className="opacity-75">{n}</span>
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-bone/60 uppercase">
            Order
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border-b border-ivory/20 bg-transparent py-1.5 text-[13px] tracking-normal text-ivory normal-case outline-none focus:border-gold [&>option]:bg-noir"
            >
              <option value="season">As shown in the season</option>
              <option value="rarest">Fewest remaining</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
            </select>
          </label>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-20">
          {list.map((p, i) => (
            <li key={p.slug} className={`animate-[invite_0.9s_var(--ease-luxe)_both] ${i % 3 === 1 ? 'lg:translate-y-16' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
              <PieceCard piece={p} priority={i < 3} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
