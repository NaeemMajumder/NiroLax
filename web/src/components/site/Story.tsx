'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stage } from '@/lib/stage';
import { asset } from '@/lib/asset';

gsap.registerPlugin(ScrollTrigger);

// Three.js only runs in the browser; the poster covers the gap while it loads.
const SuitStage = dynamic(() => import('@/components/three/SuitStage').then((m) => m.SuitStage), { ssr: false });

const chapters = [
  {
    no: 'I',
    title: 'The lapel',
    body: 'Peak lapels faced in black silk satin, rolled by hand so they curve across the chest instead of folding flat.',
  },
  {
    no: 'II',
    title: 'The cloth',
    body: 'Super 130s wool barathea, woven in Biella. Matte in daylight, a deep, quiet black under evening light.',
  },
  {
    no: 'III',
    title: 'The finish',
    body: 'Forty-two hours of handwork — pick-stitched edges, working cuffs and a floating canvas that takes your shape.',
  },
];

export function Story() {
  const root = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => (stage.progress = self.progress),
        },
      });

      // Positions are fractions of the whole story (timeline length = 1)
      tl.to('[data-hero]', { autoAlpha: 0, y: -40, duration: 0.1 }, 0.02)
        .to('[data-hint]', { autoAlpha: 0, duration: 0.05 }, 0.02);

      const beats = [0.3, 0.58, 0.82];
      gsap.utils.toArray<HTMLElement>('[data-chapter]').forEach((ch, i) => {
        tl.fromTo(ch, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, beats[i] - 0.1);
        tl.to(ch, { autoAlpha: 0, y: -30, duration: 0.06 }, beats[i] + 0.1);
      });

      tl.fromTo('[data-card]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.93);
      tl.fromTo('[data-bar]', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      tl.set({}, {}, 1); // pad the timeline to exactly 1
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={root} className="relative h-[560svh]">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* Poster: shown instantly, fades out once the 3D is live */}
        <picture>
          <source media="(max-width: 767px)" srcSet={asset('posters/midnight-tuxedo-mobile.webp')} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset('posters/midnight-tuxedo.webp')}
            alt=""
            aria-hidden
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              ready ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </picture>
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <SuitStage onReady={() => setReady(true)} />
        </div>

        {/* Vignette + mobile legibility gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(11,11,12,0.85)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noir via-noir/60 to-transparent md:hidden" />

        {/* ── Hero copy ── */}
        <div
          data-hero
          className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-10 md:inset-y-0 md:left-0 md:flex md:w-[52%] md:items-center md:pb-0 md:pl-[6vw]"
        >
          <div className="max-w-xl">
            <p className="kicker reveal [animation-delay:200ms]">The Atelier Collection · Piece Nº 01</p>
            <h1 className="reveal mt-4 font-display text-[40px] leading-[1.02] font-normal text-ivory [animation-delay:350ms] md:text-[clamp(56px,6.2vw,96px)]">
              Quiet luxury,
              <br />
              <em className="text-champagne">made to measure.</em>
            </h1>
            <p className="reveal mt-4 max-w-md text-[14px] leading-relaxed text-bone/75 [animation-delay:550ms] md:mt-6 md:text-[17px]">
              Ten pieces a season, cut by hand in our Dhaka atelier. Take a finished size, or sit for a fitting and
              let our tailors draft one that is yours alone.
            </p>
            <div className="reveal pointer-events-auto mt-7 grid grid-cols-2 gap-3 [animation-delay:700ms] md:mt-9 md:flex md:flex-wrap">
              <a
                href="#atelier"
                className="bg-gold px-5 py-4 text-center text-[11px] md:px-7 tracking-[0.24em] text-noir uppercase transition-colors duration-500 hover:bg-gold-light"
              >
                Book a Fitting
              </a>
              <a
                href="#piece"
                className="border border-ivory/25 px-5 py-4 text-center text-[11px] tracking-[0.24em] text-ivory uppercase transition-colors duration-500 hover:border-gold hover:text-gold md:px-7"
              >
                View the Piece
              </a>
            </div>
          </div>
        </div>

        {/* ── Chapters ── */}
        {chapters.map((c) => (
          <div
            key={c.no}
            data-chapter
            className="pointer-events-none invisible absolute inset-x-0 bottom-0 px-5 pb-20 md:inset-x-auto md:bottom-[14vh] md:left-[6vw] md:max-w-sm md:px-0 md:pb-0"
          >
            <p className="kicker">Chapter {c.no}</p>
            <h2 className="mt-3 font-display text-[36px] leading-tight text-ivory md:text-[48px]">{c.title}</h2>
            <div className="hairline mt-5 w-24 opacity-70" />
            <p className="mt-5 text-[15px] leading-relaxed text-bone/80 md:text-[16px]">{c.body}</p>
          </div>
        ))}

        {/* ── Piece card ── */}
        <div
          id="piece"
          data-card
          className="invisible absolute inset-x-0 bottom-0 px-5 pb-10 md:inset-x-auto md:top-1/2 md:right-[6vw] md:bottom-auto md:w-[min(440px,38vw)] md:-translate-y-1/2 md:px-0 md:pb-0"
        >
          <div className="border border-gold/25 bg-noir/70 p-6 backdrop-blur-md md:p-9">
            <div className="flex items-baseline justify-between gap-4">
              <p className="kicker">Limited · Nº 01</p>
              <p className="text-[12px] tracking-[0.12em] text-smoke">
                <span className="text-gold">12</span> of 35 remain
              </p>
            </div>
            <h2 className="mt-4 font-display text-[34px] leading-tight text-ivory md:text-[42px]">The Midnight Tuxedo</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-bone/70">
              Single-breasted, one button, satin peak lapels. Shown with the dress shirt and silk bow tie.
            </p>

            <dl className="mt-7 divide-y divide-gold/15 border-y border-gold/15">
              <div className="flex items-center justify-between gap-4 py-4">
                <dt>
                  <span className="block text-[13px] tracking-[0.16em] text-ivory uppercase">Ready-to-Wear</span>
                  <span className="mt-1 block text-[12px] text-smoke">Sizes 46 – 54 · ships in 3 days</span>
                </dt>
                <dd className="font-display text-[20px] whitespace-nowrap text-champagne">BDT 1,10,000</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt>
                  <span className="block text-[13px] tracking-[0.16em] text-ivory uppercase">Made-to-Measure</span>
                  <span className="mt-1 block text-[12px] text-smoke">Three fittings · ready in 4 – 5 weeks</span>
                </dt>
                <dd className="font-display text-[20px] whitespace-nowrap text-champagne">BDT 1,35,000</dd>
              </div>
            </dl>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <a
                href="#atelier"
                className="border border-ivory/25 py-4 text-center text-[11px] tracking-[0.22em] text-ivory uppercase transition-colors duration-500 hover:border-gold hover:text-gold"
              >
                Reserve a Size
              </a>
              <a
                href="#atelier"
                className="bg-gold py-4 text-center text-[11px] tracking-[0.22em] text-noir uppercase transition-colors duration-500 hover:bg-gold-light"
              >
                Book a Fitting
              </a>
            </div>
          </div>
        </div>

        {/* ── Drag hint + progress ── */}
        <div data-hint className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 md:flex">
          <span className="block h-px w-8 bg-gold/60" />
          <span className="text-[11px] tracking-[0.3em] text-bone/60 uppercase">Drag to turn · Scroll to explore</span>
          <span className="block h-px w-8 bg-gold/60" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-ivory/10">
          <div data-bar className="h-full origin-left bg-gold/70" />
        </div>
      </div>
    </section>
  );
}
