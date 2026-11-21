import type { Metadata } from 'next';
import { articles } from '@/lib/journal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Lnk } from '@/components/ui/Lnk';
import { asset } from '@/lib/asset';

export const metadata: Metadata = { alternates: { canonical: '/journal' }, title: 'Journal', description: 'Notes from the atelier: craft, fittings and the house.' };

export default function JournalPage() {
  const [lead, ...rest] = articles;
  return (
    <>
      <PageHeader kicker="Journal" title={<>Notes from <em className="text-champagne">the table.</em></>} dek="Short pieces on how things are made here, and why." />
      <section className="bg-noir pb-28 md:pb-40">
        <div className="mx-auto max-w-[1440px] px-5 md:px-[6vw]">
          <Lnk href={`/journal/${lead.slug}`} data-cursor="Read" className="group grid gap-8 border-t border-ivory/10 pt-12 md:grid-cols-2 md:gap-[5vw]">
            <div data-reveal="image" className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(lead.cover)} alt={lead.coverAlt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-(--ease-luxe) group-hover:scale-[1.03]" />
            </div>
            <div className="self-center">
              <p className="text-[11px] tracking-[0.24em] text-gold uppercase">
                {lead.kicker} · {lead.minutes} min
              </p>
              <h2 className="mt-4 font-display text-[clamp(34px,3.6vw,56px)] leading-[1.06] text-ivory group-hover:text-champagne">{lead.title}</h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-bone/60">{lead.dek}</p>
              <p className="mt-6 text-[12px] text-bone/60">{lead.date}</p>
            </div>
          </Lnk>
          <ul className="mt-20 grid gap-12 md:grid-cols-2 md:gap-8">
            {rest.map((a) => (
              <li key={a.slug} data-reveal="fade">
                <Lnk href={`/journal/${a.slug}`} data-cursor="Read" className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset(a.cover)} alt={a.coverAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-(--ease-luxe) group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-6 text-[11px] tracking-[0.24em] text-gold uppercase">
                    {a.kicker} · {a.minutes} min
                  </p>
                  <h2 className="mt-3 font-display text-[30px] leading-tight text-ivory group-hover:text-champagne">{a.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-bone/60">{a.dek}</p>
                </Lnk>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
