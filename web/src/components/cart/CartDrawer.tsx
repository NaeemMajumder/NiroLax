'use client';

import { useEffect, useState } from 'react';
import { asset } from '@/lib/asset';
import { bdt, hasPhotos, pieceImage, sized } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { addToCart, openCart, removeFromCart, RESERVE_MS, useCartOpen, useDB } from '@/lib/store';
import { notify } from '@/lib/toast';
import { Lnk } from '@/components/ui/Lnk';
import { Swatch } from '@/components/ui/Swatch';
import { btnGold } from '@/components/ui/Form';

/** Time left on a 24-hour reservation, ticking each minute */
function useLeft(addedAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, addedAt + RESERVE_MS - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function Line({ id, slug, size, price, addedAt }: { id: string; slug: string; size: string; price: number; addedAt: number }) {
  const pieces = usePieces();
  const p = pieces.find((x) => x.slug === slug)!;
  const left = useLeft(addedAt);
  return (
    <li className="flex gap-5 border-b border-ivory/10 py-6">
      <div className="relative h-32 w-24 shrink-0 overflow-hidden bg-graphite">
        {hasPhotos(p) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sized(pieceImage(p, 'front')!, 240)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Swatch tint={p.tint} className="absolute inset-0" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[10px] tracking-[0.22em] text-bone/60 uppercase">Nº {p.no} · Ready to wear</p>
        <p className="mt-1 font-display text-[20px] leading-tight text-ivory">{p.name}</p>
        <p className="mt-1 text-[13px] text-bone/55">Size {size}</p>
        <p className="mt-auto pt-3 text-[12px] text-gold/80">Held for you · {left}</p>
      </div>
      <div className="flex flex-col items-end justify-between">
        <p className="text-[14px] whitespace-nowrap text-champagne">{bdt(price)}</p>
        <button
          onClick={() => {
            removeFromCart(id);
            notify.ok(`${p.name}, size ${size}, released`, 'It goes back to the edition.', { label: 'Undo', onClick: () => addToCart(slug, size, price) });
          }}
          className="text-[11px] tracking-[0.18em] text-bone/60 uppercase hover:text-ivory">
          Release
        </button>
      </div>
    </li>
  );
}

/** Slide-in reservation bag */
export function CartDrawer() {
  const open = useCartOpen();
  const cart = useDB((d) => d.cart);
  const total = cart.reduce((s, c) => s + c.price, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openCart(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div onClick={() => openCart(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-700 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        role="dialog"
        aria-label="Your reservations"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-noir transition-transform duration-700 ease-(--ease-luxe) ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-ivory/10 px-7 py-6">
          <p className="font-display text-[24px] text-ivory">Your reservations</p>
          <button onClick={() => openCart(false)} aria-label="Close" className="grid h-11 w-11 place-items-center text-bone/60 hover:text-ivory">
            ✕
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="grid flex-1 place-items-center px-7 text-center">
            <div>
              <p className="font-display text-[26px] text-ivory italic">Nothing held yet.</p>
              <p className="mt-3 text-[14px] text-bone/60">Reserve a ready-to-wear size and it is held for you for 24 hours.</p>
              <Lnk href="/season" onClick={() => openCart(false)} className="mt-8 inline-block text-[11px] tracking-[0.26em] text-gold uppercase">
                See the season
              </Lnk>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-7" data-lenis-prevent>
              {cart.map((c) => (
                <Line key={c.id} {...c} />
              ))}
            </ul>
            <div className="border-t border-ivory/10 px-7 py-6">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">Total</p>
                <p className="font-display text-[26px] text-champagne">{bdt(total)}</p>
              </div>
              <p className="mt-1 text-[12px] text-bone/60">Delivery in Bangladesh is complimentary.</p>
              <Lnk href="/checkout" onClick={() => openCart(false)} className={`${btnGold} mt-6 w-full`}>
                Continue to checkout
              </Lnk>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
