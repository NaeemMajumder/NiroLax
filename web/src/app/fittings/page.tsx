import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BookFitting } from '@/components/fittings/BookFitting';

export const metadata: Metadata = { alternates: { canonical: '/fittings' }, title: 'Book a fitting', description: 'An hour at the Gulshan atelier with the tailor who will cut your piece.' };

export default function FittingsPage() {
  return (
    <section data-tone="light" className="bg-bone text-noir">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 pt-32 pb-28 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-[6vw] md:px-[6vw] md:pt-44 md:pb-40">
        <div className="md:sticky md:top-32 md:self-start">
          <p data-reveal="fade" className="kicker text-antique!">
            Fittings
          </p>
          <h1 data-reveal="lines" className="mt-5 font-display text-[clamp(40px,5vw,80px)] leading-[1.02]">
            An hour, and a tailor&rsquo;s <em className="text-antique">full attention.</em>
          </h1>
          <p data-reveal="fade" className="mt-8 max-w-md text-[16px] leading-[1.75] text-stone">
            You will be met at the door, offered tea, and measured by the tailor who will cut your piece. We discuss cloth, the
            way you stand, and how you mean to wear it.
          </p>
          <dl data-reveal="fade" className="mt-10 grid max-w-md grid-cols-3 border-y border-noir/10 py-6">
            <div>
              <dt className="text-[10px] tracking-[0.22em] text-stone uppercase">Length</dt>
              <dd className="mt-2 font-display text-[20px]">60 min</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em] text-stone uppercase">Where</dt>
              <dd className="mt-2 font-display text-[20px]">Gulshan 2</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em] text-stone uppercase">Hours</dt>
              <dd className="mt-2 font-display text-[20px]">11 – 8</dd>
            </div>
          </dl>
          <p data-reveal="fade" className="mt-4 max-w-md text-[12px] text-stone">
            Saturday to Thursday. A deposit is asked only for a new made-to-measure piece.
          </p>
        </div>
        <div data-reveal="fade" className="min-w-0">
          <Suspense>
            <BookFitting />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
