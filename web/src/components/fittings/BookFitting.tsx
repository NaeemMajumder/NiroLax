'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createBooking, go, loadSlots, useDemo } from '@/lib/actions';
import { notify } from '@/lib/toast';
import { bdt } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { atelierDays, fmtHour, normPhone, slotTaken, useDB, type Purpose } from '@/lib/store';
import { useSite } from '@/lib/catalogue';
import { MARK } from '@/lib/logo-paths';
import { Choice, Field, Select, TextArea, btnInk } from '@/components/ui/Form';

const PURPOSES: { key: Purpose; title: string; detail: string }[] = [
  { key: 'new-piece', title: 'A new made-to-measure piece', detail: 'Your first fitting: measures, cloth and the way you mean to wear it.' },
  { key: 'fitting', title: 'A fitting for a piece in progress', detail: 'Basted, forward or final — for clients already with us.' },
  { key: 'alteration', title: 'An alteration', detail: 'For any Nirolax piece. Free within the alteration period.' },
  { key: 'consultation', title: 'A conversation', detail: 'Not sure yet? Come and see the cloth. No obligation.' },
];

export function BookFitting() {
  const site = useSite();
  const HOURS = site.hours;
  const DEPOSIT = site.deposit;
  const pieces = usePieces();
  const q = useSearchParams();
  const db = useDB((d) => d);
  const session = db.session;
  const me = session?.role === 'client' ? db.clients.find((c) => c.id === session.clientId) : undefined;

  // Computed at once (not after mount) so the calendar does not push the page down when it appears
  const [days, setDays] = useState<string[]>(() => atelierDays(14, site.closedWeekdays, site.closedDates));
  useEffect(() => {
    setDays(atelierDays(14, site.closedWeekdays, site.closedDates));
    loadSlots().catch(() => {});
    if (new URLSearchParams(window.location.search).get('failed')) notify.err('The deposit was not completed', 'Nothing was charged and the hour was released. Please choose again.');
  }, []);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const isDemo = useDemo();

  const [purpose, setPurpose] = useState<Purpose>('new-piece');
  const [piece, setPiece] = useState(q.get('piece') ?? 'midnight-tuxedo');
  const [day, setDay] = useState<string | null>(q.get('day'));
  const [time, setTime] = useState<string | null>(q.get('time'));
  const [name, setName] = useState(q.get('name') ?? me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<'card' | 'bkash'>('bkash');
  const [tried, setTried] = useState(false);
  const failed = q.get('failed');

  useEffect(() => {
    if (me) {
      setName((n) => n || me.name);
      setPhone((p) => p || me.phone);
      setEmail((e) => e || me.email);
    }
  }, [me]);

  const needsPiece = purpose === 'new-piece' || purpose === 'fitting';
  const deposit = purpose === 'new-piece' ? DEPOSIT : 0;
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!day || !time) e.slot = 'Choose a day and an hour.';
    if (name.trim().length < 2) e.name = 'How should we greet you?';
    if (!normPhone(phone)) e.phone = 'A Bangladeshi mobile number, e.g. 01700 000000.';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'This email looks incomplete.';
    return e;
  }, [day, time, name, phone, email]);

  const submit = () => {
    setTried(true);
    if (Object.keys(errors).length) return notify.err(errors.slot ? 'Choose a day and an hour first' : 'A few details need another look', errors.slot ? undefined : 'They are marked in the form.');
    setBusy(true);
    setProblem('');
    createBooking({ date: day!, time: time!, purpose, pieceSlug: needsPiece ? piece : undefined, name: name.trim(), phone: normPhone(phone)!, email, note, method }).then(go, (e: Error) => {
      setProblem(e.message);
      notify.err('We could not book that hour', e.message);
      setBusy(false);
      loadSlots().catch(() => {});
    });
  };

  const dayLabel = (d: string) => {
    const x = new Date(d + 'T12:00:00');
    return { wd: x.toLocaleDateString('en-GB', { weekday: 'short' }), n: x.getDate(), m: x.toLocaleDateString('en-GB', { month: 'short' }) };
  };

  return (
    <div className="relative bg-ivory p-2 text-noir shadow-[0_40px_80px_-30px_rgba(11,11,12,0.35)]">
      <div className="relative border border-gold/50 p-6 md:p-12">
        <div className="pointer-events-none absolute inset-1.5 border border-gold/25" />
        <svg viewBox={MARK.viewBox} className="mx-auto h-9 w-auto" aria-hidden>
          <path d={MARK.paths[0]} fill="#A9824A" />
        </svg>
        <p className="mt-6 text-center font-display text-[26px] md:text-[30px]">Request an appointment</p>
        {failed && <p className="mt-3 text-center text-[13px] text-bordeaux">The deposit was not completed, so the hour was released. Please choose again.</p>}

        {/* I — purpose */}
        <fieldset className="mt-10 min-w-0">
          <legend className="text-[10px] tracking-[0.24em] text-stone uppercase">I · What is it for</legend>
          <div className="mt-4 grid gap-2" role="radiogroup">
            {PURPOSES.map((p) => (
              <Choice key={p.key} tone="light" checked={purpose === p.key} onSelect={() => setPurpose(p.key)} title={p.title} detail={p.detail} aside={p.key === 'new-piece' ? bdt(DEPOSIT) : undefined} />
            ))}
          </div>
          {needsPiece && (
            <div className="mt-6">
              <Select tone="light" label="Which piece" value={piece} onChange={(e) => setPiece(e.target.value)}>
                {pieces.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    Nº {p.no} — {p.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </fieldset>

        {/* II — day and hour */}
        <fieldset className="mt-10 min-w-0">
          <legend className="text-[10px] tracking-[0.24em] text-stone uppercase">II · Day and hour</legend>
          <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none]" data-lenis-prevent>
            {days.map((d) => {
              const l = dayLabel(d);
              const full = HOURS.every((h) => slotTaken(db, d, h));
              return (
                <button
                  key={d}
                  type="button"
                  disabled={full}
                  onClick={() => {
                    setDay(d);
                    setTime(null);
                  }}
                  aria-pressed={day === d}
                  className={`flex w-[68px] shrink-0 snap-start flex-col items-center py-3.5 transition-colors duration-500 disabled:opacity-30 ${
                    day === d ? 'bg-noir text-ivory' : 'border border-noir/12 hover:border-noir/50'
                  }`}
                >
                  <span className="text-[10px] tracking-[0.18em] uppercase opacity-70">{l.wd}</span>
                  <span className="mt-1 font-display text-[26px] leading-none">{l.n}</span>
                  <span className="mt-1 text-[10px] tracking-[0.18em] uppercase opacity-70">{full ? 'Full' : l.m}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {HOURS.map((t) => {
              const taken = day ? slotTaken(db, day, t) : false;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={!day || taken}
                  onClick={() => setTime(t)}
                  aria-pressed={time === t}
                  className={`py-3 text-[14px] transition-colors duration-500 ${
                    time === t ? 'bg-noir text-ivory' : taken ? 'text-noir/25 line-through' : 'border border-noir/12 hover:border-noir/50 disabled:opacity-40'
                  }`}
                >
                  {fmtHour(t)}
                </button>
              );
            })}
          </div>
          {tried && errors.slot && <p className="mt-2 text-[12px] text-bordeaux">{errors.slot}</p>}
        </fieldset>

        {/* III — details */}
        <fieldset className="mt-10 grid min-w-0 gap-7 sm:grid-cols-2">
          <legend className="mb-1 text-[10px] tracking-[0.24em] text-stone uppercase">III · About you</legend>
          <Field tone="light" label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As you would like to be greeted" error={tried ? errors.name : undefined} />
          <Field tone="light" label="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXX XXXXXX" error={tried ? errors.phone : undefined} />
          <div className="sm:col-span-2">
            <Field tone="light" label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={tried ? errors.email : undefined} />
          </div>
          <div className="sm:col-span-2">
            <TextArea tone="light" label="Anything we should know" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="An occasion, a date, a cloth you have in mind" />
          </div>
        </fieldset>

        {/* IV — deposit */}
        {deposit > 0 && (
          <fieldset className="mt-10 min-w-0">
            <legend className="text-[10px] tracking-[0.24em] text-stone uppercase">IV · Deposit</legend>
            <p className="mt-3 text-[14px] leading-relaxed text-stone">
              {bdt(DEPOSIT)} holds the hour and is taken from the price of your piece. Refunded in full if you cancel more than 24 hours before.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup">
              <Choice tone="light" checked={method === 'bkash'} onSelect={() => setMethod('bkash')} title="bKash" />
              <Choice tone="light" checked={method === 'card'} onSelect={() => setMethod('card')} title="Card" />
            </div>
          </fieldset>
        )}

        {problem && <p className="mt-6 text-center text-[13px] text-bordeaux">{problem}</p>}
        <button type="button" onClick={submit} disabled={busy} className={`${btnInk} mt-10 w-full disabled:opacity-60`}>
          {deposit ? `Pay ${bdt(deposit)} and request` : 'Request this appointment'}
        </button>
        <p className="mt-3 text-center text-[11px] text-stone">{isDemo ? 'Demo — no appointment is actually booked and no money is taken.' : 'Cancel free of charge up to 24 hours before — the deposit is refunded in full.'}</p>
      </div>
    </div>
  );
}
