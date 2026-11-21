'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { asset } from '@/lib/asset';
import { bdt, hasPhotos, pieceImage, sheenFor } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { Lnk } from '@/components/ui/Lnk';

import { LazySilk as Silk } from '@/components/gl/LazySilk';

export function Collection() {
  const pieces = usePieces();
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // The card keeps showing the last piece while it fades out, instead of jumping back to the first
  const [shown, setShown] = useState(0);
  const current = pieces[shown];
  const enter = (i: number) => {
    setHover(i);
    setShown(i);
  };

  // Preview card follows the cursor (desktop only)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const card = preview.current!;
    const list = root.current!.querySelector('ul')!;
    const x = gsap.quickTo(card, 'x', { duration: 0.8, ease: 'power3' });
    const y = gsap.quickTo(card, 'y', { duration: 0.8, ease: 'power3' });
    const r = gsap.quickTo(card, 'rotation', { duration: 0.8, ease: 'power3' });
    let last = 0;
    let px = -1;
    let py = -1;

    /** What is under the pointer right now? Keeps the card in step even when the page scrolls under a still mouse. */
    const sync = () => {
      if (px < 0) return;
      const under = document.elementFromPoint(px, py);
      const row = under?.closest<HTMLElement>('[data-row]');
      if (row && list.contains(row)) enter(Number(row.dataset.row));
      else setHover(null);
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      x(px + 36);
      y(py - 200);
      r(gsap.utils.clamp(-6, 6, (px - last) * 0.4));
      last = px;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', sync, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', sync);
    };
  }, []);

  return (
    <section ref={root} id="season-index" className="relative bg-noir">
      <div className="mx-auto max-w-[1440px] px-5 pt-28 pb-28 md:px-[6vw] md:pt-44 md:pb-44">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <div>
            <p data-reveal="fade" className="kicker">
              Season I
            </p>
            <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(44px,6vw,96px)] leading-[0.98] text-ivory">
              Ten pieces. <em className="text-champagne">Numbered.</em>
            </h2>
          </div>
          <p data-reveal="fade" className="max-w-md text-[15px] leading-relaxed text-bone/60 md:justify-self-end md:text-[16px]">
            Every piece is made in a fixed edition. When an edition closes, the pattern is retired and the piece is
            not made again.
          </p>
        </div>

        <ul className="mt-20 border-t border-ivory/10 md:mt-28" onMouseLeave={() => setHover(null)}>
          {pieces.map((p, i) => {
            const low = p.remaining <= 5;
            return (
              <li key={p.slug} data-reveal="fade" data-delay={(i % 5) * 0.04}>
                <Lnk
                  href={`/pieces/${p.slug}`}
                  data-cursor="View"
                  data-row={i}
                  onMouseEnter={() => enter(i)}
                  className={`group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-ivory/10 py-6 transition-opacity duration-700 ease-(--ease-luxe) md:grid-cols-[4rem_minmax(0,2.8fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_7rem_9rem] md:gap-x-6 md:py-8 ${
                    hover !== null && hover !== i ? 'md:opacity-40' : 'opacity-100'
                  }`}
                >
                  <span className="font-display text-[15px] text-gold/80 italic">{p.no}</span>
                  <span className="flex items-center gap-4">
                    <span
                      className="h-10 w-8 shrink-0 md:hidden"
                      style={{ background: `linear-gradient(135deg, ${p.tint}, ${sheenFor(p.tint)}55 55%, ${p.tint})` }}
                      aria-hidden
                    />
                    <span className="font-display text-[20px] leading-tight text-ivory transition-transform duration-700 ease-(--ease-luxe) md:text-[clamp(24px,2.2vw,36px)] md:group-hover:translate-x-4">
                      {p.name}
                    </span>
                  </span>
                  <span className="hidden text-[12px] tracking-[0.18em] text-bone/60 uppercase md:block">{p.kind}</span>
                  <span className="hidden text-[14px] text-bone/60 md:block">{p.cloth}</span>
                  <span className={`hidden text-[12px] tracking-[0.1em] md:block ${low ? 'text-gold' : 'text-bone/60'}`}>
                    {low ? `Last ${p.remaining}` : `${p.remaining} / ${p.edition}`}
                  </span>
                  <span className="text-right text-[14px] whitespace-nowrap text-champagne md:text-[15px]">
                    <span className="block text-[10px] tracking-[0.2em] text-bone/60 uppercase md:hidden">From</span>
                    {bdt(p.rtw)}
                  </span>
                </Lnk>
              </li>
            );
          })}
        </ul>
        <div data-reveal="fade" className="mt-14 flex justify-center">
          <Lnk href="/season" className="group text-[11px] tracking-[0.26em] text-ivory uppercase">
            See the whole season
            <span className="mt-2 block h-px w-full origin-left bg-gold/70 transition-transform duration-700 ease-(--ease-luxe) group-hover:scale-x-50" />
          </Lnk>
        </div>
      </div>

      {/* Floating preview */}
      <div
        ref={preview}
        className={`pointer-events-none fixed top-0 left-0 z-40 hidden h-[340px] w-[260px] overflow-hidden transition-[opacity,clip-path] duration-700 ease-(--ease-luxe) md:block ${
          hover !== null ? 'opacity-100 [clip-path:inset(0_0_0_0)]' : 'opacity-0 [clip-path:inset(12%_0_12%_0)]'
        }`}
        aria-hidden
      >
        <Silk className="absolute inset-0" color={current.tint} sheen={sheenFor(current.tint)} gloss={30} scale={1.5} interactive={false} alwaysOn />
        {/* Photos stay mounted and cross-fade, so nothing pops in or out */}
        {pieces
          .filter((p) => hasPhotos(p))
          .map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.slug}
              src={pieceImage(p, 'front')!}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${current.slug === p.slug ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <p className="text-[10px] tracking-[0.24em] text-champagne uppercase">{hasPhotos(current) ? 'Nº ' + current.no : 'The cloth'}</p>
          <p className="mt-1 font-display text-[16px] text-ivory">{hasPhotos(current) ? current.name : current.cloth}</p>
        </div>
      </div>
    </section>
  );
}
