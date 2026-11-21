'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { asset } from '@/lib/asset';
import { Lnk } from '@/components/ui/Lnk';
import { INTRO_DONE } from './Intro';
import { usePieces } from '@/lib/catalogue';

gsap.registerPlugin(SplitText);

import { LazySilk as Silk } from '@/components/gl/LazySilk';

/**
 * The pieces the banner moves through. Each has a cut-out photo (no background) and a dark
 * silk colour of its own, so the room changes with the piece while the copy stays readable.
 */
const SLIDES = [
  { slug: 'midnight-tuxedo', cut: 'pieces/midnight-tuxedo/front-cut.webp', bg: '#0f0f11', sheen: '#b98d4f' },
  { slug: 'graphite-double-breasted', cut: 'pieces/hero/graphite-cut.webp', bg: '#111214', sheen: '#9aa1a8' },
  { slug: 'champagne-draped-gown', cut: 'pieces/hero/champagne-cut.webp', bg: '#17130d', sheen: '#d9bd8c' },
  { slug: 'ivory-raw-silk-sherwani', cut: 'pieces/hero/sherwani-cut.webp', bg: '#141312', sheen: '#e6dcc6' },
];
const SECONDS = 6;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const pieces = usePieces();
  // Only pieces still in the catalogue (published) take part
  const slides = SLIDES.map((sl) => ({ ...sl, piece: pieces.find((p) => p.slug === sl.slug) })).filter((sl) => sl.piece);
  const [at, setAt] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const count = slides.length;
  const go = useCallback((n: number) => setAt(((n % count) + count) % count), [count]);
  const slide = slides[Math.min(at, Math.max(count - 1, 0))];
  const piece = slide?.piece;

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // Stop while the tab is hidden, so it does not race ahead in the background
    const vis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  // Swipe left / right on phones
  useEffect(() => {
    const el = root.current;
    if (!el || count < 2) return;
    let x0 = 0;
    let y0 = 0;
    const down = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };
    const up = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setAt((a) => (((a + (dx < 0 ? 1 : -1)) % count) + count) % count);
    };
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchend', up, { passive: true });
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchend', up);
    };
  }, [count]);

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
          .timeline({ defaults: { ease: 'expo.out' }, onComplete: () => setStarted(true) })
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
    <section
      ref={root}
      id="top"
      aria-roledescription="carousel"
      aria-label="Pieces from Season I"
      className="relative h-svh min-h-[640px] overflow-hidden bg-noir"
    >
      <Silk className="absolute inset-0" color={slide?.bg ?? '#0f0f11'} sheen={slide?.sheen ?? '#b98d4f'} gloss={40} scale={2.6} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,transparent_20%,rgba(11,11,12,0.55)_75%)]" />

      {/* The piece */}
      <div data-suit-wrap className="pointer-events-none absolute inset-y-0 right-0 left-0 md:left-[44%]">
        <div
          data-glow
          className="absolute top-[38%] left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,219,192,0.28)_0%,rgba(220,175,106,0.10)_38%,transparent_68%)] max-md:top-[30%] max-md:h-[52vh] max-md:w-[52vh]"
        />
        <div className="hero-shadow absolute bottom-[5vh] left-1/2 h-6 w-[38vh] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl max-md:bottom-[44svh] max-md:w-[26vh]" />
        {/* All cut-outs stay mounted and cross-fade, so nothing pops in */}
        <div data-suit className="hero-suit absolute bottom-[5vh] left-1/2 h-[84vh] w-0 max-md:bottom-[44svh] max-md:h-[46svh]">
          {(count ? slides : SLIDES.slice(0, 1)).map((sl, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={sl.slug}
              src={asset(sl.cut)}
              alt={i === at && piece ? `${piece.name} on an atelier stand` : ''}
              aria-hidden={i !== at}
              fetchPriority={i === 0 ? 'high' : 'low'}
              className={`absolute bottom-0 left-0 h-full w-auto max-w-none -translate-x-1/2 drop-shadow-[0_0_40px_rgba(234,219,192,0.08)] transition-[opacity,translate] ease-(--ease-luxe) ${
                still ? 'duration-0' : 'duration-[1400ms]'
              } ${i === at ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            />
          ))}
        </div>
      </div>

      {/* Copy */}
      <div data-hero-copy className="relative z-10 flex h-full flex-col justify-end px-5 pb-10 md:justify-center md:px-[6vw] md:pb-0">
        <p data-hero-in className={`kicker ${count > 1 ? 'max-md:hidden' : ''}`}>
          Season I · Ten pieces, numbered
        </p>
        {/* Phones: the line above the headline names the piece on show, with its bars */}
        {piece && count > 1 && (
          <div data-hero-in className="flex items-center justify-between gap-4 md:hidden">
            <Lnk href={`/pieces/${piece.slug}`} className="kicker min-w-0 truncate">
              Nº {piece.no} — {piece.name}
            </Lnk>
            <Bars count={count} at={at} go={go} running={started && !paused} still={still} onHold={setPaused} compact />
          </div>
        )}
        <h1
          data-hero-title
          className="hero-title mt-5 font-display text-[clamp(46px,6.4vw,108px)] leading-[0.98] font-normal tracking-[-0.01em] text-ivory"
        >
          Quiet luxury,
          <br />
          <em className="text-champagne">made to measure.</em>
        </h1>
        <p data-hero-in className="hero-dek mt-6 max-w-[30rem] text-[15px] leading-relaxed text-bone/70 md:mt-8 md:text-[17px]">
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
      <div data-hero-in className="pointer-events-none absolute right-5 bottom-8 left-5 z-20 hidden items-end justify-between md:right-[6vw] md:left-[6vw] md:flex">
        {piece ? (
          <Lnk href={`/pieces/${piece.slug}`} className="pointer-events-auto text-[11px] tracking-[0.22em] text-bone/60 uppercase transition-colors hover:text-ivory">
            Nº {piece.no} — {piece.name} · <span className="text-gold/80">{piece.remaining <= 5 ? `Last ${piece.remaining}` : `${piece.remaining} of ${piece.edition} remain`}</span>
          </Lnk>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-10">
          {count > 1 && <Bars count={count} at={at} go={go} running={started && !paused} still={still} onHold={setPaused} />}
          <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-[0.3em] text-bone/60 uppercase">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_ease-in-out_infinite] bg-gold" />
          </span>
          </div>
        </div>
      </div>
      <p className="pointer-events-none absolute top-1/2 right-[2vw] z-10 hidden -translate-y-1/2 rotate-180 text-[10px] tracking-[0.5em] text-bone/60 uppercase [writing-mode:vertical-rl] lg:block">
        Dhaka · MMXXVI
      </p>
    </section>
  );
}

/** One thin bar per piece; the current one fills over a few seconds, then the next piece comes in */
function Bars({ count, at, go, running, still, onHold, compact = false }: { count: number; at: number; go: (n: number) => void; running: boolean; still: boolean; onHold: (v: boolean) => void; compact?: boolean }) {
  // Hovering or focusing the bars holds the current piece; reduced motion turns autoplay off
  return (
    <div
      className={`pointer-events-auto flex items-center ${compact ? 'gap-1.5' : 'gap-2.5'}`}
      role="group"
      aria-label="Choose a piece"
      onMouseEnter={() => onHold(true)}
      onMouseLeave={() => onHold(false)}
      onFocus={() => onHold(true)}
      onBlur={() => onHold(false)}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => go(i)}
          aria-label={`Show piece ${i + 1} of ${count}`}
          aria-current={i === at}
          className={`group relative flex items-center py-3 ${compact ? 'w-6' : 'w-10'}`}
        >
          <span className="relative block h-px w-full overflow-hidden bg-ivory/20 transition-colors group-hover:bg-ivory/40">
            {i < at && <span className="absolute inset-0 bg-gold/60" />}
            {i === at && (
              <span
                key={at}
                onAnimationEnd={() => go(at + 1)}
                className="absolute inset-0 origin-left bg-gold"
                style={still ? undefined : { animation: `herobar ${SECONDS}s linear forwards`, animationPlayState: running ? 'running' : 'paused' }}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
