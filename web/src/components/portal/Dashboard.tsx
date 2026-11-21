'use client';

import { useEffect, useMemo, useState } from 'react';
import { bdt } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { MEASURES, STAGES } from '@/lib/stages';
import { fmtDate, fmtHour, useDB, type Client } from '@/lib/store';
import { cancelMyBooking, changePassword, signOut, toggleSaved, updateProfile } from '@/lib/actions';
import { PieceCard } from '@/components/ui/PieceCard';
import { Field } from '@/components/ui/Form';
import { notify } from '@/lib/toast';
import { MARK } from '@/lib/logo-paths';
import { Lnk } from '@/components/ui/Lnk';
import { StageTracker } from '@/components/ui/StageTracker';
import { btnGhost, btnGold } from '@/components/ui/Form';

type Tab = 'pieces' | 'measures' | 'appointments' | 'orders' | 'saved' | 'account';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const ORDER_LABEL: Record<string, string> = {
  'awaiting-payment': 'Awaiting payment',
  confirmed: 'Confirmed',
  packed: 'Pressed & boxed',
  shipped: 'With our courier',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function Dashboard({ me }: { me: Client }) {
  const pieces = usePieces();
  const commissionsAll = useDB((d) => d.commissions);
  const ordersAll = useDB((d) => d.orders);
  const bookingsAll = useDB((d) => d.bookings);
  const commissions = useMemo(() => commissionsAll.filter((c) => c.clientId === me.id), [commissionsAll, me.id]);
  const orders = useMemo(() => ordersAll.filter((o) => o.clientId === me.id || o.customer.phone === me.phone), [ordersAll, me]);
  const bookings = useMemo(() => bookingsAll.filter((b) => b.clientId === me.id || b.phone === me.phone), [bookingsAll, me]);
  const [tab, setTab] = useState<Tab>('pieces');
  const [hello, setHello] = useState('Welcome');
  useEffect(() => setHello(greeting()), []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.date >= today && b.status !== 'cancelled' && b.status !== 'attended').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = bookings.filter((b) => !upcoming.includes(b));
  const next = upcoming[0];

  const tabs: [Tab, string, number][] = [
    ['pieces', 'Your pieces', commissions.length],
    ['measures', 'Measures', 0],
    ['appointments', 'Appointments', upcoming.length],
    ['orders', 'Orders', orders.length],
    ['saved', 'Saved', me.saved?.length ?? 0],
    ['account', 'Account', 0],
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-32 pb-28 md:px-[6vw] md:pt-40">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="kicker">Client portal</p>
          <h1 className="mt-4 font-display text-[clamp(40px,4.8vw,76px)] leading-[1.02] text-ivory">
            {hello}, <em className="text-champagne">{me.name.split(' ')[0]}.</em>
          </h1>
          {next && (
            <p className="mt-4 text-[15px] text-bone/60">
              Next at the atelier: <span className="text-ivory">{fmtDate(next.date, { weekday: 'long', day: 'numeric', month: 'long' })}, {fmtHour(next.time)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Lnk href="/fittings" className={btnGold}>
            Book a fitting
          </Lnk>
          <button onClick={() => signOut().then(() => notify.ok('You are signed out', 'See you at the atelier.'), (e: Error) => notify.err(e.message))} className={btnGhost}>
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-14 flex gap-1 overflow-x-auto border-y border-ivory/10 py-2 [scrollbar-width:none]" role="tablist">
        {tabs.map(([k, label, n]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`shrink-0 px-5 py-3 text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${tab === k ? 'bg-ivory text-noir' : 'text-bone/60 hover:text-ivory'}`}
          >
            {label}
            {n > 0 && <span className="ml-2 opacity-50">{n}</span>}
          </button>
        ))}
      </div>

      <div className="mt-12">
        {tab === 'pieces' &&
          (commissions.length === 0 ? (
            <Empty title="No pieces in the atelier yet." body="When a made-to-measure piece is cut for you, you can follow every stage of it here." cta={['Book a first fitting', '/fittings']} />
          ) : (
            <div className="space-y-20">
              {commissions.map((c) => {
                const p = pieces.find((x) => x.slug === c.pieceSlug)!;
                return (
                  <article key={c.id} className="grid gap-10 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] md:gap-14">
                    <div>
                      <p className="text-[11px] tracking-[0.22em] text-gold uppercase">Made to measure · {STAGES[c.stage].name}</p>
                      <h2 className="mt-3 font-display text-[clamp(32px,3vw,46px)] leading-tight text-ivory">{p.name}</h2>
                      <p className="mt-3 text-[14px] text-bone/55">{p.cloth}</p>
                      {/* Certificate */}
                      <div className="relative mt-10 overflow-hidden bg-noir p-7">
                        <div className="pointer-events-none absolute inset-2.5 border border-gold/30" />
                        <div className="relative flex items-center gap-6">
                          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-gold/50">
                            <svg viewBox={MARK.viewBox} className="h-7 w-auto" aria-hidden>
                              <path d={MARK.paths[0]} fill="#DCAF6A" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[10px] tracking-[0.26em] text-gold uppercase">Certificate of edition</p>
                            <p className="mt-2 font-display text-[28px] leading-tight text-ivory">
                              Nº {String(c.editionNo).padStart(2, '0')} <span className="text-bone/60">of {p.edition}</span>
                            </p>
                            <p className="mt-1 text-[13px] text-bone/60">Made for {me.name}</p>
                          </div>
                        </div>
                      </div>
                      <dl className="mt-8 space-y-3 text-[14px]">
                        <div className="flex justify-between border-b border-ivory/10 pb-3">
                          <dt className="text-bone/60">Reference</dt>
                          <dd className="text-ivory">{c.id}</dd>
                        </div>
                        <div className="flex justify-between border-b border-ivory/10 pb-3">
                          <dt className="text-bone/60">Price</dt>
                          <dd className="text-ivory">{bdt(c.price)}</dd>
                        </div>
                        <div className="flex justify-between border-b border-ivory/10 pb-3">
                          <dt className="text-bone/60">Deposit paid</dt>
                          <dd className="text-ivory">{bdt(10000)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="border border-ivory/10 bg-noir/40 p-6 md:p-9">
                      <StageTracker stage={c.stage} stageDates={c.stageDates} photos={c.photos} readyBy={c.readyBy} />
                    </div>
                  </article>
                );
              })}
            </div>
          ))}

        {tab === 'measures' && (
          <div className="relative max-w-3xl overflow-hidden bg-[#f3ecdf] p-7 text-noir md:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_43px,rgba(122,92,46,0.14)_43px,rgba(122,92,46,0.14)_44px)] [background-position:0_22px]" />
            <div className="pointer-events-none absolute inset-y-0 left-12 w-px bg-bordeaux/25 md:left-16" />
            <div className="relative pl-8 md:pl-10">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] tracking-[0.26em] text-antique uppercase">Measure sheet</p>
                  <p className="mt-2 font-display text-[24px]">{me.name}</p>
                </div>
                <p className="text-right text-[11px] leading-relaxed text-stone">
                  {me.measuredBy ? `Taken by ${me.measuredBy}` : 'Taken at your first fitting'}
                  <br />
                  {me.measuredAt ? fmtDate(me.measuredAt, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>
              {Object.values(me.measures).some((v) => v) ? (
                <>
                  <dl className="mt-8 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                    {MEASURES.filter((k) => me.measures[k]).map((k) => (
                      <div key={k} className="flex h-11 items-end justify-between gap-3">
                        <dt className="text-[12px] tracking-[0.1em] text-stone uppercase">{k}</dt>
                        <dd className="font-hand text-[20px] leading-none text-[#2b2a3a]">
                          {me.measures[k]}
                          <span className="text-[12px]"> cm</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {me.notes && <p className="mt-6 font-hand text-[16px] leading-[44px] text-[#2b2a3a]">{me.notes}</p>}
                </>
              ) : (
                <p className="mt-10 font-hand text-[18px] leading-[44px] text-[#2b2a3a]">Your measures will be written here at your first fitting.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">Coming up</p>
              {upcoming.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone/60">Nothing booked.</p>
              ) : (
                <ul className="mt-4 divide-y divide-ivory/10 border-y border-ivory/10">
                  {upcoming.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-4 py-5">
                      <div>
                        <p className="font-display text-[22px] text-ivory">{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'long' })} · {fmtHour(b.time)}</p>
                        <p className="mt-1 text-[13px] text-bone/55">
                          {b.purpose === 'new-piece' ? 'First fitting' : b.purpose === 'fitting' ? 'Fitting' : b.purpose === 'alteration' ? 'Alteration' : 'Conversation'}
                          {b.pieceSlug ? ` · ${pieces.find((p) => p.slug === b.pieceSlug)?.name}` : ''}
                          {b.status === 'awaiting-deposit' ? ' · deposit pending' : ''}
                        </p>
                      </div>
                      <button onClick={() => notify.run(cancelMyBooking(b.id), { loading: 'Cancelling…', ok: 'Appointment cancelled', okDetail: b.deposit && b.status !== 'awaiting-deposit' ? 'Your deposit is refunded within seven working days.' : 'The hour is free for someone else.' })} className="text-[11px] tracking-[0.18em] text-bone/60 uppercase hover:text-ivory">
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">Before</p>
              <ul className="mt-4 divide-y divide-ivory/10 border-y border-ivory/10">
                {past.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-4 text-[14px]">
                    <span className="text-bone/70">{fmtDate(b.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {fmtHour(b.time)}</span>
                    <span className="text-[11px] tracking-[0.18em] text-bone/60 uppercase">{b.status === 'cancelled' ? 'Cancelled' : 'Attended'}</span>
                  </li>
                ))}
                {past.length === 0 && <li className="py-4 text-[14px] text-bone/60">—</li>}
              </ul>
            </div>
          </div>
        )}

        {tab === 'saved' && <Saved slugs={me.saved ?? []} />}
        {tab === 'account' && <Account me={me} />}
        {tab === 'orders' &&
          (orders.length === 0 ? (
            <Empty title="No orders yet." body="Ready-to-wear pieces you order appear here, with their edition numbers." cta={['See the season', '/season']} />
          ) : (
            <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
              {orders.map((o) => (
                <li key={o.id} className="grid gap-3 py-6 md:grid-cols-[1fr_1.4fr_auto_auto] md:items-center md:gap-8">
                  <div>
                    <p className="text-[13px] text-ivory">{o.id}</p>
                    <p className="mt-1 text-[12px] text-bone/60">{fmtDate(o.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <p className="text-[14px] text-bone/70">{o.items.map((i) => `${i.name} (${i.size}) Nº ${i.editionNo || '—'}`).join(' · ')}</p>
                  <p className="text-[14px] text-champagne">{bdt(o.total)}</p>
                  <p className={`text-[11px] tracking-[0.18em] uppercase ${o.status === 'cancelled' ? 'text-bone/60' : 'text-gold'}`}>{ORDER_LABEL[o.status]}</p>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta: [string, string] }) {
  return (
    <div className="max-w-lg py-10">
      <p className="font-display text-[30px] text-ivory italic">{title}</p>
      <p className="mt-3 text-[15px] text-bone/55">{body}</p>
      <Lnk href={cta[1]} className={`${btnGold} mt-8`}>
        {cta[0]}
      </Lnk>
    </div>
  );
}

/* ── Saved pieces ───────────────────────────────────────────────────── */

function Saved({ slugs }: { slugs: string[] }) {
  const pieces = usePieces();
  const list = pieces.filter((p) => slugs.includes(p.slug));
  if (!list.length)
    return (
      <div className="py-16 text-center">
        <p className="font-display text-[30px] text-ivory italic">Nothing saved yet.</p>
        <p className="mx-auto mt-3 max-w-sm text-[15px] text-bone/55">Tap “Save” on any piece to keep it here — we will tell you if its edition is about to close.</p>
        <Lnk href="/season" className={`${btnGhost} mt-8`}>
          See the season
        </Lnk>
      </div>
    );
  return (
    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((p) => (
        <div key={p.slug}>
          <PieceCard piece={p} />
          <button onClick={() => toggleSaved(p.slug).then(() => notify.ok('Removed from saved pieces'), (e: Error) => notify.err(e.message))} className="mt-3 text-[11px] tracking-[0.2em] text-bone/60 uppercase hover:text-ivory">
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Account: details, address, password ────────────────────────────── */

function Account({ me }: { me: Client }) {
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [address, setAddress] = useState(me.address?.address ?? '');
  const [area, setArea] = useState(me.address?.area ?? '');
  const [city, setCity] = useState(me.address?.city ?? 'Dhaka');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        className="space-y-7 border border-ivory/10 bg-graphite/40 p-6 md:p-10"
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile({ name: name.trim(), email: email.trim(), address: { address, area, city } }).then(
            () => notify.ok('Your details are saved', 'Checkout fills them in for you.'),
            (x: Error) => notify.err('Not saved', x.message),
          );
        }}
      >
        <p className="font-display text-[26px] text-ivory">Your details</p>
        <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <Field label="Mobile" value={me.phone} disabled hint="To change your number, call the atelier." />
        <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="House, road, block" />
        <div className="grid grid-cols-2 gap-6">
          <Field label="Area" value={area} onChange={(e) => setArea(e.target.value)} />
          <Field label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <button className={btnGold}>Save details</button>
      </form>
      <form
        className="space-y-7 border border-ivory/10 bg-graphite/40 p-6 md:p-10"
        onSubmit={(e) => {
          e.preventDefault();
          changePassword(cur, next).then(
            () => {
              notify.ok(me.hasPassword ? 'Password changed' : 'Password set', 'Other devices were signed out.');
              setCur('');
              setNext('');
            },
            (x: Error) => notify.err(x.message),
          );
        }}
      >
        <p className="font-display text-[26px] text-ivory">{me.hasPassword ? 'Change your password' : 'Set a password'}</p>
        <p className="text-[14px] text-bone/60">{me.hasPassword ? 'Changing it signs you out on every other device.' : 'Then you can sign in with your email or mobile and a password, as well as with a code.'}</p>
        {me.hasPassword && <Field label="Current password" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />}
        <Field label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" hint="At least 8 characters, with a letter and a number." />
        <button className={btnGold}>{me.hasPassword ? 'Change password' : 'Set password'}</button>
      </form>
    </div>
  );
}
