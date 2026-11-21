import { bdt, pieceImage, type Piece } from '@/lib/pieces';
import { Lnk } from './Lnk';
import { Swatch } from './Swatch';

/** A piece in a grid: photograph (front, back on hover) or a cloth swatch, then name and price. */
export function PieceCard({ piece, priority = false }: { piece: Piece; priority?: boolean }) {
  const low = piece.remaining <= 5;
  const front = pieceImage(piece, 'front');
  const back = pieceImage(piece, 'back') ?? front;
  return (
    <Lnk href={`/pieces/${piece.slug}`} data-cursor="View" className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-graphite">
        {front ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={front}
              alt={piece.name}
              loading={priority ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-(--ease-luxe) group-hover:scale-[1.03] group-hover:opacity-0"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={back!}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-0 transition-[opacity,transform] duration-[1200ms] ease-(--ease-luxe) group-hover:scale-100 group-hover:opacity-100"
            />
          </>
        ) : (
          <Swatch tint={piece.tint} no={piece.no} className="absolute inset-0 transition-transform duration-[1200ms] ease-(--ease-luxe) group-hover:scale-[1.03]" />
        )}
        <div className="absolute top-4 right-4 left-4 flex items-start justify-between text-[10px] tracking-[0.22em] uppercase">
          <span className={front ? 'text-noir/60' : 'text-bone/60'}>{piece.kind}</span>
          <span className={low ? 'text-gold' : front ? 'text-noir/60' : 'text-bone/60'}>
            {low ? `Last ${piece.remaining}` : `${piece.remaining} / ${piece.edition}`}
          </span>
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[22px] leading-tight text-ivory transition-colors duration-500 group-hover:text-champagne md:text-[24px]">
            {piece.name}
          </p>
          <p className="mt-1.5 text-[13px] text-bone/60">{piece.cloth}</p>
        </div>
        <p className="shrink-0 pt-1 text-[13px] whitespace-nowrap text-champagne">{bdt(piece.rtw)}</p>
      </div>
    </Lnk>
  );
}
