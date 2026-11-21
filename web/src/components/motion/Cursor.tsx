'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * A small gold point with a ring that trails it. Over links the ring opens;
 * over anything with data-cursor="View" the ring shows that word.
 * Only on devices with a real mouse.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<'idle' | 'link' | 'label'>('idle');

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || !dot.current || !ring.current) return;

    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' });

    let shown = false;
    const move = (e: PointerEvent) => {
      // Hide the system cursor only once ours is actually on screen
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY, autoAlpha: 1 });
        document.documentElement.classList.add('has-cursor');
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const withLabel = t.closest<HTMLElement>('[data-cursor]');
      if (withLabel) {
        setLabel(withLabel.dataset.cursor ?? '');
        setMode('label');
        return;
      }
      setMode(t.closest('a, button, input, label, [role="button"]') ? 'link' : 'idle');
    };
    const leave = () => gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 });
    const enter = () => gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 });

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  const size = mode === 'label' ? 92 : mode === 'link' ? 54 : 34;

  return (
    <>
      <div
        ref={ring}
        className="pointer-events-none invisible fixed top-0 left-0 z-[100] hidden mix-blend-difference [@media(pointer:fine)]:block"
      >
        <div
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color] duration-500 ease-(--ease-luxe) ${
            mode === 'label' ? 'border-transparent bg-champagne' : 'border-champagne/70'
          }`}
          style={{ width: size, height: size }}
        >
          <span
            className={`text-[10px] tracking-[0.25em] text-noir uppercase transition-opacity duration-300 ${mode === 'label' ? 'opacity-100' : 'opacity-0'}`}
          >
            {label}
          </span>
        </div>
      </div>
      <div ref={dot} className="pointer-events-none invisible fixed top-0 left-0 z-[101] hidden [@media(pointer:fine)]:block">
        <div className={`h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold transition-opacity ${mode === 'label' ? 'opacity-0' : ''}`} />
      </div>
    </>
  );
}
