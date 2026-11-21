'use client';
import { useSite } from '@/lib/catalogue';

import { useSearchParams } from 'next/navigation';
import { bdt } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { clearCart, useDB, type Order } from '@/lib/store';
import { useLinked } from '@/lib/actions';
import { useEffect } from 'react';
import { MARK } from '@/lib/logo-paths';
import { Lnk } from '@/components/ui/Lnk';
import { btnGhost, btnGold } from '@/components/ui/Form';

const STEPS: { key: Order['status']; label: string }[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Pressed & boxed' },
  { key: 'shipped', label: 'With our courier' },
  { key: 'delivered', label: 'Delivered' },
];

export function OrderConfirmed() {
  const site = useSite();
  const pieces = usePieces();
  const q = useSearchParams();
  const id = q.get('id');
  const loading = useLinked('order', id, q.get('key'));
  const order = useDB((d) => d.orders.find((o) => o.id === id));
  const done = !!order && order.status !== 'awaiting-payment' && order.status !== 'cancelled';
  useEffect(() => {
    if (done) clearCart();
  }, [done]);

  if (loading) return <p className="py-48 text-center text-[13px] tracking-[0.3em] text-bone/60 uppercase">One moment…</p>;
  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-5 py-48 text-center">
        <p className="font-display text-[36px] text-ivory">We could not find that order.</p>
        <Lnk href="/portal" className={`${btnGold} mt-10`}>
          Open your portal
        </Lnk>
      </div>
    );
  }

  const at = Math.max(0, STEPS.findIndex((s) => s.key === order.status));
  const first = order.customer.name.split(' ')[0];
  const where = order.delivery === 'collect' ? 'ready to collect from the atelier' : order.delivery === 'dhaka' ? 'with you within three working days' : 'with you within five working days';

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-36 pb-28 md:pt-44">
      <div className="text-center">
        <svg viewBox={MARK.viewBox} className="mx-auto h-10 w-auto animate-[invite_1.2s_var(--ease-luxe)_both]" aria-hidden>
          <path d={MARK.paths[0]} fill="#DCAF6A" />
        </svg>
        <p className="kicker mt-8">Order {order.id}</p>
        <h1 className="mt-5 font-display text-[clamp(40px,5vw,76px)] leading-[1.02] text-ivory">
          Thank you, <em className="text-champagne">{first}.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-bone/65">
          {order.paid ? 'Your payment is received' : 'Your order is confirmed — payment on delivery'}. It will be pressed, numbered and {where}. A confirmation follows by SMS{order.customer.email ? ' and by email' : ''}.
        </p>
      </div>

      <ol className="mx-auto mt-16 grid max-w-2xl grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.key} className="text-center">
            <div className="relative flex items-center justify-center">
              {i > 0 && <span className={`absolute right-1/2 h-px w-full ${i <= at ? 'bg-gold' : 'bg-ivory/15'}`} />}
              <span className={`relative h-2.5 w-2.5 rounded-full ${i <= at ? 'bg-gold' : 'border border-ivory/30 bg-noir'}`} />
            </div>
            <p className={`mt-3 text-[11px] tracking-[0.12em] uppercase ${i <= at ? 'text-ivory' : 'text-bone/60'}`}>{s.label}</p>
          </li>
        ))}
      </ol>

      <div className="mt-20 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="border border-ivory/10 p-7 md:p-9">
          <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">Your pieces</p>
          <ul className="mt-4 divide-y divide-ivory/10">
            {order.items.map((it) => {
              const p = pieces.find((x) => x.slug === it.slug)!;
              return (
                <li key={it.slug + it.size} className="flex items-center justify-between gap-4 py-5">
                  <div>
                    <p className="font-display text-[22px] text-ivory">{it.name}</p>
                    <p className="mt-1 text-[13px] text-bone/60">Size {it.size}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[20px] text-champagne">
                      Nº {String(it.editionNo || '—').padStart(2, '0')} <span className="text-bone/60">of {p.edition}</span>
                    </p>
                    <p className="mt-1 text-[13px] text-bone/60">{bdt(it.price)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-baseline justify-between border-t border-ivory/10 pt-5">
            <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">{order.paid ? 'Paid' : 'To pay on delivery'}</p>
            <p className="font-display text-[26px] text-champagne">{bdt(order.total)}</p>
          </div>
        </div>
        <div className="border border-ivory/10 p-7 md:p-9">
          <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">{order.delivery === 'collect' ? 'Collection' : 'Delivery to'}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-ivory">
            {order.customer.name}
            <br />
            {order.delivery === 'collect' ? (
              <>{site.atelier.address1}, {site.atelier.address2}</>
            ) : (
              <>
                {order.customer.address}
                <br />
                {order.delivery === 'dhaka' ? `${order.customer.area}, Dhaka` : order.customer.city}
              </>
            )}
          </p>
          <p className="mt-4 text-[14px] text-bone/55">{order.customer.phone}</p>
          <p className="mt-8 text-[11px] tracking-[0.22em] text-bone/60 uppercase">Payment</p>
          <p className="mt-2 text-[15px] text-ivory">{order.payment === 'card' ? 'Card' : order.payment === 'bkash' ? 'bKash' : 'Cash on delivery'}</p>
        </div>
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <Lnk href="/portal" className={btnGold}>
          Follow it in your portal
        </Lnk>
        <Lnk href="/season" className={btnGhost}>
          Back to the season
        </Lnk>
      </div>
    </div>
  );
}
