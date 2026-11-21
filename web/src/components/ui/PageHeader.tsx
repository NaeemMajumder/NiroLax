import type { ReactNode } from 'react';

/** Dark opening band used at the top of every inner page (keeps the nav legible). */
export function PageHeader({ kicker, title, dek, children }: { kicker: string; title: ReactNode; dek?: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative bg-noir pt-36 pb-16 md:pt-48 md:pb-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-[6vw]">
        <p data-reveal="fade" className="kicker">
          {kicker}
        </p>
        <h1 data-reveal="lines" className="mt-5 max-w-[16ch] font-display text-[clamp(46px,6.6vw,108px)] leading-[0.98] text-ivory">
          {title}
        </h1>
        {dek && (
          <p data-reveal="fade" className="mt-8 max-w-xl text-[16px] leading-relaxed text-bone/60 md:text-[17px]">
            {dek}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}
