import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Lnk } from '@/components/ui/Lnk';
import { asset } from '@/lib/asset';
import { getPublicSettings } from '@/lib/catalogue.server';
import { openDays } from '@/lib/hours';

export const metadata: Metadata = { alternates: { canonical: '/atelier' }, title: 'The Atelier', description: 'Our atelier in Gulshan, Dhaka, the people who work in it, and how a piece is made.' };

const tailors = [
  { initials: 'AK', name: 'Abdul Karim', role: 'Head tailor', years: 'Thirty-one years at the table', note: 'Cuts every made-to-measure pattern himself.' },
  { initials: 'RB', name: 'Rehana Begum', role: 'Finisher', years: 'Nineteen years', note: 'Buttonholes, pick-stitching and every satin facing.' },
  { initials: 'MH', name: 'Mizanur Hossain', role: 'Trouser maker', years: 'Twenty-two years', note: 'Every trouser, from cutting to the final press.' },
];

const stages = ['Measured', 'Pattern drafted', 'Cloth cut', 'Basted', 'First fitting', 'Forward stitching', 'Second fitting', 'Hand finishing', 'Wash & press', 'Final fitting', 'Ready for you'];

export default async function AtelierPage() {
  const site = await getPublicSettings();
  return (
    <>
      <PageHeader
        kicker="The Atelier"
        title={
          <>
            One room in Gulshan, <em className="text-champagne">and the hands in it.</em>
          </>
        }
        dek="Everything Nirolax makes is cut, sewn and pressed on the second floor of a house on Road 113. Nothing is sent out."
      />

      <section data-tone="light" className="bg-ivory text-noir">
        <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-24 md:grid-cols-2 md:gap-[6vw] md:px-[6vw] md:py-36">
          <div data-reveal="image" className="relative aspect-[4/5] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('atelier/house.webp')} alt="The Nirolax atelier at dusk: a long oak cutting table, shelves of cloth and a tailor at work by the window" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="self-center">
            <p data-reveal="fade" className="kicker text-antique!">
              The house
            </p>
            <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(34px,3.6vw,56px)] leading-[1.06]">
              Made slowly, by name, in one place.
            </h2>
            <div data-reveal="fade" className="mt-8 space-y-5 text-[16px] leading-[1.8] text-stone">
              <p>
                Nirolax began with a single tailor and a question: what would a Dhaka suit look like if nobody hurried it? The
                answer took forty-two hours, and we have kept to it.
              </p>
              <p>
                There are seven of us. Each piece is followed through the room by the people who make it, and each client is
                known to them by name. That is why there are ten pieces a season, and no more.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-noir">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-[6vw] md:py-36">
          <p data-reveal="fade" className="kicker">
            The tailors
          </p>
          <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(34px,3.6vw,56px)] leading-[1.06] text-ivory">
            Seventy-two years at the table, between three of them.
          </h2>
          <ul className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
            {tailors.map((t, i) => (
              <li key={t.name} data-reveal="fade" data-delay={i * 0.08} className="border border-ivory/10 p-8">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/40 font-display text-[22px] text-champagne">{t.initials}</span>
                <p className="mt-8 font-display text-[26px] text-ivory">{t.name}</p>
                <p className="mt-1 text-[11px] tracking-[0.22em] text-gold uppercase">{t.role}</p>
                <p className="mt-5 text-[14px] text-bone/60">{t.years}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-bone/70">{t.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-graphite">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-[6vw] md:py-36">
          <p data-reveal="fade" className="kicker">
            How a piece is made
          </p>
          <h2 data-reveal="lines" className="mt-5 max-w-[20ch] font-display text-[clamp(34px,3.6vw,56px)] leading-[1.06] text-ivory">
            Eleven stages, each one shown to you as it happens.
          </h2>
          <ol className="mt-16 grid grid-cols-1 border-t border-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((s, i) => (
              <li key={s} data-reveal="fade" data-delay={(i % 4) * 0.06} className="border-b border-ivory/10 py-7 sm:pr-8">
                <span className="font-display text-[15px] text-gold/70 italic">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-2 font-display text-[22px] text-ivory">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-tone="light" className="bg-bone text-noir">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 md:grid-cols-2 md:px-[6vw] md:py-32">
          <div>
            <p data-reveal="fade" className="kicker text-antique!">
              Visit
            </p>
            <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(34px,3.6vw,56px)] leading-[1.06]">
              By appointment, <em className="text-antique">always with tea.</em>
            </h2>
            <Lnk
              href="/#appointment"
              className="mt-10 inline-block bg-noir px-8 py-[18px] text-[11px] tracking-[0.26em] text-ivory uppercase transition-colors duration-500 hover:bg-antique"
            >
              Book a fitting
            </Lnk>
          </div>
          <dl data-reveal="fade" className="grid grid-cols-2 gap-8 self-end text-[15px]">
            <div>
              <dt className="text-[10px] tracking-[0.24em] text-stone uppercase">Address</dt>
              <dd className="mt-3 leading-relaxed">{site.atelier.address1}<br />{site.atelier.address2}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.24em] text-stone uppercase">Hours</dt>
              <dd className="mt-3 leading-relaxed">{openDays(site.closedWeekdays)}<br />By appointment</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.24em] text-stone uppercase">Telephone</dt>
              <dd className="mt-3"><a href={`tel:${site.atelier.phone.replace(/[^+\d]/g, '')}`} className="hover:text-antique">{site.atelier.phone}</a></dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.24em] text-stone uppercase">Email</dt>
              <dd className="mt-3"><a href={`mailto:${site.atelier.email}`} className="hover:text-antique">{site.atelier.email}</a></dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
