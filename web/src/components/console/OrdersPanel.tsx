'use client';

import { useMemo, useState } from 'react';
import { bdt } from '@/lib/pieces';
import { fmtDate, useDB, type Order, type OrderStatus } from '@/lib/store';
import { addOrderNote, API, bookCourier, cancelOrder, exportHref, setOrderStatus } from '@/lib/actions';
import { Card, H, Pill, SmallBtn } from './ui';

const STATUS: [OrderStatus, string][] = [
  ['awaiting-payment', 'Awaiting payment'],
  ['confirmed', 'Confirmed'],
  ['packed', 'Pressed & boxed'],
  ['shipped', 'With the courier'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];
const label = (s: OrderStatus) => STATUS.find(([k]) => k === s)?.[1] ?? s;
const tone = (s: OrderStatus) => (s === 'delivered' ? 'ok' : s === 'cancelled' ? 'muted' : s === 'awaiting-payment' ? 'warn' : 'gold');
const payLabel = (o: Order) => `${o.payment === 'cod' ? 'COD' : o.payment === 'bkash' ? 'bKash' : 'Card'} · ${o.paid ? 'paid' : 'unpaid'}`;
const stamp = (ms: number) => fmtDate(ms, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function OrdersPanel() {
  const orders = useDB((d) => d.orders);
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(() => Object.fromEntries(STATUS.map(([k]) => [k, orders.filter((o) => o.status === k).length])), [orders]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter((o) => {
      const day = new Date(o.createdAt + 6 * 3600_000).toISOString().slice(0, 10);
      return (tab === 'all' || o.status === tab) && (!from || day >= from) && (!to || day <= to) && (!t || [o.id, o.customer.name, o.customer.phone, ...o.items.map((i) => i.name)].join(' ').toLowerCase().includes(t));
    });
  }, [orders, tab, q, from, to]);
  const total = list.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const current = orders.find((o) => o.id === open);

  return (
    <div className="space-y-6">
      <H aside={API ? <a href={exportHref('orders')} className="border border-ivory/20 px-3.5 py-2 text-[10px] tracking-[0.2em] text-bone/80 uppercase hover:border-gold hover:text-gold">Export Excel</a> : undefined}>Orders</H>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {[['all', 'All'] as const, ...STATUS].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`shrink-0 px-3.5 py-2 text-[10px] tracking-[0.18em] uppercase ${tab === k ? 'bg-ivory text-noir' : 'border border-ivory/15 text-bone/60 hover:text-ivory'}`}>
            {l} <span className="opacity-60">{k === 'all' ? orders.length : counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, client, mobile or piece" className="border-b border-ivory/20 bg-transparent pb-2 text-[14px] text-ivory outline-none placeholder:text-bone/35 focus:border-gold" />
        <label className="flex items-center gap-2 text-[11px] text-bone/50">
          From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border-b border-ivory/20 bg-transparent pb-1 text-[13px] text-ivory [color-scheme:dark] outline-none" />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-bone/50">
          To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border-b border-ivory/20 bg-transparent pb-1 text-[13px] text-ivory [color-scheme:dark] outline-none" />
        </label>
      </div>
      <p className="text-[13px] text-bone/50">
        {list.length} {list.length === 1 ? 'order' : 'orders'} · <span className="text-champagne">{bdt(total)}</span> excluding cancelled
      </p>

      <div className="space-y-3">
        {list.map((o) => (
          <button key={o.id} onClick={() => setOpen(o.id)} className="block w-full text-left">
            <Card className="grid gap-3 px-5 py-4 transition-colors hover:border-gold/40 md:grid-cols-[1.1fr_1.3fr_1.6fr_auto_auto] md:items-center">
              <div>
                <p className="text-[14px] text-ivory">{o.id}</p>
                <p className="text-[12px] text-bone/45">{stamp(o.createdAt)}</p>
              </div>
              <div>
                <p className="text-[14px] text-ivory">{o.customer.name}</p>
                <p className="text-[12px] text-bone/45">{o.customer.phone}</p>
              </div>
              <p className="text-[13px] text-bone/70">{o.items.map((i) => `${i.name} · ${i.size}`).join(', ')}</p>
              <p className="text-[14px] whitespace-nowrap text-champagne">{bdt(o.total)}</p>
              <div className="flex flex-wrap gap-2">
                <Pill tone={o.paid ? 'ok' : 'muted'}>{payLabel(o)}</Pill>
                <Pill tone={tone(o.status)}>{label(o.status)}</Pill>
              </div>
            </Card>
          </button>
        ))}
        {list.length === 0 && <Card className="px-6 py-12 text-center text-bone/50">No orders match.</Card>}
      </div>

      {current && <OrderDrawer o={current} onClose={() => setOpen(null)} />}
    </div>
  );
}

function OrderDrawer({ o, onClose }: { o: Order; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const steps = [...(o.timeline ?? [])].sort((a, b) => b.at - a.at);
  const closed = o.status === 'cancelled' || o.status === 'delivered';

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-noir/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Order ${o.id}`}>
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-ivory/10 bg-graphite p-6 md:p-10" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.26em] text-bone/45 uppercase">Order</p>
            <p className="mt-2 font-display text-[30px] leading-none text-ivory">{o.id}</p>
            <p className="mt-2 text-[13px] text-bone/50">{stamp(o.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-[22px] text-bone/50 hover:text-ivory" aria-label="Close">
            ×
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Pill tone={tone(o.status)}>{label(o.status)}</Pill>
          <Pill tone={o.paid ? 'ok' : 'muted'}>{payLabel(o)}</Pill>
          {o.courier && <Pill>{`${o.courier.name} · ${o.courier.tracking}`}</Pill>}
          {o.refund && <Pill tone="warn">{`Refund ${bdt(o.refund.amount)}`}</Pill>}
        </div>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] tracking-[0.24em] text-bone/45 uppercase">Client</p>
            <p className="mt-2 text-[15px] text-ivory">{o.customer.name}</p>
            <p className="text-[13px] text-bone/60">
              <a href={`tel:+88${o.customer.phone}`} className="hover:text-gold">
                {o.customer.phone}
              </a>
              {o.customer.email && <> · {o.customer.email}</>}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.24em] text-bone/45 uppercase">Delivery</p>
            <p className="mt-2 text-[14px] text-bone/80">{o.delivery === 'collect' ? 'Collect from the atelier' : `${o.customer.address}, ${o.customer.area || o.customer.city}`}</p>
          </div>
        </section>

        <section className="mt-8 border-t border-ivory/10 pt-6">
          {o.items.map((i) => (
            <div key={i.slug + i.size} className="flex justify-between gap-4 py-1.5 text-[14px]">
              <span className="text-ivory">
                {i.name} · size {i.size} <span className="text-bone/45">Nº {i.editionNo || '—'}</span>
              </span>
              <span className="text-champagne">{bdt(i.price)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-ivory/10 pt-3 text-[15px]">
            <span className="text-bone/60">Total · delivery complimentary</span>
            <span className="text-champagne">{bdt(o.total)}</span>
          </div>
        </section>

        {!closed && (
          <section className="mt-8 space-y-4">
            <p className="text-[10px] tracking-[0.24em] text-bone/45 uppercase">Next step</p>
            <div className="flex flex-wrap gap-2">
              {(['confirmed', 'packed', 'shipped', 'delivered'] as OrderStatus[]).map((s) => (
                <SmallBtn key={s} tone={o.status === s ? 'gold' : 'ghost'} disabled={o.status === 'awaiting-payment' || o.status === s} onClick={() => setOrderStatus(o.id, s)}>
                  {label(s)}
                </SmallBtn>
              ))}
            </div>
            {API && o.status !== 'awaiting-payment' && !o.courier && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-bone/50">Book a courier:</span>
                {(['Steadfast', 'Pathao', 'RedX', 'Atelier'] as const).map((c) => (
                  <SmallBtn key={c} onClick={() => bookCourier(o.id, c).catch(() => {})}>
                    {c === 'Atelier' ? 'Our own courier' : c}
                  </SmallBtn>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mt-8 flex flex-wrap gap-2">
          <SmallBtn onClick={() => printInvoice(o)}>Print invoice</SmallBtn>
          {API && !closed && (
            <SmallBtn onClick={() => setCancelling((v) => !v)}>{cancelling ? 'Keep the order' : 'Cancel order…'}</SmallBtn>
          )}
        </section>
        {cancelling && (
          <div className="mt-4 border border-[#c2566a]/40 p-4">
            <label className="block text-[12px] text-bone/60">
              Reason (the client is told by SMS)
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full border-b border-ivory/20 bg-transparent pb-1.5 text-[14px] text-ivory outline-none focus:border-gold" />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <SmallBtn tone="gold" disabled={reason.trim().length < 3} onClick={() => cancelOrder(o.id, reason, true).then(() => setCancelling(false), () => {})}>
                {o.paid ? `Cancel and refund ${bdt(o.total)}` : 'Cancel the order'}
              </SmallBtn>
            </div>
            <p className="mt-3 text-[12px] text-bone/45">The pieces go back to their editions. Their numbers are retired, never reused.</p>
          </div>
        )}

        {API && (
          <section className="mt-10">
            <p className="text-[10px] tracking-[0.24em] text-bone/45 uppercase">Notes for the atelier</p>
            <ul className="mt-3 space-y-3">
              {(o.notes ?? []).map((n) => (
                <li key={n.at} className="border-l border-gold/40 pl-3 text-[14px] text-bone/80">
                  {n.text}
                  <span className="block text-[11px] text-bone/40">
                    {n.by} · {stamp(n.at)}
                  </span>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) addOrderNote(o.id, note.trim()).then(() => setNote(''), () => {});
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="min-w-0 flex-1 border-b border-ivory/20 bg-transparent pb-1.5 text-[14px] text-ivory outline-none placeholder:text-bone/35 focus:border-gold" />
              <SmallBtn tone="gold">Add</SmallBtn>
            </form>
          </section>
        )}

        {steps.length > 0 && (
          <section className="mt-10">
            <p className="text-[10px] tracking-[0.24em] text-bone/45 uppercase">Timeline</p>
            <ol className="mt-4 space-y-4 border-l border-ivory/15 pl-5">
              {steps.map((s, i) => (
                <li key={s.at + '-' + i} className="relative">
                  <span className="absolute top-1.5 -left-[23.5px] h-2 w-2 rounded-full bg-gold" />
                  <p className="text-[14px] text-ivory">{s.text}</p>
                  <p className="text-[11px] text-bone/40">
                    {s.by} · {stamp(s.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}

/** A clean A5 invoice in a new window, printed by the browser */
function printInvoice(o: Order) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  w.document.write(`<!doctype html><html><head><title>Invoice ${esc(o.id)}</title><style>
    body{font-family:Georgia,serif;color:#111;margin:48px;font-size:14px}h1{font-weight:400;letter-spacing:.3em;font-size:22px;margin:0}
    .muted{color:#777}table{width:100%;border-collapse:collapse;margin-top:28px}td,th{padding:10px 0;border-bottom:1px solid #ddd;text-align:left}
    th{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#777;font-weight:400}.r{text-align:right}.tot td{border:0;font-size:16px}
    @media print{button{display:none}}</style></head><body>
    <h1>NIROLAX</h1><p class="muted">House 21, Road 113 · Gulshan 2, Dhaka 1212 · atelier@nirolax.com</p>
    <p style="margin-top:32px"><strong>Invoice ${esc(o.id)}</strong><br><span class="muted">${new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
    <p>${esc(o.customer.name)}<br>${esc(o.customer.phone)}${o.customer.email ? '<br>' + esc(o.customer.email) : ''}<br>${esc(o.delivery === 'collect' ? 'Collect from the atelier' : `${o.customer.address}, ${o.customer.area || o.customer.city}`)}</p>
    <table><tr><th>Piece</th><th>Size</th><th>Edition</th><th class="r">Price</th></tr>
    ${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.size)}</td><td>${i.editionNo ? 'Nº ' + String(i.editionNo).padStart(2, '0') : '—'}</td><td class="r">BDT ${i.price.toLocaleString('en-IN')}</td></tr>`).join('')}
    <tr class="tot"><td colspan="3">Total (VAT included · delivery complimentary)</td><td class="r">BDT ${o.total.toLocaleString('en-IN')}</td></tr></table>
    <p class="muted" style="margin-top:28px">${o.paid ? 'Paid' : 'To be paid on delivery'} · ${o.payment === 'cod' ? 'Cash on delivery' : o.payment === 'bkash' ? 'bKash' : 'Card'}</p>
    <button onclick="print()" style="margin-top:24px;padding:10px 18px">Print</button></body></html>`);
  w.document.close();
}
