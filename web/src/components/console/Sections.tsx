'use client';

import { useMemo, useState } from 'react';
import { bdt, getPieces } from '@/lib/pieces';
import { usePieces } from '@/lib/catalogue';
import { MEASURES, STAGES } from '@/lib/stages';
import { fmtDate, fmtHour, useDB, type Booking, type OrderStatus } from '@/lib/store';
import { addClient, advanceStage, API, bookWalkIn, createCommission, deleteClient, editClient, exportHref, setBookingStatus, setMessageRead, setRemaining, setStagePhoto, updateBooking, updateClient, updateCommission, useConsoleExtras } from '@/lib/actions';
import { normPhone, type Purpose } from '@/lib/store';
import { OutboxList } from './AdminPanels';
import { Card, H, Pill, SmallBtn, readPhoto } from './ui';
import { asset } from '@/lib/asset';

const pieceName = (slug?: string) => getPieces().find((p) => p.slug === slug)?.name ?? '—';
const purposeLabel: Record<Booking['purpose'], string> = { 'new-piece': 'First fitting', fitting: 'Fitting', alteration: 'Alteration', consultation: 'Conversation' };
const todayKey = () => new Date().toISOString().slice(0, 10);

/* ── Overview ───────────────────────────────────────────────────────── */

export function Overview({ go }: { go: (t: string) => void }) {
  const pieces = usePieces();
  const d = useDB((x) => x);
  const t = todayKey();
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const live = d.bookings.filter((b) => b.status === 'confirmed' || b.status === 'awaiting-deposit');
  const todayN = live.filter((b) => b.date === t).length;
  const weekN = live.filter((b) => b.date >= t && b.date <= week).length;
  const month = new Date().toISOString().slice(0, 7);
  const revenue =
    d.orders.filter((o) => o.paid && new Date(o.createdAt).toISOString().startsWith(month)).reduce((s, o) => s + o.total, 0) +
    d.bookings.filter((b) => b.deposit && b.status !== 'cancelled' && b.status !== 'awaiting-deposit' && new Date(b.createdAt).toISOString().startsWith(month)).reduce((s, b) => s + b.deposit, 0);
  const low = pieces.filter((p) => (d.remaining[p.slug] ?? 0) <= 5);
  const next = live.filter((b) => b.date >= t).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);

  const can = d.staff?.can ?? [];
  const kpis = (
    [
      ['Fittings today', todayN, 'fittings'],
      ['This week', weekN, 'fittings'],
      ['In production', d.commissions.filter((c) => c.stage < STAGES.length - 1).length, 'production'],
      ['Taken this month', bdt(revenue), 'orders'],
    ] as const
  ).filter(([, , perm]) => can.includes(perm));

  const unread = (d.messages ?? []).filter((m) => !m.read).length;
  return (
    <div className="space-y-10">
      <H>The atelier today</H>
      {unread > 0 && (
        <button onClick={() => go('messages')} className="flex w-full items-center justify-between gap-4 border border-gold/40 bg-gold/[0.06] px-5 py-4 text-left text-[14px] text-ivory transition-colors hover:border-gold">
          <span>
            {unread} new {unread === 1 ? 'note' : 'notes'} from the contact form
          </span>
          <span className="text-[10px] tracking-[0.22em] text-gold uppercase">Read →</span>
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, v, to]) => (
          <button key={label} onClick={() => go(to)} className="border border-ivory/10 bg-noir/50 p-6 text-left transition-colors hover:border-gold/50">
            <p className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">{label}</p>
            <p className="mt-3 font-display text-[38px] leading-none text-ivory">{v}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">Next appointments</p>
          <ul className="mt-4 divide-y divide-ivory/10">
            {next.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 py-3.5 text-[14px]">
                <span className="w-32 shrink-0 text-bone/60">
                  {fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtHour(b.time)}
                </span>
                <span className="flex-1 text-ivory">{b.name}</span>
                <span className="text-bone/50">{purposeLabel[b.purpose]}</span>
              </li>
            ))}
            {next.length === 0 && <li className="py-4 text-bone/45">Nothing booked.</li>}
          </ul>
        </Card>
        <Card className="p-6">
          <p className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">Editions running low</p>
          <ul className="mt-4 divide-y divide-ivory/10">
            {low.map((p) => (
              <li key={p.slug} className="flex items-center justify-between py-3.5 text-[14px]">
                <span className="text-ivory">
                  Nº {p.no} · {p.name}
                </span>
                <Pill tone="warn">{d.remaining[p.slug]} left</Pill>
              </li>
            ))}
            {low.length === 0 && <li className="py-4 text-bone/45">All editions healthy.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ── Fittings ───────────────────────────────────────────────────────── */

export function Fittings() {
  const bookings = useDB((d) => d.bookings);
  const commissions = useDB((d) => d.commissions);
  const [show, setShow] = useState<'upcoming' | 'past'>('upcoming');
  const t = todayKey();
  const list = useMemo(
    () =>
      bookings
        .filter((b) => (show === 'upcoming' ? b.date >= t && b.status !== 'attended' && b.status !== 'cancelled' : b.date < t || b.status === 'attended' || b.status === 'cancelled'))
        .sort((a, b) => (show === 'upcoming' ? 1 : -1) * (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings, show, t],
  );
  const byDay = list.reduce<Record<string, Booking[]>>((m, b) => ((m[b.date] ??= []).push(b), m), {});
  const [walkIn, setWalkIn] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <H
        aside={
          <div className="flex flex-wrap gap-1">
            {API && (
              <button onClick={() => setWalkIn((v) => !v)} className="mr-2 bg-gold px-4 py-2 text-[10px] tracking-[0.2em] text-noir uppercase">
                {walkIn ? 'Close' : 'Book a fitting'}
              </button>
            )}
            {API && (
              <a href={exportHref('bookings')} className="mr-2 border border-ivory/20 px-4 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
                Excel
              </a>
            )}
            {(['upcoming', 'past'] as const).map((k) => (
              <button key={k} onClick={() => setShow(k)} className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase ${show === k ? 'bg-ivory text-noir' : 'text-bone/60'}`}>
                {k}
              </button>
            ))}
          </div>
        }
      >
        Fittings
      </H>
      {walkIn && <WalkInForm onDone={() => setWalkIn(false)} />}
      {Object.entries(byDay).map(([day, items]) => (
        <Card key={day}>
          <p className="border-b border-ivory/10 px-6 py-4 font-display text-[20px] text-champagne">{fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <ul className="divide-y divide-ivory/10">
            {items.map((b) => {
              const hasCommission = commissions.some((c) => c.clientId === b.clientId && c.pieceSlug === b.pieceSlug);
              return (
                <li key={b.id} className="grid gap-3 px-6 py-5 lg:grid-cols-[5rem_1.2fr_1.2fr_auto] lg:items-center">
                  <span className="font-display text-[22px] text-ivory">{fmtHour(b.time)}</span>
                  <div>
                    <p className="text-[15px] text-ivory">{b.name}</p>
                    <p className="mt-0.5 text-[12px] text-bone/50">
                      {b.phone} {b.email ? `· ${b.email}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[14px] text-bone/80">
                      {purposeLabel[b.purpose]}
                      {b.pieceSlug ? ` · ${pieceName(b.pieceSlug)}` : ''}
                    </p>
                    {b.note && <p className="mt-0.5 text-[12px] text-bone/45 italic">“{b.note}”</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {b.status === 'awaiting-deposit' && <Pill tone="warn">Deposit pending</Pill>}
                    {b.status === 'confirmed' && <Pill tone="gold">Confirmed{b.deposit ? ' · deposit paid' : ''}</Pill>}
                    {b.status === 'attended' && <Pill tone="ok">Attended</Pill>}
                    {b.status === 'cancelled' && <Pill>Cancelled</Pill>}
                    {(b.status === 'confirmed' || b.status === 'awaiting-deposit') && (
                      <>
                        <SmallBtn onClick={() => setBookingStatus(b.id, 'attended')}>Attended</SmallBtn>
                        {API && b.status === 'awaiting-deposit' && <SmallBtn onClick={() => updateBooking(b.id, { depositPaid: true }).catch(() => {})}>Deposit received</SmallBtn>}
                        {API && <SmallBtn onClick={() => setMoving(moving === b.id ? null : b.id)}>Move</SmallBtn>}
                        <SmallBtn onClick={() => setBookingStatus(b.id, 'cancelled')}>Cancel</SmallBtn>
                      </>
                    )}
                    {b.status === 'attended' && b.purpose === 'new-piece' && b.pieceSlug && b.clientId && !hasCommission && (
                      <SmallBtn tone="gold" onClick={() => createCommission(b.clientId!, b.pieceSlug!)}>
                        Start the piece
                      </SmallBtn>
                    )}
                  </div>
                  {moving === b.id && <MoveForm id={b.id} date={b.date} time={b.time} onDone={() => setMoving(null)} />}
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
      {list.length === 0 && <p className="text-bone/50">Nothing here.</p>}
    </div>
  );
}

/* ── Production ─────────────────────────────────────────────────────── */

export function Production() {
  const commissions = useDB((d) => d.commissions);
  const clients = useDB((d) => d.clients);
  const [err, setErr] = useState('');

  return (
    <div className="space-y-8">
      <H>In the atelier</H>
      <p className="max-w-2xl text-[14px] text-bone/55">
        Move a piece to its next stage when the work is done, and add a photograph of the stage — the client sees both in their portal at once.
      </p>
      {err && <p className="text-[13px] text-[#d98597]">{err}</p>}
      {commissions.map((c) => {
        const client = clients.find((x) => x.id === c.clientId);
        const stage = STAGES[c.stage];
        const photo = c.photos[stage.slug];
        return (
          <Card key={c.id} className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.24em] text-gold uppercase">
                  {c.id} · Nº {String(c.editionNo).padStart(2, '0')}
                </p>
                <p className="mt-2 font-display text-[26px] text-ivory">{pieceName(c.pieceSlug)}</p>
                <p className="mt-1 text-[13px] text-bone/55">
                  for {client?.name} · {client?.phone}
                </p>
              </div>
              <label className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">
                Ready by
                <input
                  type="date"
                  value={c.readyBy}
                  onChange={(e) => updateCommission(c.id, { readyBy: e.target.value })}
                  className="mt-2 block border-b border-ivory/20 bg-transparent pb-1.5 text-[15px] tracking-normal text-ivory normal-case outline-none [color-scheme:dark] focus:border-gold"
                />
              </label>
            </div>

            {/* Stage rail */}
            <ol className="mt-8 flex gap-1" aria-label="Stages">
              {STAGES.map((s, i) => (
                <li key={s.slug} title={s.name} className="flex-1">
                  <span className={`block h-1.5 ${i < c.stage ? 'bg-gold' : i === c.stage ? 'bg-champagne' : 'bg-ivory/10'}`} />
                </li>
              ))}
            </ol>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <p className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">
                  Stage {c.stage + 1} of {STAGES.length}
                </p>
                <p className="mt-2 font-display text-[30px] text-ivory">{stage.name}</p>
                <p className="mt-1 text-[14px] text-bone/55">{stage.note}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <SmallBtn onClick={() => advanceStage(c.id, -1)} disabled={c.stage === 0}>
                    ← Back a stage
                  </SmallBtn>
                  <SmallBtn tone="gold" onClick={() => advanceStage(c.id, 1)} disabled={c.stage === STAGES.length - 1}>
                    Done — next stage →
                  </SmallBtn>
                </div>
                <label className="mt-6 block text-[10px] tracking-[0.24em] text-bone/50 uppercase">
                  Atelier notes (not shown to the client)
                  <textarea
                    rows={2}
                    defaultValue={c.notes}
                    onBlur={(e) => e.target.value !== c.notes && updateCommission(c.id, { notes: e.target.value })}
                    className="mt-2 w-full resize-none border-b border-ivory/20 bg-transparent pb-2 text-[14px] tracking-normal text-ivory normal-case outline-none focus:border-gold"
                  />
                </label>
              </div>
              <div>
                {/* The client sees the atelier's own photo, else the house photo for this stage — show the same here */}
                <div
                  className="relative aspect-[16/10] overflow-hidden border border-ivory/10 bg-graphite"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (!f || !f.type.startsWith('image/')) return setErr('Drop a JPEG, PNG or WebP photo.');
                    try {
                      setStagePhoto(c.id, stage.slug, await readPhoto(f));
                      setErr('');
                    } catch {
                      setErr('That photo could not be read. Try a JPEG or PNG.');
                    }
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo ?? asset(`atelier/stages/${stage.slug}.webp`)} alt={stage.name} className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-noir/75 px-2 py-1 text-[10px] tracking-[0.16em] text-bone/80 uppercase">
                    {photo ? 'Your photo' : 'House photo · client sees this until you add one'}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <label className="cursor-pointer border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
                    {photo ? 'Replace photo' : 'Add your photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          setStagePhoto(c.id, stage.slug, await readPhoto(f));
                          setErr('');
                        } catch {
                          setErr('That photo could not be read. Try a JPEG or PNG.');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {photo && <SmallBtn onClick={() => setStagePhoto(c.id, stage.slug, null)}>Remove</SmallBtn>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Orders ─────────────────────────────────────────────────────────── */

const ORDER_STATUSES: [OrderStatus, string][] = [
  ['awaiting-payment', 'Awaiting payment'],
  ['confirmed', 'Confirmed'],
  ['packed', 'Pressed & boxed'],
  ['shipped', 'With courier'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

export { OrdersPanel as Orders } from './OrdersPanel';

/* ── Clients ────────────────────────────────────────────────────────── */

export function Clients() {
  const clients = useDB((d) => d.clients);
  const commissions = useDB((d) => d.commissions);
  const [id, setId] = useState(clients[0]?.id);
  const [q, setQ] = useState('');
  const c = clients.find((x) => x.id === id);
  const list = clients.filter((x) => (x.name + x.phone).toLowerCase().includes(q.toLowerCase()));
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const canDelete = useDB((d) => !!d.staff?.can.includes('settings'));

  return (
    <div className="space-y-8">
      <H
        aside={
          API ? (
            <div className="flex gap-2">
              <a href={exportHref('clients')} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
                Excel
              </a>
              <SmallBtn tone="gold" onClick={() => setAdding((v) => !v)}>
                {adding ? 'Close' : 'Add a client'}
              </SmallBtn>
            </div>
          ) : undefined
        }
      >
        Clients
      </H>
      {adding && <AddClient onDone={(newId) => { setAdding(false); if (newId) setId(newId); }} />}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone"
            className="w-full border-b border-ivory/20 bg-transparent px-2 pb-2 text-[14px] text-ivory outline-none placeholder:text-bone/35 focus:border-gold"
          />
          <ul className="mt-3">
            {list.map((x) => (
              <li key={x.id}>
                <button onClick={() => { setId(x.id); setSaved(false); }} className={`w-full px-2 py-3 text-left ${x.id === id ? 'bg-ivory/[0.06]' : 'hover:bg-ivory/[0.03]'}`}>
                  <p className="text-[14px] text-ivory">{x.name}</p>
                  <p className="text-[12px] text-bone/45">{x.phone}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        {c && (
          <Card key={c.id} className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-[28px] text-ivory">{c.name}</p>
                <p className="mt-1 text-[13px] text-bone/55">
                  {c.phone} · {c.email || 'no email'} · client since {fmtDate(c.since, { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="gold">{commissions.filter((x) => x.clientId === c.id).length} pieces</Pill>
                {c.hasPassword && <Pill tone="ok">Has an account</Pill>}
                {API && <SmallBtn onClick={() => setEditing((v) => !v)}>{editing ? 'Close' : 'Edit details'}</SmallBtn>}
                {API && canDelete && (
                  <SmallBtn onClick={() => deleteClient(c.id).then(() => setId(clients.find((x) => x.id !== c.id)?.id ?? ''), () => {})}>Delete (privacy)</SmallBtn>
                )}
              </div>
            </div>
            {editing && <EditClient c={c} onDone={() => setEditing(false)} />}
            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const measures: Record<string, number | undefined> = {};
                MEASURES.forEach((k) => {
                  const v = parseFloat(String(f.get(k) ?? ''));
                  measures[k] = Number.isFinite(v) ? v : undefined;
                });
                updateClient(c.id, { measures, notes: String(f.get('notes') ?? ''), measuredBy: String(f.get('by') ?? '') || undefined });
                setSaved(true);
              }}
            >
              <p className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">Measures (cm)</p>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
                {MEASURES.map((k) => (
                  <label key={k} className="block">
                    <span className="text-[11px] text-bone/55">{k}</span>
                    <input
                      name={k}
                      type="number"
                      step="0.5"
                      defaultValue={c.measures[k] ?? ''}
                      className="mt-1 w-full border-b border-ivory/20 bg-transparent pb-1.5 font-hand text-[18px] text-champagne outline-none focus:border-gold"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-8 block">
                <span className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">Tailor&rsquo;s notes (the client sees these)</span>
                <textarea name="notes" rows={3} defaultValue={c.notes} className="mt-2 w-full resize-none border-b border-ivory/20 bg-transparent pb-2 font-hand text-[16px] leading-relaxed text-champagne outline-none focus:border-gold" />
              </label>
              <div className="mt-6 flex flex-wrap items-end gap-6">
                <label className="block">
                  <span className="text-[10px] tracking-[0.24em] text-bone/50 uppercase">Measured by</span>
                  <input name="by" defaultValue={c.measuredBy ?? 'A. Karim'} className="mt-2 block border-b border-ivory/20 bg-transparent pb-1.5 text-[15px] text-ivory outline-none focus:border-gold" />
                </label>
                <SmallBtn tone="gold">Save the sheet</SmallBtn>
                {saved && <span className="text-[12px] text-[#9cc5a6]">Saved — visible in the client&rsquo;s portal.</span>}
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Editions ───────────────────────────────────────────────────────── */

export function Editions() {
  const pieces = usePieces();
  const remaining = useDB((d) => d.remaining);
  return (
    <div className="space-y-8">
      <H>Editions</H>
      <Card>
        <ul className="divide-y divide-ivory/10">
          {pieces.map((p) => {
            const left = remaining[p.slug] ?? 0;
            const made = p.edition - left;
            return (
              <li key={p.slug} className="grid items-center gap-4 px-6 py-5 md:grid-cols-[3rem_1.4fr_1.6fr_auto]">
                <span className="font-display text-[18px] text-gold/80 italic">{p.no}</span>
                <div>
                  <p className="text-[15px] text-ivory">{p.name}</p>
                  <p className="text-[12px] text-bone/45">
                    RTW {bdt(p.rtw)} · MTM {bdt(p.mtm)}
                  </p>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: p.edition }, (_, i) => (
                    <span key={i} className={`h-2 flex-1 ${i < made ? 'bg-ivory/15' : 'bg-gold/70'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <SmallBtn onClick={() => setRemaining(p.slug, left - 1)}>−</SmallBtn>
                  <span className="w-16 text-center text-[14px] text-ivory">
                    {left} / {p.edition}
                  </span>
                  <SmallBtn onClick={() => setRemaining(p.slug, Math.min(p.edition, left + 1))}>+</SmallBtn>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* ── Messages (contact form) ────────────────────────────────────────── */

const topicLabel: Record<string, string> = { 'made-to-measure': 'Made to measure', appointment: 'Appointment', order: 'Order', press: 'Press', other: 'Other' };

export function Messages() {
  const messages = useDB((x) => x.messages);
  const subs = useDB((x) => x.subscriberCount ?? x.subscribers.length);
  const [filter, setFilter] = useState<'all' | 'unread' | 'outbox'>('all');
  const list = (messages ?? []).filter((m) => filter === 'all' || (filter === 'unread' && !m.read));
  const unread = (messages ?? []).filter((m) => !m.read).length;
  return (
    <div className="space-y-8">
      <H
        aside={
          <div className="flex gap-2">
            {(['all', 'unread', ...(API ? (['outbox'] as const) : [])] as const).map((f) => (
              <SmallBtn key={f} tone={filter === f ? 'gold' : 'ghost'} onClick={() => setFilter(f)}>
                {f === 'all' ? `All · ${messages?.length ?? 0}` : f === 'unread' ? `Unread · ${unread}` : 'Outbox'}
              </SmallBtn>
            ))}
            {API && (
              <a href={exportHref('subscribers')} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
                Letter list
              </a>
            )}
          </div>
        }
      >
        Messages
      </H>
      {filter === 'outbox' ? (
        <OutboxList />
      ) : (
      <>
      <p className="text-[14px] text-bone/55">
        Notes left on the contact page. {subs} {subs === 1 ? 'reader is' : 'readers are'} on the Letter list.
      </p>
      <div className="space-y-4">
        {list.map((m) => {
          const wa = m.phone ? `https://wa.me/88${m.phone}` : null;
          return (
            <Card key={m.id} className={`p-5 md:p-6 ${m.read ? '' : 'border-gold/40'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[22px] leading-tight text-ivory">{m.name}</p>
                  <p className="mt-1 text-[13px] text-bone/50">
                    {fmtDate(m.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    {m.phone ? ` · ${m.phone}` : ''}
                    {m.email ? ` · ${m.email}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!m.read && <Pill tone="gold">New</Pill>}
                  <Pill>{topicLabel[m.topic] ?? m.topic}</Pill>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed whitespace-pre-line text-bone/85">{m.message}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {m.email && (
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent('Your note to Nirolax')}`} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
                    Reply by email
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
                    WhatsApp
                  </a>
                )}
                <SmallBtn onClick={() => setMessageRead(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark as read'}</SmallBtn>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <Card className="px-6 py-12 text-center text-bone/50">{filter === 'unread' ? 'Every note has been read.' : 'No messages yet.'}</Card>}
      </div>
      </>
      )}
    </div>
  );
}

/* ── Fittings: book at the atelier, move an appointment ─────────────── */

const inp = 'mt-1.5 w-full border-b border-ivory/20 bg-transparent pb-1.5 text-[14px] text-ivory outline-none focus:border-gold [color-scheme:dark] [&>option]:bg-noir';
const lb = 'block text-[10px] tracking-[0.22em] text-bone/50 uppercase';

function HourSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const x = useConsoleExtras();
  const hours = x?.settings.hours ?? ['11:00', '13:00', '15:00', '17:00', '19:00'];
  return (
    <select className={inp} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Hour…</option>
      {hours.map((h) => (
        <option key={h} value={h}>
          {fmtHour(h)}
        </option>
      ))}
    </select>
  );
}

function WalkInForm({ onDone }: { onDone: () => void }) {
  const pieces = getPieces();
  const [f, setF] = useState({ date: '', time: '', purpose: 'consultation' as Purpose, pieceSlug: '', name: '', phone: '', email: '', note: '', depositPaid: false });
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Card className="p-6">
      <p className="font-display text-[22px] text-ivory">Book a fitting at the atelier</p>
      <p className="mt-1 text-[13px] text-bone/50">For a walk-in or a booking taken by phone. The client gets an SMS confirmation.</p>
      <form
        className="mt-5 grid gap-5 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const phone = normPhone(f.phone);
          if (!phone) return;
          bookWalkIn({ ...f, phone, pieceSlug: f.pieceSlug || undefined }).then(onDone, () => {});
        }}
      >
        <label className={lb}>
          Date
          <input type="date" required className={inp} value={f.date} onChange={(e) => set('date', e.target.value)} />
        </label>
        <label className={lb}>
          Hour
          <HourSelect value={f.time} onChange={(v) => set('time', v)} />
        </label>
        <label className={lb}>
          Purpose
          <select className={inp} value={f.purpose} onChange={(e) => set('purpose', e.target.value)}>
            {Object.entries(purposeLabel).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className={lb}>
          Piece
          <select className={inp} value={f.pieceSlug} onChange={(e) => set('pieceSlug', e.target.value)}>
            <option value="">—</option>
            {pieces.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className={lb}>
          Name
          <input required className={inp} value={f.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className={lb}>
          Mobile
          <input required className={inp} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXX XXXXXX" />
        </label>
        <label className={lb}>
          Email
          <input className={inp} value={f.email} onChange={(e) => set('email', e.target.value)} />
        </label>
        <label className={lb}>
          Note
          <input className={inp} value={f.note} onChange={(e) => set('note', e.target.value)} />
        </label>
        {f.purpose === 'new-piece' && (
          <label className="flex items-center gap-2 text-[13px] text-ivory md:col-span-4">
            <input type="checkbox" checked={f.depositPaid} onChange={(e) => set('depositPaid', e.target.checked)} className="h-4 w-4 accent-[#dcaf6a]" />
            Deposit paid in cash at the atelier
          </label>
        )}
        <div className="md:col-span-4">
          <SmallBtn tone="gold">Book it</SmallBtn>
        </div>
      </form>
    </Card>
  );
}

function MoveForm({ id, date, time, onDone }: { id: string; date: string; time: string; onDone: () => void }) {
  const [d, setD] = useState(date);
  const [t, setT] = useState(time);
  return (
    <form
      className="grid gap-4 border-t border-ivory/10 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end lg:col-span-4"
      onSubmit={(e) => {
        e.preventDefault();
        updateBooking(id, { date: d, time: t }).then(onDone, () => {});
      }}
    >
      <label className={lb}>
        New date
        <input type="date" className={inp} value={d} onChange={(e) => setD(e.target.value)} />
      </label>
      <label className={lb}>
        New hour
        <HourSelect value={t} onChange={setT} />
      </label>
      <SmallBtn tone="gold">Move it</SmallBtn>
    </form>
  );
}

/* ── Clients: add by hand, edit contact details ─────────────────────── */

function AddClient({ onDone }: { onDone: (id?: string) => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', notes: '' });
  return (
    <Card className="p-6">
      <p className="font-display text-[22px] text-ivory">Add a client</p>
      <form
        className="mt-5 grid gap-5 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const phone = normPhone(f.phone);
          if (!phone) return;
          addClient({ ...f, phone }).then((r) => onDone(r._id), () => {});
        }}
      >
        <label className={lb}>
          Name
          <input required className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label className={lb}>
          Mobile
          <input required className={inp} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXX XXXXXX" />
        </label>
        <label className={lb}>
          Email
          <input className={inp} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <div className="md:col-span-3">
          <SmallBtn tone="gold">Add</SmallBtn>
        </div>
      </form>
    </Card>
  );
}

function EditClient({ c, onDone }: { c: { id: string; name: string; phone: string; email: string }; onDone: () => void }) {
  const [f, setF] = useState({ name: c.name, phone: c.phone, email: c.email });
  return (
    <form
      className="mt-6 grid gap-5 border-t border-ivory/10 pt-6 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        editClient(c.id, f).then(onDone, () => {});
      }}
    >
      <label className={lb}>
        Name
        <input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <label className={lb}>
        Mobile
        <input className={inp} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </label>
      <label className={lb}>
        Email
        <input className={inp} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </label>
      <SmallBtn tone="gold">Save</SmallBtn>
    </form>
  );
}
