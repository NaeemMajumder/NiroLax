'use client';

import { useState } from 'react';
import { asset } from '@/lib/asset';
import { Lnk } from '@/components/ui/Lnk';
import { MARK } from '@/lib/logo-paths';

const measures = [
  ['Chest', '102'],
  ['Waist', '86'],
  ['Shoulder', '46.5'],
  ['Sleeve', '64'],
  ['Back length', '76'],
  ['Trouser waist', '84'],
  ['Inseam', '81'],
  ['Thigh', '58'],
];

/**
 * Production stages. Each has a photograph at public/atelier/stages/<slug>.webp
 * (to be generated later); until it exists, an elegant placeholder is shown.
 */
type Stage = { slug: string; name: string; date: string | null; note: string; current?: boolean };
const stages: Stage[] = [
  { slug: 'measured', name: 'Measured', date: '14 Nov', note: 'Twenty-three measures taken and your posture noted.' },
  { slug: 'pattern', name: 'Pattern drafted', date: '15 Nov', note: 'Your paper pattern drafted by hand from your measures.' },
  { slug: 'cutting', name: 'Cloth cut', date: '17 Nov', note: 'The barathea laid out and cut with shears, one piece at a time.' },
  { slug: 'basting', name: 'Basted', date: '19 Nov', note: 'Loosely tacked together in white thread for the first fitting.' },
  { slug: 'first-fitting', name: 'First fitting', date: '21 Nov', note: 'Fitted on you at the atelier; chalk marks for every change.' },
  { slug: 'stitching', name: 'Forward stitching', date: null, note: 'The jacket is being sewn for real, seam by seam.', current: true },
  { slug: 'second-fitting', name: 'Second fitting', date: null, note: 'Nearly finished — the last adjustments to balance and length.' },
  { slug: 'finishing', name: 'Hand finishing', date: null, note: 'Buttonholes, pick-stitching and the satin facings sewn by hand.' },
  { slug: 'pressing', name: 'Wash & press', date: null, note: 'Steamed and pressed into shape over a tailor\'s ham.' },
  { slug: 'final-fitting', name: 'Final fitting', date: null, note: 'Worn once more at the atelier before it is signed off.' },
  { slug: 'ready', name: 'Ready for you', date: null, note: 'Numbered, boxed and waiting for you to collect.' },
];

/** The stage photograph, or a quiet placeholder until the photo exists */
function StagePhoto({ stage, index }: { stage: Stage; index: number }) {
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const gone = missing[stage.slug];
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#2a2724_0%,#141313_70%)]">
      {!gone && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={stage.slug}
          src={asset(`atelier/stages/${stage.slug}.webp`)}
          alt={stage.name}
          onError={() => setMissing((m) => ({ ...m, [stage.slug]: true }))}
          className="absolute inset-0 h-full w-full animate-[invite_0.9s_var(--ease-luxe)_both] object-cover"
        />
      )}
      {gone && (
        <div key={stage.slug + '-ph'} className="absolute inset-0 grid animate-[invite_0.9s_var(--ease-luxe)_both] place-items-center">
          <div className="pointer-events-none absolute inset-4 border border-gold/20" />
          <div className="text-center">
            <p className="font-display text-[64px] leading-none text-gold/25 italic">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-3 text-[10px] tracking-[0.3em] text-bone/60 uppercase">Photograph of this stage</p>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16">
        <p className="text-[10px] tracking-[0.26em] text-gold uppercase">
          {stage.current ? 'Now' : stage.date ? stage.date : 'Coming'} · Stage {index + 1} of {stages.length}
        </p>
        <p className="mt-1 font-display text-[22px] text-ivory">{stage.name}</p>
        <p className="mt-1 max-w-sm text-[13px] text-bone/70">{stage.note}</p>
      </div>
    </div>
  );
}

export function Portal() {
  const done = stages.findIndex((s) => s.current);
  const [view, setView] = useState(done);
  return (
    <section id="portal" className="relative bg-graphite">
      <div className="mx-auto max-w-[1440px] px-5 py-28 md:px-[6vw] md:py-44">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <div>
            <p data-reveal="fade" className="kicker">
              Client portal
            </p>
            <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(40px,5vw,80px)] leading-[1.02] text-ivory">
              Your piece, <em className="text-champagne">as it is made.</em>
            </h2>
          </div>
          <p data-reveal="fade" className="max-w-md text-[15px] leading-relaxed text-bone/60 md:justify-self-end md:text-[16px]">
            Your measurements in your tailor&rsquo;s own hand, a photograph of every stage of the work as it happens, and
            the date it will be ready. Shown here as a client sees it.
            <Lnk href="/portal" className="mt-5 block text-[11px] tracking-[0.24em] text-gold uppercase hover:text-gold-light">
              Open the client portal →
            </Lnk>
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-8">
          {/* Tailor's notebook */}
          <div data-reveal="fade" className="relative overflow-hidden bg-[#f3ecdf] p-7 text-noir md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_43px,rgba(122,92,46,0.14)_43px,rgba(122,92,46,0.14)_44px)] [background-position:0_22px]" />
            <div className="pointer-events-none absolute inset-y-0 left-12 w-px bg-bordeaux/25 md:left-16" />
            <div className="relative pl-8 md:pl-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.26em] text-antique uppercase">Measure sheet</p>
                  <p className="mt-2 font-display text-[22px]">Mr T. Rahman</p>
                </div>
                <p className="text-right text-[11px] leading-relaxed text-stone">
                  Nº 01 · Midnight Tuxedo
                  <br />
                  14 November 2026
                </p>
              </div>
              <dl className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {measures.map(([k, v]) => (
                  <div key={k} className="flex h-11 items-end justify-between gap-3">
                    <dt className="text-[12px] tracking-[0.1em] text-stone uppercase">{k}</dt>
                    <dd className="font-hand text-[20px] leading-none text-[#2b2a3a]">
                      {v}
                      <span className="text-[12px]"> cm</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 font-hand text-[16px] leading-[44px] text-[#2b2a3a]">
                Left shoulder sits 1 cm low — pad lightly. Likes a close waist, half-break on the trouser.
              </p>
              <p className="mt-2 text-right font-hand text-[16px] text-antique">— A. Karim</p>
            </div>
          </div>

          <div className="grid gap-6 md:gap-8">
            {/* Stages */}
            <div data-reveal="fade" data-delay="0.1" className="border border-ivory/10 bg-noir/40 p-7 md:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-[10px] tracking-[0.26em] text-gold uppercase">In the atelier</p>
                <p className="text-[13px] text-bone/60">
                  Ready <span className="font-display text-[18px] text-champagne">Thursday, 17 December</span>
                </p>
              </div>
              <div className="mt-6">
                <StagePhoto stage={stages[view]} index={view} />
              </div>
              <div className="mt-6 h-px w-full bg-ivory/10">
                <div className="h-full bg-gold" style={{ width: `${((done + 0.5) / stages.length) * 100}%` }} />
              </div>
              <ol className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {stages.map((s, i) => {
                  const isDone = i < done;
                  return (
                    <li key={s.name}>
                      <button
                        type="button"
                        onClick={() => setView(i)}
                        aria-pressed={view === i}
                        className={`flex w-full items-center gap-4 border-b py-3 text-left transition-colors duration-300 ${
                          view === i ? 'border-gold/40' : 'border-ivory/[0.06] hover:border-ivory/20'
                        }`}
                      >
                      <span className="relative grid h-4 w-4 shrink-0 place-items-center">
                        {s.current && <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />}
                        <span
                          className={`h-2 w-2 rounded-full ${isDone ? 'bg-gold' : s.current ? 'bg-champagne' : 'border border-ivory/25'}`}
                        />
                      </span>
                      <span className={`flex-1 text-[14px] ${isDone ? 'text-bone/70' : s.current ? 'text-ivory' : 'text-bone/60'}`}>
                        {s.name}
                      </span>
                      <span className="text-[12px] text-bone/60">{s.date ?? (s.current ? 'Now' : '')}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Certificate */}
            <div data-reveal="fade" data-delay="0.2" className="relative overflow-hidden bg-noir p-7 md:p-10">
              <div className="pointer-events-none absolute inset-3 border border-gold/30" />
              <div className="relative flex items-center gap-6 md:gap-8">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-gold/50 md:h-24 md:w-24">
                  <svg viewBox={MARK.viewBox} className="h-7 w-auto md:h-8" aria-hidden>
                    <path d={MARK.paths[0]} fill="#DCAF6A" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.26em] text-gold uppercase">Certificate of edition</p>
                  <p className="mt-2 font-display text-[clamp(22px,2.4vw,32px)] leading-tight text-ivory">
                    Nº 07 <span className="text-bone/60">of 35</span>
                  </p>
                  <p className="mt-1 text-[13px] text-bone/60">The Midnight Tuxedo · made for Mr T. Rahman</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
