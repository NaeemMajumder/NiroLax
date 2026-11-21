const steps = [
  {
    no: 'I',
    title: 'Reserve a fitting',
    body: 'Choose a 60-minute slot at the Gulshan atelier. A BDT 10,000 deposit holds it and is deducted from your piece.',
  },
  {
    no: 'II',
    title: 'Sit for measure',
    body: 'Our master tailor takes twenty-three measurements and notes your posture. They appear in your client portal the same day.',
  },
  {
    no: 'III',
    title: 'Follow every stage',
    body: 'Pattern, cutting, basting, stitching, wash and press — your portal shows each one as it happens, with a delivery date.',
  },
];

export function Atelier() {
  return (
    <section id="atelier" className="relative bg-ivory text-noir">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
          <div>
            <p className="kicker text-antique!">Made to Measure</p>
            <h2 className="mt-5 font-display text-[40px] leading-[1.05] md:text-[64px]">
              Cut for one.
              <br />
              <em className="text-antique">Followed by you.</em>
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-stone">
              Every made-to-measure piece starts at our atelier table and ends at your door. Between the two, you can
              see exactly where it is.
            </p>
            <a
              href="#atelier"
              className="mt-10 inline-block bg-noir px-8 py-4 text-[11px] tracking-[0.24em] text-ivory uppercase transition-colors duration-500 hover:bg-antique"
            >
              See Available Slots
            </a>
          </div>

          <ol className="divide-y divide-noir/10 border-y border-noir/10">
            {steps.map((s) => (
              <li key={s.no} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-9 md:grid-cols-[5rem_minmax(0,1fr)] md:py-11">
                <span className="font-display text-[28px] text-gold-deep italic md:text-[36px]">{s.no}</span>
                <div>
                  <h3 className="font-display text-[24px] md:text-[30px]">{s.title}</h3>
                  <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-stone md:text-[16px]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
