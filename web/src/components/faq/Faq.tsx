'use client';

import { useMemo, useState } from 'react';
import { FAQ } from '@/lib/faq';
import { Lnk } from '@/components/ui/Lnk';
import { btnInk } from '@/components/ui/Form';

const slug = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function Item({ q, a, open, onToggle }: { q: string; a: string[]; open: boolean; onToggle: () => void }) {
  const id = slug(q);
  return (
    <li className="border-b border-noir/10">
      <h3>
        <button
          type="button"
          id={`q-${id}`}
          aria-expanded={open}
          aria-controls={`a-${id}`}
          onClick={onToggle}
          className="group flex w-full items-start justify-between gap-6 py-6 text-left"
        >
          <span className="font-display text-[20px] leading-snug text-noir transition-colors group-hover:text-antique md:text-[23px]">{q}</span>
          <span className="relative mt-2 h-3.5 w-3.5 shrink-0" aria-hidden>
            <span className="absolute top-1/2 left-0 h-px w-full bg-antique" />
            <span className={`absolute top-0 left-1/2 h-full w-px bg-antique transition-transform duration-500 ${open ? 'scale-y-0' : ''}`} />
          </span>
        </button>
      </h3>
      <div
        id={`a-${id}`}
        role="region"
        aria-labelledby={`q-${id}`}
        className={`grid transition-[grid-template-rows] duration-500 ease-(--ease-luxe) ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="max-w-2xl space-y-3 pb-7 text-[16px] leading-[1.8] text-noir/70">
            {a.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

export function Faq() {
  const [group, setGroup] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(slug(FAQ[0].items[0].q));

  const shown = useMemo(() => {
    const t = query.trim().toLowerCase();
    return FAQ.filter((g) => group === 'all' || g.id === group)
      .map((g) => ({ ...g, items: g.items.filter((i) => !t || (i.q + ' ' + i.a.join(' ')).toLowerCase().includes(t)) }))
      .filter((g) => g.items.length);
  }, [group, query]);

  return (
    <div data-tone="light" className="bg-ivory text-noir">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] md:gap-[6vw] md:px-[6vw] md:py-28">
        <aside className="min-w-0 md:sticky md:top-32 md:self-start">
          <label className="block">
            <span className="text-[10px] tracking-[0.26em] text-stone uppercase">Search the questions</span>
            <span className="relative mt-3 block">
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Deposit, delivery, sizing…"
                className="w-full border-b border-noir/20 bg-transparent pr-8 pb-2.5 text-[16px] outline-none placeholder:text-noir/30 focus:border-antique"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute top-0 right-0 px-1 text-[18px] leading-none text-stone hover:text-noir">
                  ×
                </button>
              )}
            </span>
          </label>
          <div className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:items-start md:gap-1 md:overflow-visible md:px-0" role="tablist" aria-label="Topics">
            {[{ id: 'all', title: 'All questions' }, ...FAQ].map((g) => (
              <button
                key={g.id}
                role="tab"
                aria-selected={group === g.id}
                onClick={() => setGroup(g.id)}
                className={`shrink-0 px-3.5 py-2 text-[12px] tracking-[0.14em] uppercase transition-colors md:px-0 md:py-1.5 md:text-[13px] md:tracking-[0.12em] md:normal-case ${
                  group === g.id ? 'bg-noir text-ivory md:bg-transparent md:text-antique' : 'border border-noir/12 text-noir/60 hover:text-noir md:border-0'
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>
          <div className="mt-12 hidden border-t border-noir/10 pt-8 md:block">
            <p className="font-display text-[22px] leading-snug">Still wondering?</p>
            <p className="mt-2 text-[14px] text-stone">Write to us, or come and see the cloth.</p>
            <div className="mt-5 flex flex-col items-start gap-3">
              <Lnk href="/contact" className="text-[11px] tracking-[0.22em] text-antique uppercase hover:underline">
                Contact the atelier →
              </Lnk>
              <Lnk href="/fittings" className="text-[11px] tracking-[0.22em] text-antique uppercase hover:underline">
                Book a fitting →
              </Lnk>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {shown.length === 0 && (
            <div className="border border-noir/10 px-6 py-14 text-center">
              <p className="font-display text-[26px]">Nothing matches “{query}”.</p>
              <p className="mt-3 text-[15px] text-stone">Try another word, or ask us directly — we answer within a day.</p>
              <Lnk href="/contact" className={`${btnInk} mt-8`}>
                Ask the atelier
              </Lnk>
            </div>
          )}
          {shown.map((g, gi) => (
            <section key={g.id} className={gi ? 'mt-16' : ''} aria-labelledby={`g-${g.id}`}>
              <h2 id={`g-${g.id}`} className="text-[10px] tracking-[0.3em] text-antique uppercase">
                {g.title}
              </h2>
              <ul className="mt-2 border-t border-noir/10">
                {g.items.map((i) => {
                  const k = slug(i.q);
                  return <Item key={k} q={i.q} a={i.a} open={open === k || !!query.trim()} onToggle={() => setOpen((o) => (o === k ? null : k))} />;
                })}
              </ul>
            </section>
          ))}
          <div className="mt-16 border-t border-noir/10 pt-10 md:hidden">
            <p className="font-display text-[24px] leading-snug">Still wondering?</p>
            <p className="mt-2 text-[15px] text-stone">Write to us, or come and see the cloth.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Lnk href="/contact" className={btnInk}>
                Contact us
              </Lnk>
              <Lnk href="/fittings" className="border border-noir/30 px-6 py-4 text-[11px] tracking-[0.24em] uppercase">
                Book a fitting
              </Lnk>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
