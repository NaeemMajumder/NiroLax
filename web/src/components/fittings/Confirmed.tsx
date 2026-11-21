'use client';
import { useSite } from '@/lib/catalogue';

import { useSearchParams } from 'next/navigation';
import { usePieces } from '@/lib/catalogue';
import { fmtHour, useDB } from '@/lib/store';
import { useLinked } from '@/lib/actions';
import { MARK } from '@/lib/logo-paths';
import { Lnk } from '@/components/ui/Lnk';
import { btnInk } from '@/components/ui/Form';

/** The invitation the client receives once the hour is confirmed */
export function Confirmed() {
  const site = useSite();
  const pieces = usePieces();
  const q = useSearchParams();
  const id = q.get('id');
  const loading = useLinked('booking', id, q.get('key'));
  const b = useDB((d) => d.bookings.find((x) => x.id === id));
  if (loading) return <p className="py-48 text-center text-[13px] tracking-[0.3em] text-noir/60 uppercase">One moment…</p>;
  if (!b) return <p className="py-48 text-center text-noir/60">We could not find that appointment.</p>;
  const p = b.pieceSlug ? pieces.find((x) => x.slug === b.pieceSlug) : undefined;
  const when = new Date(b.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const what = b.purpose === 'new-piece' ? `your first fitting${p ? ` for ${p.name}` : ''}` : b.purpose === 'fitting' ? `a fitting${p ? ` for ${p.name}` : ''}` : b.purpose === 'alteration' ? 'an alteration' : 'a conversation about cloth';
  return (
    <div className="mx-auto max-w-xl px-5 pt-36 pb-28 md:pt-44">
      <div className="relative animate-[invite_1.2s_var(--ease-luxe)_both] bg-ivory p-2 text-noir shadow-[0_40px_80px_-30px_rgba(11,11,12,0.5)]">
        <div className="relative border border-gold/50 px-6 py-12 text-center md:px-12">
          <div className="pointer-events-none absolute inset-1.5 border border-gold/25" />
          <svg viewBox={MARK.viewBox} className="mx-auto h-9 w-auto" aria-hidden>
            <path d={MARK.paths[0]} fill="#A9824A" />
          </svg>
          <p className="mt-8 text-[10px] tracking-[0.3em] text-antique uppercase">You are expected</p>
          <p className="mt-8 font-hand text-[30px] leading-snug text-noir/85 md:text-[36px]">Dear {b.name.split(' ')[0]},</p>
          <p className="mx-auto mt-6 max-w-sm font-display text-[24px] leading-snug md:text-[28px]">
            The atelier will expect you on {when}, at {fmtHour(b.time)}, for {what}.
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-gold/60" />
          <p className="mx-auto mt-8 max-w-xs text-[14px] leading-relaxed text-stone">
            Abdul Karim has set the hour aside. A confirmation follows by SMS to {b.phone}.
            {b.deposit ? ' Your deposit is received.' : ''}
          </p>
          <p className="mt-6 text-[12px] tracking-[0.12em] text-stone">{site.atelier.address1} · {site.atelier.address2}</p>
          <p className="mt-2 text-[11px] text-stone/70">Reference {b.id}</p>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Lnk href="/portal" className={btnInk}>
          See it in your portal
        </Lnk>
        <Lnk href="/season" className="inline-flex items-center px-6 text-[11px] tracking-[0.26em] text-antique uppercase hover:underline">
          Back to the season
        </Lnk>
      </div>
    </div>
  );
}
