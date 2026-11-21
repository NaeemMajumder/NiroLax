'use client';

import { useEffect, useMemo, useState } from 'react';
import { bdt } from '@/lib/pieces';
import { fmtDate, useDB, type Role, type StaffMe } from '@/lib/store';
import {
  addStaff,
  API,
  backupHref,
  changeStaffPassword,
  editStaff,
  exportHref,
  fetchAudit,
  fetchOutbox,
  removeStaff,
  resetStaffPassword,
  restoreBackup,
  saveSettings,
  useConsoleExtras,
  type AuditEntry,
  type OutboxEntry,
  type SiteSettings,
} from '@/lib/actions';
import { usePieces } from '@/lib/catalogue';
import { notify } from '@/lib/toast';
import { Card, H, Pill, SmallBtn } from './ui';
import { ServerOnly } from './CataloguePanel';

const field = 'mt-1.5 w-full border-b border-ivory/20 bg-transparent pb-1.5 text-[15px] text-ivory outline-none focus:border-gold';
const lab = 'block text-[10px] tracking-[0.22em] text-bone/50 uppercase';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', manager: 'Manager', tailor: 'Tailor', orders: 'Orders', content: 'Content' };
const ROLE_HINT: Record<Role, string> = {
  owner: 'Everything, including staff and backups',
  manager: 'Everything except staff accounts and backups',
  tailor: 'Fittings, production and measure sheets',
  orders: 'Orders, fittings, clients and messages',
  content: 'Catalogue, editions and messages',
};
const stamp = (ms: number) => fmtDate(ms, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/* ── Settings ───────────────────────────────────────────────────────── */

export function SettingsPanel() {
  const x = useConsoleExtras();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newHour, setNewHour] = useState('');
  useEffect(() => {
    if (x?.settings && !s) setS(x.settings);
  }, [x, s]);
  if (!API || !x) return <ServerOnly what="Settings" />;
  if (!s) return null;
  const at = <K extends keyof SiteSettings['atelier']>(k: K, v: string) => setS({ ...s, atelier: { ...s.atelier, [k]: v } });
  const so = (k: keyof SiteSettings['social'], v: string) => setS({ ...s, social: { ...s.social, [k]: v.trim() } });
  const nt = <K extends keyof SiteSettings['notify']>(k: K, v: SiteSettings['notify'][K]) => setS({ ...s, notify: { ...s.notify, [k]: v } });

  return (
    <div className="space-y-6">
      <H aside={<SmallBtn tone="gold" onClick={() => saveSettings(s).catch(() => {})}>Save settings</SmallBtn>}>Settings</H>

      <Card className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <p className="font-display text-[22px] text-ivory md:col-span-2">The atelier</p>
        <label className={lab}>
          Name
          <input className={field} value={s.atelier.name} onChange={(e) => at('name', e.target.value)} />
        </label>
        <label className={lab}>
          Email
          <input className={field} value={s.atelier.email} onChange={(e) => at('email', e.target.value)} />
        </label>
        <label className={lab}>
          Address, line 1
          <input className={field} value={s.atelier.address1} onChange={(e) => at('address1', e.target.value)} />
        </label>
        <label className={lab}>
          Address, line 2
          <input className={field} value={s.atelier.address2} onChange={(e) => at('address2', e.target.value)} />
        </label>
        <label className={lab}>
          Telephone (as shown)
          <input className={field} value={s.atelier.phone} onChange={(e) => at('phone', e.target.value)} />
        </label>
        <label className={lab}>
          WhatsApp (digits, with 880)
          <input className={field} value={s.atelier.whatsapp} onChange={(e) => at('whatsapp', e.target.value)} />
        </label>
      </Card>

      <Card className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <div className="md:col-span-2">
          <p className="font-display text-[22px] text-ivory">Social</p>
          <p className="mt-1 text-[13px] text-bone/50">Full links, shown in the footer. Leave one empty to hide it.</p>
        </div>
        {(['instagram', 'facebook', 'youtube', 'pinterest'] as const).map((k) => (
          <label key={k} className={lab}>
            {k[0].toUpperCase() + k.slice(1)}
            <input className={field} type="url" placeholder={`https://www.${k}.com/…`} value={s.social?.[k] ?? ''} onChange={(e) => so(k, e.target.value)} />
          </label>
        ))}
      </Card>

      <Card className="space-y-6 p-6 md:p-8">
        <p className="font-display text-[22px] text-ivory">Appointments</p>
        <div className="grid gap-6 md:grid-cols-3">
          <label className={lab}>
            Deposit for a new piece (BDT)
            <input type="number" className={field} value={s.deposit} onChange={(e) => setS({ ...s, deposit: Number(e.target.value) || 0 })} />
          </label>
          <label className={lab}>
            Days ahead clients can book
            <input type="number" className={field} value={s.bookingDaysAhead} onChange={(e) => setS({ ...s, bookingDaysAhead: Number(e.target.value) || 60 })} />
          </label>
        </div>
        <div>
          <p className={lab}>Hours offered</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.hours.map((h) => (
              <button key={h} onClick={() => setS({ ...s, hours: s.hours.filter((x) => x !== h) })} className="border border-gold/50 px-3 py-1.5 text-[13px] text-gold hover:line-through" title="Remove">
                {h}
              </button>
            ))}
            <input type="time" value={newHour} onChange={(e) => setNewHour(e.target.value)} className="border-b border-ivory/20 bg-transparent text-[13px] text-ivory [color-scheme:dark]" />
            <SmallBtn onClick={() => newHour && setS({ ...s, hours: [...new Set([...s.hours, newHour])].sort() })}>Add hour</SmallBtn>
          </div>
        </div>
        <div>
          <p className={lab}>Closed every</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAYS.map((d, i) => {
              const on = s.closedWeekdays.includes(i);
              return (
                <button key={d} onClick={() => setS({ ...s, closedWeekdays: on ? s.closedWeekdays.filter((x) => x !== i) : [...s.closedWeekdays, i] })} className={`px-3 py-1.5 text-[12px] ${on ? 'bg-ivory text-noir' : 'border border-ivory/15 text-bone/60'}`}>
                  {d.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className={lab}>Closed on these dates (holidays, travel)</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.closedDates.map((d) => (
              <button key={d} onClick={() => setS({ ...s, closedDates: s.closedDates.filter((x) => x !== d) })} className="border border-ivory/20 px-3 py-1.5 text-[12px] text-bone/80 hover:line-through">
                {fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' })} ×
              </button>
            ))}
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="border-b border-ivory/20 bg-transparent text-[13px] text-ivory [color-scheme:dark]" />
            <SmallBtn onClick={() => newDate && setS({ ...s, closedDates: [...new Set([...s.closedDates, newDate])].sort() })}>Close this day</SmallBtn>
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-6 md:p-8">
        <p className="font-display text-[22px] text-ivory">Tell the atelier</p>
        <p className="text-[13px] text-bone/50">An SMS and an email to the atelier when something comes in. Until SMS and email keys are set, they appear in Messages → Outbox.</p>
        <div className="grid gap-6 md:grid-cols-2">
          <label className={lab}>
            Mobile
            <input className={field} value={s.notify.phone} onChange={(e) => nt('phone', e.target.value)} />
          </label>
          <label className={lab}>
            Email
            <input className={field} value={s.notify.email} onChange={(e) => nt('email', e.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap gap-6 text-[14px] text-ivory">
          {(
            [
              ['onOrder', 'New orders'],
              ['onBooking', 'New fittings'],
              ['onMessage', 'Contact notes'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={s.notify[k]} onChange={(e) => nt(k, e.target.checked)} className="h-4 w-4 accent-[#dcaf6a]" />
              {l}
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Staff ──────────────────────────────────────────────────────────── */

export function StaffPanel() {
  const x = useConsoleExtras();
  const me = useDB((d) => d.staff);
  const [form, setForm] = useState({ name: '', email: '', role: 'tailor' as Role, password: '' });
  const [pw, setPw] = useState<{ id: string; v: string } | null>(null);
  if (!API || !x) return <ServerOnly what="Staff accounts" />;

  return (
    <div className="space-y-6">
      <H>Staff &amp; roles</H>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <Card key={r} className="p-4">
            <p className="text-[11px] tracking-[0.2em] text-gold uppercase">{ROLE_LABEL[r]}</p>
            <p className="mt-2 text-[13px] leading-snug text-bone/60">{ROLE_HINT[r]}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {x.staffList.map((s: StaffMe) => (
          <Card key={s._id} className="grid gap-3 p-5 md:grid-cols-[1.3fr_1fr_auto] md:items-center">
            <div>
              <p className="text-[15px] text-ivory">
                {s.name} {s._id === me?._id && <span className="text-[11px] text-bone/45">(you)</span>}
              </p>
              <p className="text-[12px] text-bone/45">
                {s.email} · last in {s.lastLoginAt ? stamp(s.lastLoginAt) : 'never'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={s.role} onChange={(e) => editStaff(s._id, { role: e.target.value as Role }).catch(() => {})} className="border-b border-ivory/20 bg-transparent pb-1 text-[13px] text-ivory outline-none [&>option]:bg-noir">
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <Pill tone={s.active ? 'ok' : 'muted'}>{s.active ? 'Active' : 'Switched off'}</Pill>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {s._id !== me?._id && <SmallBtn onClick={() => editStaff(s._id, { active: !s.active }).catch(() => {})}>{s.active ? 'Switch off' : 'Switch on'}</SmallBtn>}
              <SmallBtn onClick={() => setPw(pw?.id === s._id ? null : { id: s._id, v: '' })}>Reset password</SmallBtn>
              {s._id !== me?._id && <SmallBtn onClick={() => removeStaff(s._id).catch(() => {})}>Remove</SmallBtn>}
            </div>
            {pw?.id === s._id && (
              <form
                className="flex gap-2 md:col-span-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  resetStaffPassword(s._id, pw.v).then(() => setPw(null), () => {});
                }}
              >
                <input type="text" value={pw.v} onChange={(e) => setPw({ id: s._id, v: e.target.value })} placeholder="New password (8+ characters)" className="min-w-0 flex-1 border-b border-ivory/20 bg-transparent pb-1.5 text-[14px] text-ivory outline-none focus:border-gold" />
                <SmallBtn tone="gold">Set</SmallBtn>
              </form>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6 md:p-8">
        <p className="font-display text-[22px] text-ivory">Add someone</p>
        <form
          className="mt-5 grid gap-5 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            addStaff(form).then(() => setForm({ name: '', email: '', role: 'tailor', password: '' }), () => {});
          }}
        >
          <label className={lab}>
            Name
            <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className={lab}>
            Email
            <input className={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className={lab}>
            Role
            <select className={`${field} [&>option]:bg-noir`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className={lab}>
            First password
            <input className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <div className="md:col-span-4">
            <SmallBtn tone="gold">Add to the atelier</SmallBtn>
          </div>
        </form>
      </Card>
    </div>
  );
}

/** Any staff member: change their own password */
export function MyPassword() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  if (!API) return null;
  return (
    <Card className="p-6">
      <p className="font-display text-[20px] text-ivory">Your password</p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          changeStaffPassword(cur, next).then(
            () => {
              notify.ok('Password changed', 'Other devices are signed out.');
              setCur('');
              setNext('');
            },
            (x: Error) => notify.err(x.message),
          );
        }}
      >
        <label className={lab}>
          Current
          <input type="password" className={field} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </label>
        <label className={lab}>
          New (8+, a letter and a number)
          <input type="password" className={field} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </label>
        <SmallBtn tone="gold">Change</SmallBtn>
      </form>
    </Card>
  );
}

/* ── Activity (audit log) ───────────────────────────────────────────── */

export function ActivityPanel() {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    fetchAudit().then(setRows, () => setRows([]));
  }, []);
  if (!API) return <ServerOnly what="The activity log" />;
  const list = (rows ?? []).filter((r) => !q || (r.staffName + r.action + r.target).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <H aside={<a href={exportHref('audit')} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">Export Excel</a>}>Activity</H>
      <p className="text-[14px] text-bone/55">Every change made in the console — who, when, and what it was before and after.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search person, action or reference" className="w-full border-b border-ivory/20 bg-transparent pb-2 text-[14px] text-ivory outline-none placeholder:text-bone/35 focus:border-gold" />
      <Card>
        <ul className="divide-y divide-ivory/10">
          {list.map((r) => (
            <li key={r._id} className="px-5 py-4">
              <button className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left" onClick={() => setOpen(open === r._id ? null : r._id)}>
                <span className="text-[14px] text-ivory">
                  <span className="text-gold">{r.staffName}</span> · {r.action} <span className="text-bone/45">{r.target}</span>
                </span>
                <span className="text-[12px] text-bone/45">{stamp(r.at)}</span>
              </button>
              {open === r._id && (r.before !== undefined || r.after !== undefined) && (
                <div className="mt-3 grid gap-3 text-[11px] md:grid-cols-2">
                  <pre className="max-h-64 overflow-auto bg-noir p-3 whitespace-pre-wrap text-bone/60">{JSON.stringify(r.before ?? null, null, 1)}</pre>
                  <pre className="max-h-64 overflow-auto bg-noir p-3 whitespace-pre-wrap text-champagne/80">{JSON.stringify(r.after ?? null, null, 1)}</pre>
                </div>
              )}
            </li>
          ))}
          {rows && list.length === 0 && <li className="px-5 py-10 text-center text-bone/50">Nothing yet.</li>}
          {!rows && <li className="px-5 py-10 text-center text-bone/50">Loading…</li>}
        </ul>
      </Card>
    </div>
  );
}

/* ── Outbox ─────────────────────────────────────────────────────────── */

export function OutboxList() {
  const [rows, setRows] = useState<OutboxEntry[] | null>(null);
  useEffect(() => {
    fetchOutbox().then(setRows, () => setRows([]));
  }, []);
  if (!API) return null;
  return (
    <div className="space-y-4">
      <p className="text-[14px] text-bone/55">Every SMS and email the site sent (or would send, until gateway keys are set).</p>
      <Card>
        <ul className="divide-y divide-ivory/10">
          {(rows ?? []).map((r) => (
            <li key={r._id} className="grid gap-2 px-5 py-4 md:grid-cols-[150px_1fr_auto]">
              <div className="text-[12px] text-bone/50">
                {stamp(r.at)}
                <br />
                {r.channel.toUpperCase()} · {r.to}
              </div>
              <p className="text-[13px] leading-relaxed whitespace-pre-line text-bone/80">
                {r.subject && <span className="block text-ivory">{r.subject}</span>}
                {r.body}
              </p>
              <Pill tone={r.status === 'sent' ? 'ok' : r.status === 'failed' ? 'warn' : 'muted'}>{r.status === 'logged' ? 'Logged' : r.status}</Pill>
            </li>
          ))}
          {rows?.length === 0 && <li className="px-5 py-10 text-center text-bone/50">Nothing sent yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

/* ── Reports ────────────────────────────────────────────────────────── */

function Bars({ data, money = true }: { data: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-[10px] text-bone/0 transition-colors group-hover:text-bone/70">{money ? bdt(d.value).replace('BDT ', '') : d.value}</span>
          <div className="w-full max-w-10 rounded-t-[4px] bg-gold/80 transition-colors group-hover:bg-gold" style={{ height: `${Math.max(2, (d.value / max) * 120)}px` }} title={`${d.label}: ${money ? bdt(d.value) : d.value}`} />
          <span className="truncate text-[10px] text-bone/45">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportsPanel({ canBackup }: { canBackup: boolean }) {
  const d = useDB((x) => x);
  const pieces = usePieces();
  const [days, setDays] = useState(90);
  const since = Date.now() - days * 86400000;
  const r = useMemo(() => {
    const live = d.orders.filter((o) => o.status !== 'cancelled' && o.createdAt >= since);
    const paid = live.filter((o) => o.paid);
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const deposits = d.bookings.filter((b) => b.deposit && b.createdAt >= since && (b.status === 'confirmed' || b.status === 'attended')).reduce((s, b) => s + b.deposit, 0);
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setMonth(dt.getMonth() - i, 1);
      const key = dt.toISOString().slice(0, 7);
      months.push({ label: dt.toLocaleDateString('en-GB', { month: 'short' }), value: d.orders.filter((o) => o.paid && o.status !== 'cancelled' && new Date(o.createdAt).toISOString().startsWith(key)).reduce((s, o) => s + o.total, 0) });
    }
    const byPiece = pieces
      .map((p) => ({ label: `Nº ${p.no}`, name: p.name, value: live.reduce((s, o) => s + o.items.filter((i) => i.slug === p.slug).length, 0) + d.commissions.filter((c) => c.pieceSlug === p.slug).length }))
      .sort((a, b) => b.value - a.value);
    const pay = (['card', 'bkash', 'cod'] as const).map((m) => ({ label: m === 'cod' ? 'COD' : m === 'bkash' ? 'bKash' : 'Card', value: live.filter((o) => o.payment === m).length }));
    const fittings = d.bookings.filter((b) => b.createdAt >= since);
    return { live, revenue, deposits, months, byPiece, pay, avg: paid.length ? Math.round(revenue / paid.length) : 0, fittings: fittings.length, attended: fittings.filter((b) => b.status === 'attended').length, mtm: d.commissions.reduce((s, c) => s + c.price, 0) };
  }, [d, pieces, since]);

  const kpi = (label: string, value: string, hint?: string) => (
    <Card className="p-5">
      <p className="text-[10px] tracking-[0.22em] text-bone/45 uppercase">{label}</p>
      <p className="mt-2 font-display text-[26px] text-ivory">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-bone/45">{hint}</p>}
    </Card>
  );
  const exp = (k: string, l: string) => (
    <a key={k} href={exportHref(k)} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
      {l}
    </a>
  );

  return (
    <div className="space-y-6">
      <H
        aside={
          <div className="flex gap-1">
            {[30, 90, 365].map((n) => (
              <button key={n} onClick={() => setDays(n)} className={`px-3 py-2 text-[10px] tracking-[0.18em] uppercase ${days === n ? 'bg-ivory text-noir' : 'text-bone/60'}`}>
                {n === 365 ? '1 year' : `${n} days`}
              </button>
            ))}
          </div>
        }
      >
        Reports
      </H>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpi('Paid sales', bdt(r.revenue), `${r.live.length} orders`)}
        {kpi('Average order', bdt(r.avg))}
        {kpi('Deposits taken', bdt(r.deposits), `${r.fittings} fittings booked · ${r.attended} attended`)}
        {kpi('Made-to-measure in hand', bdt(r.mtm), `${d.commissions.length} commissions`)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <p className="text-[10px] tracking-[0.22em] text-bone/45 uppercase">Paid sales, last six months</p>
          <div className="mt-6">
            <Bars data={r.months} />
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-[10px] tracking-[0.22em] text-bone/45 uppercase">How clients pay</p>
          <div className="mt-6">
            <Bars data={r.pay} money={false} />
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <p className="text-[10px] tracking-[0.22em] text-bone/45 uppercase">Pieces sold and commissioned</p>
        <ul className="mt-4 divide-y divide-ivory/10">
          {r.byPiece.map((p) => (
            <li key={p.label} className="flex items-center gap-4 py-2.5 text-[14px]">
              <span className="w-12 text-bone/45">{p.label}</span>
              <span className="min-w-0 flex-1 truncate text-ivory">{p.name}</span>
              <span className="h-1.5 w-32 overflow-hidden bg-ivory/10">
                <span className="block h-full bg-gold" style={{ width: `${Math.min(100, p.value * 20)}%` }} />
              </span>
              <span className="w-6 text-right text-champagne">{p.value}</span>
            </li>
          ))}
        </ul>
      </Card>
      {API && (
        <Card className="space-y-4 p-6">
          <p className="font-display text-[20px] text-ivory">Excel</p>
          <div className="flex flex-wrap gap-2">{[exp('orders', 'Orders'), exp('clients', 'Clients'), exp('bookings', 'Fittings'), exp('pieces', 'Season'), exp('subscribers', 'Letter list')]}</div>
        </Card>
      )}
      {API && canBackup && <Backup />}
    </div>
  );
}

function Backup() {
  const [busy, setBusy] = useState(false);
  return (
    <Card className="space-y-4 p-6">
      <p className="font-display text-[20px] text-ivory">Backup &amp; restore</p>
      <p className="text-[13px] text-bone/50">The whole atelier in one file. Restoring puts back orders, clients, fittings, pieces and settings — staff accounts are never overwritten.</p>
      <div className="flex flex-wrap items-center gap-2">
        <a href={backupHref('json')} className="bg-gold px-3.5 py-2 text-[10px] tracking-[0.2em] text-noir uppercase hover:bg-gold-light">
          Download backup (.json)
        </a>
        <a href={backupHref('xlsx')} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
          Excel copy (.xlsx)
        </a>
        <label className="cursor-pointer border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">
          {busy ? 'Restoring…' : 'Restore from a file'}
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              restoreBackup(f)
                .catch((x: Error) => notify.err(x.message))
                .finally(() => setBusy(false));
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </Card>
  );
}
