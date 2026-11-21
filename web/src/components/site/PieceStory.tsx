'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { asset } from '@/lib/asset';
import { Lnk } from '@/components/ui/Lnk';
import { bdt } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';

gsap.registerPlugin(ScrollTrigger);


const chapters = [
  {
    view: 'front',
    label: 'Front',
    title: 'The silhouette',
    body: 'One button, set a little high. Peak lapels faced in black silk satin, rolled by hand so they curve across the chest instead of lying flat.',
    notes: ['Silk satin peak lapels', 'Jetted pockets, no flaps', 'Covered horn button'],
  },
  {
    view: 'left',
    label: 'Profile',
    title: 'The line',
    body: 'A high armhole and a close waist give one unbroken line from shoulder to hem. You can raise your arm and the collar stays where it is.',
    notes: ['High, small armholes', 'Natural shoulder, light padding', 'Trousers with a satin side stripe'],
  },
  {
    view: 'back',
    label: 'Back',
    title: 'The back',
    body: 'Shaped through the shoulder blades and left without a vent, the way evening coats were cut, so it falls clean when you stand and when you sit.',
    notes: ['Ventless, clean back', 'Hand-set collar', 'Full Bemberg lining'],
  },
  {
    view: 'right',
    label: 'Profile',
    title: 'The finish',
    body: 'A floating canvas, pick-stitched edges and working cuffs. Forty-two hours at the table before it is pressed, numbered and boxed.',
    notes: ['Half-canvas, hand-padded', 'Working cuff buttons', 'Numbered inside the breast pocket'],
  },
] as const;

const sizes = ['46', '48', '50', '52', '54'];
const soldOut = new Set(['46']);

export function PieceStory() {
  const pieces = usePieces();
  const piece = pieces[0];
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [mode, setMode] = useState<'rtw' | 'mtm'>('mtm');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-chapter]').forEach((ch, i) => {
        ScrollTrigger.create({
          trigger: ch,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(i),
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="piece" data-tone="light" className="relative bg-ivory text-noir">
      {/* Section opener */}
      <div className="mx-auto max-w-[1440px] px-5 pt-28 md:px-[6vw] md:pt-40">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-noir/10 pb-10">
          <div>
            <p data-reveal="fade" className="kicker text-antique!">
              Piece Nº {piece.no} · Edition of {piece.edition}
            </p>
            <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(44px,6vw,96px)] leading-[0.98]">
              The Midnight <em className="text-antique">Tuxedo</em>
            </h2>
          </div>
          <p data-reveal="fade" className="max-w-xs text-[14px] leading-relaxed text-stone">
            {piece.cloth}. Shown with the dress shirt and a hand-tied silk bow tie.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] px-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-[6vw] md:px-[6vw]">
        {/* Sticky stage — desktop */}
        <div className="hidden md:block">
          <div className="sticky top-0 flex h-svh items-center py-24">
            <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#fbf8f2_0%,#ece5d8_62%,#e2d9c9_100%)]">
              <div className="absolute bottom-[7%] left-1/2 h-5 w-[42%] -translate-x-1/2 rounded-[50%] bg-noir/25 blur-xl" />
              {chapters.map((c, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={c.view}
                  src={asset(`pieces/midnight-tuxedo/${c.view}-cut.webp`)}
                  alt={`The Midnight Tuxedo — ${c.label.toLowerCase()} view`}
                  className="absolute bottom-[7%] left-1/2 h-[84%] w-auto max-w-none -translate-x-1/2 transition-[opacity,filter,transform] duration-[1200ms] ease-(--ease-luxe)"
                  style={{
                    opacity: active === i ? 1 : 0,
                    filter: active === i ? 'blur(0px)' : 'blur(10px)',
                    transform: `translateX(-50%) scale(${active === i ? 1 : 1.03})`,
                  }}
                />
              ))}
              <div className="absolute top-6 left-6 flex items-center gap-3 text-[10px] tracking-[0.3em] text-stone uppercase">
                <span className="text-antique">{String(active + 1).padStart(2, '0')}</span>
                <span className="block h-px w-10 bg-noir/20">
                  <span className="block h-full bg-antique transition-[width] duration-700" style={{ width: `${((active + 1) / chapters.length) * 100}%` }} />
                </span>
                <span>{chapters[active].label}</span>
              </div>
              <p className="absolute right-6 bottom-6 font-display text-[13px] text-stone italic">Nº 07 / 35</p>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div>
          {chapters.map((c, i) => (
            <article key={c.title} data-chapter className="flex flex-col justify-center py-16 md:min-h-svh md:py-24">
              {/* Mobile image */}
              <div className="relative mb-10 aspect-[4/5] overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#fbf8f2_0%,#ece5d8_62%,#e2d9c9_100%)] md:hidden" data-reveal="image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(`pieces/midnight-tuxedo/${c.view}-cut.webp`)} alt="" className="absolute bottom-[5%] left-1/2 h-[88%] w-auto max-w-none -translate-x-1/2" />
              </div>

              <p data-reveal="fade" className="kicker text-antique!">
                {String(i + 1).padStart(2, '0')} — {c.label}
              </p>
              <h3 data-reveal="lines" className="mt-5 font-display text-[clamp(36px,3.6vw,56px)] leading-[1.04]">
                {c.title}
              </h3>
              <p data-reveal="fade" className="mt-6 max-w-[34rem] text-[16px] leading-[1.75] text-stone md:text-[17px]">
                {c.body}
              </p>
              <ul data-reveal="fade" className="mt-9 max-w-[30rem] divide-y divide-noir/10 border-y border-noir/10">
                {c.notes.map((n) => (
                  <li key={n} className="flex items-center gap-4 py-3.5 text-[14px] text-noir/80">
                    <span className="h-1 w-1 rotate-45 bg-antique" />
                    {n}
                  </li>
                ))}
              </ul>

              {i === chapters.length - 1 && (
                <div data-reveal="fade" className="mt-14 max-w-[30rem]">
                  {/* Purchase path */}
                  <div className="grid grid-cols-2 border border-noir/15 p-1" role="tablist" aria-label="How you would like it">
                    {(
                      [
                        ['mtm', 'Made to measure'],
                        ['rtw', 'Ready to wear'],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        role="tab"
                        aria-selected={mode === k}
                        onClick={() => setMode(k)}
                        className={`py-3.5 text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                          mode === k ? 'bg-noir text-ivory' : 'text-noir/60 hover:text-noir'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-7 flex items-baseline justify-between">
                    <p className="font-display text-[34px]">{bdt(mode === 'mtm' ? piece.mtm : piece.rtw)}</p>
                    <p className="text-[12px] tracking-[0.12em] text-stone">
                      <span className="text-antique">{piece.remaining}</span> of {piece.edition} remain
                    </p>
                  </div>

                  {mode === 'rtw' ? (
                    <>
                      <p className="mt-7 text-[11px] tracking-[0.22em] text-stone uppercase">Jacket size</p>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {sizes.map((s) => {
                          const out = soldOut.has(s);
                          return (
                            <button
                              key={s}
                              disabled={out}
                              onClick={() => setSize(s)}
                              aria-pressed={size === s}
                              className={`relative py-3.5 text-[14px] transition-colors duration-300 ${
                                out
                                  ? 'cursor-not-allowed text-noir/25 line-through'
                                  : size === s
                                    ? 'bg-noir text-ivory'
                                    : 'border border-noir/15 hover:border-noir'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      <button className="mt-6 w-full bg-noir py-[18px] text-[11px] tracking-[0.26em] text-ivory uppercase transition-colors duration-500 hover:bg-antique disabled:opacity-40" disabled={!size}>
                        {size ? `Reserve size ${size}` : 'Choose a size'}
                      </button>
                      <p className="mt-3 text-[12px] text-stone">Held for 24 hours. Delivered in Dhaka within three days.</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-6 text-[14px] leading-relaxed text-stone">
                        Three fittings at the atelier. Ready four to five weeks after the first, and followed stage by
                        stage in your client portal.
                      </p>
                      <a href="#appointment" className="mt-6 block w-full bg-noir py-[18px] text-center text-[11px] tracking-[0.26em] text-ivory uppercase transition-colors duration-500 hover:bg-antique">
                        Book the first fitting
                      </a>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
