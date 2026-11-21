'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { asset } from '@/lib/asset';
import { Lnk } from '@/components/ui/Lnk';
import { INTRO_DONE } from './Intro';

gsap.registerPlugin(SplitText);

import { LazySilk as Silk } from '@/components/gl/LazySilk';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onIntro: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const split = SplitText.create('[data-hero-title]', { type: 'lines,chars', mask: 'lines' });
      gsap.set('[data-hero-in]', { autoAlpha: 0, y: 24 });
      gsap.set(split.chars, { yPercent: 110 });
      gsap.set('[data-suit]', { autoAlpha: 0, y: 40, scale: 0.96 });
      gsap.set('[data-glow]', { autoAlpha: 0, scale: 0.7 });

      const play = () =>
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .to('[data-glow]', { autoAlpha: 1, scale: 1, duration: 2.4 }, 0)
          .to('[data-suit]', { autoAlpha: 1, y: 0, scale: 1, duration: 2.2 }, 0.15)
          .to(split.chars, { yPercent: 0, duration: 1.3, stagger: 0.022 }, 0.25)
          .to('[data-hero-in]', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.75);

      const started = (window as unknown as { __introDone?: boolean }).__introDone;
      if (started || reduce) play();
      else {
        onIntro = () => play();
        window.addEventListener(INTRO_DONE + ':start', onIntro, { once: true });
      }

      // The suit drifts a little with the mouse; the glow drifts the other way
      if (!reduce && window.matchMedia('(pointer: fine)').matches) {
        const sx = gsap.quickTo('[data-suit-wrap]', 'x', { duration: 1.6, ease: 'power3' });
        const sy = gsap.quickTo('[data-suit-wrap]', 'y', { duration: 1.6, ease: 'power3' });
        const gx = gsap.quickTo('[data-glow]', 'x', { duration: 2.2, ease: 'power3' });
        onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          sx(nx * 18);
          sy(ny * 10);
          gx(nx * -40);
        };
        window.addEventListener('pointermove', onMove, { passive: true });
      }

      // On scroll the suit sinks and the copy lifts away
      gsap.to('[data-suit-wrap]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('[data-hero-copy]', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    }, el);

    // Remove the listeners too, or a stale copy (React runs effects twice in dev) animates a reverted split
    return () => {
      if (onIntro) window.removeEventListener(INTRO_DONE + ':start', onIntro);
      if (onMove) window.removeEventListener('pointermove', onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="top" className="relative h-svh min-h-[640px] overflow-hidden bg-noir">
      <Silk className="absolute inset-0" color="#0f0f11" sheen="#b98d4f" gloss={40} scale={2.6} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,transparent_20%,rgba(11,11,12,0.55)_75%)]" />

      {/* The piece */}
      <div data-suit-wrap className="pointer-events-none absolute inset-y-0 right-0 left-0 md:left-[44%]">
        <div
          data-glow
          className="absolute top-[38%] left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,219,192,0.28)_0%,rgba(220,175,106,0.10)_38%,transparent_68%)] max-md:top-[30%] max-md:h-[52vh] max-md:w-[52vh]"
        />
        <div className="absolute bottom-[5vh] left-1/2 h-6 w-[38vh] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl max-md:bottom-[44svh] max-md:w-[26vh]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-suit
          src={asset('pieces/midnight-tuxedo/front-cut.webp')}
          alt="The Midnight Tuxedo on an atelier stand"
          className="absolute bottom-[5vh] left-1/2 h-[84vh] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_0_40px_rgba(234,219,192,0.08)] max-md:bottom-[44svh] max-md:h-[46svh]"
        />
      </div>

      {/* Copy */}
      <div data-hero-copy className="relative z-10 flex h-full flex-col justify-end px-5 pb-10 md:justify-center md:px-[6vw] md:pb-0">
        <p data-hero-in className="kicker">
          Season I · Ten pieces, numbered
        </p>
        <h1
          data-hero-title
          className="mt-5 font-display text-[clamp(46px,6.4vw,108px)] leading-[0.98] font-normal tracking-[-0.01em] text-ivory"
        >
          Quiet luxury,
          <br />
          <em className="text-champagne">made to measure.</em>
        </h1>
        <p data-hero-in className="mt-6 max-w-[30rem] text-[15px] leading-relaxed text-bone/70 md:mt-8 md:text-[17px]">
          Cut by hand in our Dhaka atelier. Wear a finished size, or sit for a fitting and have one drafted for you
          alone.
        </p>
        <div data-hero-in className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-11">
          <a
            href="#appointment"
            className="group relative overflow-hidden bg-gold px-8 py-[18px] text-[11px] tracking-[0.26em] text-noir uppercase"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-ivory transition-transform duration-700 ease-(--ease-luxe) group-hover:scale-y-100" />
            <span className="relative">Book a fitting</span>
          </a>
          <Lnk href="/season" className="group text-[11px] tracking-[0.26em] text-ivory uppercase">
            Discover the season
            <span className="mt-2 block h-px w-full origin-left bg-gold/70 transition-transform duration-700 ease-(--ease-luxe) group-hover:scale-x-50" />
          </Lnk>
        </div>
      </div>

      {/* Edge details */}
      <div data-hero-in className="pointer-events-none absolute right-5 bottom-8 left-5 z-10 hidden items-end justify-between md:right-[6vw] md:left-[6vw] md:flex">
        <p className="text-[11px] tracking-[0.22em] text-bone/60 uppercase">
          Nº 01 — The Midnight Tuxedo · <span className="text-gold/80">12 of 35 remain</span>
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-[0.3em] text-bone/60 uppercase">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_ease-in-out_infinite] bg-gold" />
          </span>
        </div>
      </div>
      <p className="pointer-events-none absolute top-1/2 right-[2vw] z-10 hidden -translate-y-1/2 rotate-180 text-[10px] tracking-[0.5em] text-bone/60 uppercase [writing-mode:vertical-rl] lg:block">
        Dhaka · MMXXVI
      </p>
    </section>
  );
}
