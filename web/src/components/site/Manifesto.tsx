const facts = [
  { n: '42', unit: 'hours', text: 'of handwork in every jacket' },
  { n: '23', unit: 'measures', text: 'taken at your first fitting' },
  { n: '3', unit: 'fittings', text: 'before a piece leaves the atelier' },
  { n: '35', unit: 'at most', text: 'of each piece — then never again' },
];

export function Manifesto() {
  return (
    <section className="relative bg-noir">
      <div className="mx-auto max-w-[1440px] px-5 pt-32 pb-24 md:px-[6vw] md:pt-48 md:pb-36">
        <p data-reveal="fade" className="kicker">
          The House
        </p>
        <p
          data-reveal="words"
          className="mt-8 max-w-[22ch] font-display text-[clamp(34px,4.6vw,72px)] leading-[1.12] text-ivory md:mt-10"
        >
          We make ten pieces a season, and no more. Each is cut by hand, numbered, and finished for one person.{' '}
          <em className="text-champagne">Quiet, because it never needs to announce itself.</em>
        </p>

        <dl className="mt-24 grid grid-cols-2 gap-x-6 gap-y-14 border-t border-ivory/10 pt-12 md:mt-36 md:grid-cols-4 md:gap-10">
          {facts.map((f, i) => (
            <div key={f.n + f.unit} data-reveal="fade" data-delay={i * 0.08}>
              <dt className="flex items-baseline gap-2">
                <span className="font-display text-[56px] leading-none text-gold md:text-[80px]">{f.n}</span>
                <span className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">{f.unit}</span>
              </dt>
              <dd className="mt-4 max-w-[16rem] text-[14px] leading-relaxed text-bone/60">{f.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
