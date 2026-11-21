import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactForm } from '@/components/contact/ContactForm';
import { Lnk } from '@/components/ui/Lnk';
import { getPublicSettings } from '@/lib/catalogue.server';
import { openDays } from '@/lib/hours';

export const metadata: Metadata = { alternates: { canonical: '/contact' },
  title: 'Contact & visit',
  description: 'The Nirolax atelier, House 21, Road 113, Gulshan 2, Dhaka. Saturday to Thursday, 11 am to 8 pm, by appointment.',
};


/** A drawn street plan of the block — no third-party map script */
function Plan() {
  return (
    <svg viewBox="0 0 600 420" className="h-full w-full" role="img" aria-label="Plan of Gulshan 2 showing the atelier on Road 113">
      <rect width="600" height="420" fill="#141415" />
      <g stroke="#2a2a2c" strokeWidth="18" fill="none" strokeLinecap="square">
        <path d="M-10 120 H610" />
        <path d="M-10 300 H610" />
        <path d="M150 -10 V430" />
        <path d="M420 -10 V430" />
      </g>
      <g stroke="#3a3a3d" strokeWidth="34" fill="none">
        <path d="M-10 210 C 160 200, 300 230, 610 205" />
      </g>
      <g stroke="#1f2a24" strokeWidth="0" fill="#1c2420">
        <ellipse cx="520" cy="360" rx="70" ry="40" />
      </g>
      <g fill="#6f6a60" fontFamily="Jost, sans-serif" fontSize="11" letterSpacing="2">
        <text x="20" y="112">ROAD 113</text>
        <text x="20" y="292">ROAD 117</text>
        <text x="430" y="200">GULSHAN AVENUE</text>
        <text x="458" y="364">GULSHAN LAKE</text>
        <text x="158" y="404" transform="rotate(-90 158 404)">ROAD 104</text>
      </g>
      <g transform="translate(286 120)">
        <circle r="34" fill="#DCAF6A" opacity="0.12" />
        <circle r="18" fill="#DCAF6A" opacity="0.22" />
        <path d="M0 -26 C 13 -26 20 -17 20 -7 C 20 7 0 26 0 26 C 0 26 -20 7 -20 -7 C -20 -17 -13 -26 0 -26 Z" fill="#DCAF6A" transform="translate(0 -18)" />
        <circle cy="-25" r="6" fill="#0b0b0c" />
      </g>
      <text x="286" y="160" textAnchor="middle" fill="#F2EDE4" fontFamily="'Bodoni Moda', serif" fontSize="17">Nirolax, House 21</text>
    </svg>
  );
}

export default async function ContactPage() {
  const site = await getPublicSettings();
  const a = site.atelier;
  const MAP = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.address1}, ${a.address2}`)}`;
  const WHATSAPP = `https://wa.me/${a.whatsapp}?text=Hello%20Nirolax`;
  const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmt = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return `${((hh + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${hh < 12 ? 'am' : 'pm'}`;
  };
  const hours = [
    [openDays(site.closedWeekdays), `${fmt(site.hours[0])} – ${fmt(String(Number(site.hours[site.hours.length - 1].slice(0, 2)) + 1).padStart(2, '0') + ':00')}`],
    ...site.closedWeekdays.map((d) => [DAY[d], 'Closed']),
    ['Public holidays', 'By arrangement'],
  ];
  return (
    <>
      <PageHeader kicker="Contact & visit" title={<>Come and see <em className="text-champagne">the cloth.</em></>} dek="The atelier is a house in Gulshan 2. Visits are by appointment, so there is always a tailor free to sit with you." />

      <section data-tone="light" className="bg-ivory text-noir">
        <div className="mx-auto grid max-w-[1440px] gap-16 px-5 py-16 md:grid-cols-2 md:gap-[6vw] md:px-[6vw] md:py-28">
          <div>
            <a href={MAP} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[10/7] overflow-hidden" aria-label="Open the atelier in Google Maps">
              <Plan />
              <span className="absolute right-4 bottom-4 bg-ivory/95 px-4 py-2.5 text-[10px] tracking-[0.24em] text-noir uppercase transition-colors group-hover:bg-gold">
                Open in Google Maps ↗
              </span>
            </a>

            <dl className="mt-12 grid gap-10 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] tracking-[0.26em] text-stone uppercase">The atelier</dt>
                <dd className="mt-3 text-[16px] leading-[1.8]">
                  {a.address1}
                  <br />
                  {a.address2}
                  <br />
                  <span className="text-stone">Parking for two cars in front</span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.26em] text-stone uppercase">Hours</dt>
                <dd className="mt-3 space-y-1.5 text-[15px]">
                  {hours.map(([d, h]) => (
                    <p key={d} className="flex justify-between gap-4">
                      <span>{d}</span>
                      <span className="text-stone">{h}</span>
                    </p>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.26em] text-stone uppercase">Telephone & WhatsApp</dt>
                <dd className="mt-3 space-y-1.5 text-[16px]">
                  <a href={`tel:${a.phone.replace(/[^+\d]/g, '')}`} className="block hover:text-antique">
                    {a.phone}
                  </a>
                  <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="block text-antique hover:underline">
                    Message us on WhatsApp ↗
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.26em] text-stone uppercase">Email</dt>
                <dd className="mt-3 space-y-1.5 text-[16px]">
                  <a href={`mailto:${a.email}`} className="block hover:text-antique">
                    {a.email}
                  </a>
                  <a href="mailto:press@nirolax.com" className="block text-stone hover:text-antique">
                    press@nirolax.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="md:pt-2">
            <p className="text-[10px] tracking-[0.3em] text-antique uppercase">Write to us</p>
            <h2 className="mt-4 font-display text-[clamp(32px,3.4vw,48px)] leading-[1.05]">A note to the atelier</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-stone">
              For an appointment, the quickest way is to{' '}
              <Lnk href="/fittings" className="text-antique underline underline-offset-4">
                choose an hour yourself
              </Lnk>
              . For anything else, leave a note — we reply within one working day.
            </p>
            <div className="mt-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
