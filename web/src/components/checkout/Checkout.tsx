'use client';
import { useSite } from '@/lib/catalogue';

import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/lib/toast';
import { go, placeOrder, useDemo } from '@/lib/actions';
import { asset } from '@/lib/asset';
import { bdt, hasPhotos, pieceImage } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { normPhone, useDB, type Customer, type DeliveryMethod, type PaymentMethod } from '@/lib/store';
import { Lnk } from '@/components/ui/Lnk';
import { Swatch } from '@/components/ui/Swatch';
import { Choice, Field, Select, btnGold } from '@/components/ui/Form';

const DHAKA_AREAS = ['Gulshan', 'Banani', 'Baridhara', 'Dhanmondi', 'Uttara', 'Bashundhara', 'Mohakhali', 'Mirpur', 'Old Dhaka', 'Other'];

const empty: Customer = { name: '', phone: '', email: '', address: '', area: 'Gulshan', city: 'Dhaka' };

export function Checkout() {
  const site = useSite();
  const pieces = usePieces();
  const cart = useDB((d) => d.cart);
  const session = useDB((d) => d.session);
  const clients = useDB((d) => d.clients);
  const me = session?.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;

  const [c, setC] = useState<Customer>(() => (me ? { ...empty, name: me.name, phone: me.phone, email: me.email } : empty));
  const [delivery, setDelivery] = useState<DeliveryMethod>('dhaka');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const isDemo = useDemo();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('failed')) {
      notify.err('The payment was not completed', 'Nothing was charged. Your pieces are still held — try again or choose another way to pay.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const total = cart.reduce((s, x) => s + x.price, 0);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (c.name.trim().length < 2) e.name = 'Please write your full name.';
    if (!normPhone(c.phone)) e.phone = 'A Bangladeshi mobile number, e.g. 01700 000000.';
    if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) e.email = 'This email looks incomplete.';
    if (delivery !== 'collect' && c.address.trim().length < 5) e.address = 'House, road and block, please.';
    if (delivery === 'outside' && c.city.trim().length < 2) e.city = 'Which city or district?';
    return e;
  }, [c, delivery]);
  const ok = Object.keys(errors).length === 0;
  const codAllowed = delivery !== 'outside';
  const pay = codAllowed || payment !== 'cod' ? payment : 'card';

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setC((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    setTried(true);
    if (!ok || !cart.length) {
      if (!ok) notify.err('A few details need another look', 'They are marked in the form.');
      return;
    }
    setBusy(true);
    setProblem('');
    placeOrder({ customer: { ...c, phone: normPhone(c.phone)!, city: delivery === 'outside' ? c.city : 'Dhaka' }, delivery, payment: pay }).then(go, (e: Error) => {
      setProblem(e.message);
      notify.err('We could not place the order', e.message);
      setBusy(false);
    });
  };

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-xl px-5 py-40 text-center">
        <p className="font-display text-[40px] text-ivory">Nothing to check out.</p>
        <p className="mt-4 text-[15px] text-bone/55">Your reservations are empty, or their 24 hours have passed.</p>
        <Lnk href="/season" className={`${btnGold} mt-10`}>
          See the season
        </Lnk>
      </div>
    );
  }

  const err = (k: keyof Customer) => (tried ? errors[k] : undefined);

  return (
    <div className="mx-auto grid max-w-[1440px] gap-14 px-5 pt-32 pb-28 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-[6vw] md:px-[6vw] md:pt-40">
      <div>
        <p className="kicker">Checkout</p>
        <h1 className="mt-4 font-display text-[clamp(40px,4.4vw,68px)] leading-[1.02] text-ivory">Nearly yours.</h1>

        <section className="mt-14">
          <h2 className="flex items-baseline gap-4 font-display text-[26px] text-ivory">
            <span className="text-[15px] text-gold/70 italic">I</span> Who it is for
          </h2>
          {!me && (
            <p className="mt-3 text-[13px] text-bone/60">
              Already a client?{' '}
              <Lnk href="/portal" className="text-gold underline-offset-4 hover:underline">
                Sign in
              </Lnk>{' '}
              and we fill this in.
            </p>
          )}
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <Field label="Full name" value={c.name} onChange={set('name')} autoComplete="name" error={err('name')} />
            <Field label="Mobile" value={c.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="01XXX XXXXXX" error={err('phone')} />
            <div className="sm:col-span-2">
              <Field label="Email (for the receipt)" type="email" value={c.email} onChange={set('email')} autoComplete="email" error={err('email')} />
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-baseline gap-4 font-display text-[26px] text-ivory">
            <span className="text-[15px] text-gold/70 italic">II</span> How it reaches you
          </h2>
          <div className="mt-8 grid gap-3" role="radiogroup">
            <Choice checked={delivery === 'dhaka'} onSelect={() => setDelivery('dhaka')} title="Delivered in Dhaka" detail="By our own courier, within three working days. Boxed with its certificate." aside="Complimentary" />
            <Choice checked={delivery === 'outside'} onSelect={() => setDelivery('outside')} title="Delivered outside Dhaka" detail="Anywhere in Bangladesh within five working days." aside="Complimentary" />
            <Choice checked={delivery === 'collect'} onSelect={() => setDelivery('collect')} title="Collect from the atelier" detail={`${site.atelier.address1}, ${site.atelier.address2}. We make any last adjustment while you wait.`} aside="—" />
          </div>
          {delivery !== 'collect' && (
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Address" value={c.address} onChange={set('address')} autoComplete="street-address" placeholder="House, road, block" error={err('address')} />
              </div>
              {delivery === 'dhaka' ? (
                <Select label="Area" value={c.area} onChange={set('area')}>
                  {DHAKA_AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </Select>
              ) : (
                <Field label="City / district" value={c.city === 'Dhaka' ? '' : c.city} onChange={set('city')} error={err('city')} />
              )}
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="flex items-baseline gap-4 font-display text-[26px] text-ivory">
            <span className="text-[15px] text-gold/70 italic">III</span> Payment
          </h2>
          <div className="mt-8 grid gap-3" role="radiogroup">
            <Choice checked={pay === 'card'} onSelect={() => setPayment('card')} title="Card" detail="Visa, Mastercard, Amex. EMI available on cards from 18 banks." aside="SSLCommerz" />
            <Choice checked={pay === 'bkash'} onSelect={() => setPayment('bkash')} title="bKash" detail="Pay from your bKash account. You approve it in the next step." aside="bKash" />
            <Choice
              checked={pay === 'cod'}
              onSelect={() => setPayment('cod')}
              disabled={!codAllowed}
              title="Cash on delivery"
              detail={codAllowed ? 'Pay when it is in your hands. Dhaka and atelier collection only.' : 'Not available outside Dhaka.'}
            />
          </div>
        </section>

        <button onClick={submit} disabled={busy} className={`${btnGold} mt-14 w-full md:w-auto md:px-14`}>
          {pay === 'cod' ? 'Place the order' : `Pay ${bdt(total)}`}
        </button>
        {tried && !ok && <p className="mt-4 text-[13px] text-[#c2566a]">A few details above need another look.</p>}
        {problem && <p className="mt-4 text-[13px] text-[#c2566a]">{problem}</p>}
        <p className="mt-4 text-[12px] text-bone/60">{isDemo ? 'Demo — no real payment is taken.' : 'Payments are processed securely by SSLCommerz. We never see your card details.'}</p>
      </div>

      {/* Summary */}
      <aside className="md:sticky md:top-32 md:self-start">
        <div className="border border-ivory/10 p-7">
          <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">Your order</p>
          <ul className="mt-5 divide-y divide-ivory/10">
            {cart.map((x) => {
              const p = pieces.find((y) => y.slug === x.slug)!;
              return (
                <li key={x.id} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-graphite">
                    {hasPhotos(p) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pieceImage(p, 'front')!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <Swatch tint={p.tint} className="absolute inset-0" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[17px] leading-tight text-ivory">{p.name}</p>
                    <p className="mt-1 text-[12px] text-bone/60">Size {x.size} · numbered on dispatch</p>
                  </div>
                  <p className="text-[13px] whitespace-nowrap text-champagne">{bdt(x.price)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-ivory/10 pt-5 text-[14px]">
            <div className="flex justify-between text-bone/60">
              <dt>Delivery</dt>
              <dd>Complimentary</dd>
            </div>
            <div className="flex items-baseline justify-between pt-2 text-ivory">
              <dt className="text-[11px] tracking-[0.22em] uppercase">Total</dt>
              <dd className="font-display text-[28px] text-champagne">{bdt(total)}</dd>
            </div>
          </dl>
        </div>
        <ul className="mt-6 space-y-2 text-[12px] text-bone/60">
          <li>Returns accepted unworn within seven days.</li>
          <li>Free alterations at the atelier within thirty days.</li>
        </ul>
      </aside>
    </div>
  );
}
