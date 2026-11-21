import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';

export type Section = { id?: string; h: string; p: ReactNode[] };

/** Plain reading pages — care, delivery, privacy, terms. */
export function Prose({ kicker, title, dek, sections, updated }: { kicker: string; title: ReactNode; dek?: string; sections: Section[]; updated?: string }) {
  return (
    <>
      <PageHeader kicker={kicker} title={title} dek={dek} />
      <div data-tone="light" className="bg-ivory text-noir">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 md:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] md:gap-[6vw] md:px-[6vw] md:py-28">
          <nav className="md:sticky md:top-32 md:self-start" aria-label="On this page">
            <p className="text-[10px] tracking-[0.26em] text-stone uppercase">On this page</p>
            <ul className="mt-4 space-y-2.5">
              {sections.map((s) => (
                <li key={s.h}>
                  <a href={`#${s.id ?? s.h.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="text-[15px] text-noir/70 hover:text-antique">
                    {s.h}
                  </a>
                </li>
              ))}
            </ul>
            {updated && <p className="mt-8 text-[12px] text-stone">Last updated {updated}</p>}
          </nav>
          <div className="min-w-0 max-w-2xl">
            {sections.map((s, i) => (
              <section key={s.h} id={s.id ?? s.h.toLowerCase().replace(/[^a-z]+/g, '-')} className={`scroll-mt-32 ${i ? 'mt-16 border-t border-noir/10 pt-12' : ''}`}>
                <h2 className="font-display text-[30px] leading-tight">{s.h}</h2>
                <div className="mt-5 space-y-4 text-[16px] leading-[1.8] text-noir/75">
                  {s.p.map((x, j) => (typeof x === 'string' || (x as { type?: unknown })?.type === undefined ? <p key={j}>{x}</p> : <div key={j}>{x}</div>))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
