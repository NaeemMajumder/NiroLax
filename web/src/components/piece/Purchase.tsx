'use client';

import { useState } from 'react';
import { bdt, type Piece } from '@/lib/pieces';
import { Lnk } from '@/components/ui/Lnk';
import { addToCart, openCart, useDB } from '@/lib/store';
import { notify } from '@/lib/toast';
import { toggleSaved } from '@/lib/actions';
import { useSite } from '@/lib/catalogue';
import { href } from '@/components/ui/Lnk';

/** The buying column: path, price, size, action — and the small print, folded away. */
export function Purchase({ piece }: { piece: Piece }) {
  const site = useSite();
  const [mode, setMode] = useState<'mtm' | 'rtw'>('mtm');
  const [size, setSize] = useState<string | null>(null);
  const remaining = useDB((d) => d.remaining[piece.slug] ?? piece.remaining);
  const cart = useDB((d) => d.cart);
  const held = !!size && cart.some((c) => c.slug === piece.slug && c.size === size);
  const sold = new Set(piece.soldOut ?? []);
  const taken = piece.edition - remaining;

  return (
    <div>
      <p className="kicker">
        Piece Nº {piece.no} · {piece.kind}
      </p>
      <h1 className="mt-4 font-display text-[clamp(38px,3.6vw,58px)] leading-[1.02] text-ivory">{piece.name}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-bone/65">{piece.line}</p>

      {/* Edition */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between text-[12px] tracking-[0.12em] text-bone/60">
          <span className="uppercase">Edition of {piece.edition}</span>
          <span>
            <span className={remaining <= 5 ? 'text-gold' : 'text-champagne'}>{remaining}</span> remain
          </span>
        </div>
        <div className="mt-3 flex gap-[3px]" role="img" aria-label={`${taken} of ${piece.edition} made`}>
          {Array.from({ length: piece.edition }, (_, i) => (
            <span key={i} className={`h-2 flex-1 ${i < taken ? 'bg-ivory/15' : 'bg-gold/70'}`} />
          ))}
        </div>
      </div>

      {/* Path */}
      <div className="mt-9 grid grid-cols-2 border border-ivory/15 p-1" role="tablist" aria-label="How you would like it">
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
              mode === k ? 'bg-ivory text-noir' : 'text-bone/60 hover:text-ivory'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-7 font-display text-[34px] text-champagne">{bdt(mode === 'mtm' ? piece.mtm : piece.rtw)}</p>

      {mode === 'rtw' ? (
        <>
          <div className="mt-6 flex items-baseline justify-between">
            <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">Size</p>
            <Lnk href="/delivery#sizing" className="text-[12px] text-bone/60 underline-offset-4 hover:text-gold hover:underline">
              Size guide
            </Lnk>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {piece.sizes.map((s) => {
              const out = sold.has(s);
              return (
                <button
                  key={s}
                  disabled={out}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`py-3.5 text-[14px] transition-colors duration-300 ${
                    out ? 'cursor-not-allowed text-ivory/20 line-through' : size === s ? 'bg-ivory text-noir' : 'border border-ivory/15 text-ivory hover:border-ivory/60'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <button
            disabled={!size || remaining === 0}
            onClick={() => {
              if (!size) return;
              if (held) return openCart(true);
              addToCart(piece.slug, size, piece.rtw);
              notify.ok(`Size ${size} is held for you`, 'Reserved for 24 hours while you decide.');
            }}
            className="mt-6 w-full bg-gold py-[18px] text-[11px] tracking-[0.26em] text-noir uppercase transition-colors duration-500 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-35"
          >
            {remaining === 0 ? 'Edition closed' : held ? `Size ${size} is held — view` : size ? `Reserve size ${size}` : 'Choose a size'}
          </button>
          <p className="mt-4 text-[12px] text-bone/60">Held for 24 hours once reserved. Delivered in Dhaka within three days.</p>
        </>
      ) : (
        <>
          <p className="mt-5 text-[14px] leading-relaxed text-bone/65">
            Three fittings at the Gulshan atelier. Ready four to five weeks after the first, and followed stage by stage in your
            client portal.
          </p>
          <Lnk
            href={`/fittings?piece=${piece.slug}`}
            className="mt-6 block w-full bg-gold py-[18px] text-center text-[11px] tracking-[0.26em] text-noir uppercase transition-colors duration-500 hover:bg-gold-light"
          >
            Book the first fitting
          </Lnk>
          <p className="mt-4 text-[12px] text-bone/60">A BDT 10,000 deposit holds the hour and is taken from the price.</p>
        </>
      )}

      {/* Small print */}
      <div className="mt-10 border-t border-ivory/10">
        {(
          [
            ['Composition', piece.composition],
            ['Care', piece.care],
            ['Delivery & returns', 'Free delivery in Dhaka within three days; elsewhere in Bangladesh within five. Ready-to-wear pieces may be returned unworn within seven days. Made-to-measure pieces are altered free for a year.'],
          ] as const
        ).map(([t, body]) => (
          <details key={t} className="group border-b border-ivory/10">
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[12px] tracking-[0.2em] text-ivory uppercase [&::-webkit-details-marker]:hidden">
              {t}
              <span className="text-gold transition-transform duration-500 group-open:rotate-45">+</span>
            </summary>
            <p className="pb-5 text-[14px] leading-relaxed text-bone/60">{body}</p>
          </details>
        ))}
      </div>

      <SaveButton slug={piece.slug} name={piece.name} />
      <a
        href={`https://wa.me/${site.atelier.whatsapp}?text=${encodeURIComponent(`Hello — a question about ${piece.name} (Nº ${piece.no}).`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center gap-3 text-[13px] text-bone/60 transition-colors hover:text-gold"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-ivory/15 font-display text-[13px] text-champagne">AK</span>
        Questions? Speak to Abdul Karim, head tailor, on WhatsApp
      </a>
    </div>
  );
}

/** Keep a piece in the client's portal (wish list) */
function SaveButton({ slug, name }: { slug: string; name: string }) {
  const saved = useDB((d) => {
    const me = d.clients.find((c) => c.id === d.session?.clientId);
    return me ? !!me.saved?.includes(slug) : null;
  });
  return (
    <button
      type="button"
      onClick={() => {
        if (saved === null) return notify.info('Sign in to save pieces', 'Saved pieces wait for you in your portal.');
        toggleSaved(slug).then(
          () => (saved ? notify.ok(`${name} removed from saved pieces`) : notify.ok(`${name} saved`, 'Find it in your portal under Saved.', { label: 'Open', onClick: () => (window.location.href = href('/portal')) })),
          (e: Error) => notify.err(e.message),
        );
      }}
      aria-pressed={!!saved}
      className="mt-6 flex items-center gap-3 text-[13px] text-bone/60 transition-colors hover:text-gold"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" aria-hidden>
        <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />
      </svg>
      {saved ? 'Saved to your portal' : 'Save this piece'}
    </button>
  );
}
