'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MARK } from '@/lib/logo-paths';

/** Fired once the opening has finished — the hero waits for it. */
export const INTRO_DONE = 'nirolax:intro-done';

/**
 * Opening: the N mark is drawn in a gold line, fills, the name appears,
 * then the black lifts like a curtain. About two seconds. Skipped for
 * reduced motion.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const finish = () => {
      (window as unknown as { __introDone?: boolean }).__introDone = true;
      window.dispatchEvent(new Event(INTRO_DONE));
      document.documentElement.classList.remove('intro-lock');
      setGone(true);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    document.documentElement.classList.add('intro-lock');
    const el = root.current!;
    const path = el.querySelector<SVGPathElement>('path')!;
    const len = path.getTotalLength();

    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
    tl.set(path, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 })
      .to(path, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.15)
      .to(path, { fillOpacity: 1, duration: 0.6, ease: 'power1.out' }, 1.25)
      .to(path, { strokeOpacity: 0, duration: 0.4 }, 1.5)
      .from('[data-intro-name] span', { yPercent: 120, duration: 0.9, stagger: 0.035, ease: 'expo.out' }, 1.15)
      .to('[data-intro-inner]', { y: -30, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 2.15)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1 }, 2.35)
      .add(() => window.dispatchEvent(new Event(INTRO_DONE + ':start')), 2.35)
      .add(finish);

    return () => {
      tl.kill();
      document.documentElement.classList.remove('intro-lock');
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] grid place-items-center bg-noir"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      aria-hidden
    >
      <div data-intro-inner className="flex flex-col items-center">
        <svg viewBox={MARK.viewBox} className="h-20 w-auto md:h-24">
          <defs>
            <linearGradient id="intro-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F4D090" />
              <stop offset=".5" stopColor="#DCAF6A" />
              <stop offset="1" stopColor="#A9824A" />
            </linearGradient>
          </defs>
          <g transform={MARK.transform || undefined}>
            <path d={MARK.paths[0]} fill="url(#intro-g)" stroke="#DCAF6A" strokeWidth={1.4} fillOpacity={0} />
          </g>
        </svg>
        <p data-intro-name className="mt-7 flex overflow-hidden font-display text-[15px] tracking-[0.62em] text-champagne">
          {'NIROLAX'.split('').map((c, i) => (
            <span key={i} className="inline-block">
              {c}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
