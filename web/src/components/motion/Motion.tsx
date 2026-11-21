'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * One place for every scroll reveal on the page. Mark an element and it animates:
 *   data-reveal="lines"  — text rises line by line from behind a mask
 *   data-reveal="fade"   — soft rise and fade
 *   data-reveal="image"  — a curtain opens over the image
 *   data-reveal="words"  — words brighten as you scroll past (scrubbed)
 * Optional data-delay="0.2".
 */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        const delay = Number(el.dataset.delay ?? 0);
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          aria: 'none', // whole lines stay readable as they are; no aria-label on a <p>
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              duration: 1.4,
              stagger: 0.09,
              delay,
              ease: 'expo.out',
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
        gsap.from(el, {
          y: 28,
          autoAlpha: 0,
          duration: 1.3,
          delay: Number(el.dataset.delay ?? 0),
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal="image"]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.6,
            delay: Number(el.dataset.delay ?? 0),
            ease: 'expo.inOut',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          },
        );
        const img = el.querySelector('img');
        if (img) gsap.from(img, { scale: 1.18, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });

      document.querySelectorAll<HTMLElement>('[data-reveal="words"]').forEach((el) => {
        SplitText.create(el, {
          type: 'words',
          autoSplit: true,
          aria: 'none',
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { opacity: 0.14 },
              {
                opacity: 1,
                stagger: 0.1,
                ease: 'none',
                scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true },
              },
            ),
        });
      });
    });

    // Fonts change line breaks; re-measure once they are in
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [path]);

  return null;
}
