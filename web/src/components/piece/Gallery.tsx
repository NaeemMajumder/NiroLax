'use client';

import { useRef, useState } from 'react';
import { asset } from '@/lib/asset';
import { pieceImage, sheenFor, type Piece } from '@/lib/pieces';

import { LazySilk as Silk } from '@/components/gl/LazySilk';

const VIEWS = [
  ['front', 'Front'],
  ['left', 'Profile'],
  ['back', 'Back'],
  ['right', 'Profile'],
] as const;

/** Photographs of the piece — stacked on desktop, swiped on phones. Live cloth until photos exist. */
export function Gallery({ piece }: { piece: Piece }) {
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const views = VIEWS.filter(([v]) => pieceImage(piece, v));

  if (!views.length) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:h-[calc(100svh-7rem)]">
        <Silk className="absolute inset-0" color={piece.tint} sheen={sheenFor(piece.tint)} gloss={30} scale={1.8} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20">
          <p className="text-[10px] tracking-[0.26em] text-champagne uppercase">The cloth</p>
          <p className="mt-1 font-display text-[22px] text-ivory">{piece.cloth}</p>
          <p className="mt-2 text-[12px] text-bone/60">Photography of this piece is in preparation.</p>
        </div>
      </div>
    );
  }

  const onScroll = () => {
    const el = strip.current;
    if (el) setAt(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      <div
        ref={strip}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:flex-col md:gap-3 md:overflow-visible"
      >
        {views.map(([v, label], i) => (
          <figure key={v} className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-[#e6e4df]" data-reveal={i > 0 ? 'image' : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pieceImage(piece, v)!}
              alt={`${piece.name} — ${label.toLowerCase()} view`}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <figcaption className="absolute bottom-4 left-5 text-[10px] tracking-[0.26em] text-noir/60 uppercase">
              {String(i + 1).padStart(2, '0')} — {label}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2 md:hidden" aria-hidden>
        {VIEWS.map(([v], i) => (
          <span key={v} className={`h-px w-8 transition-colors duration-500 ${at === i ? 'bg-gold' : 'bg-ivory/20'}`} />
        ))}
      </div>
    </div>
  );
}
