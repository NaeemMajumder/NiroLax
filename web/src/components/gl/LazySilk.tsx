'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ComponentProps } from 'react';

const Silk = dynamic(() => import('./Silk').then((m) => m.Silk), { ssr: false });
type Props = ComponentProps<typeof Silk>;

/**
 * The silk shader (three.js) loads only once the visitor engages — first scroll, touch or pointer
 * move — or after a few quiet seconds. Until then a matching gradient holds its place, so the
 * first paint and the first interaction never wait for WebGL.
 */
export function LazySilk(props: Props) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const go = () => setOn(true);
    const evs = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    const t = setTimeout(go, 3500);
    return () => {
      clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, go));
    };
  }, []);
  if (on) return <Silk {...props} />;
  const base = (props as { color?: string }).color ?? '#0f0f11';
  const sheen = (props as { sheen?: string }).sheen ?? '#3a3226';
  return <div aria-hidden className={(props as { className?: string }).className} style={{ background: `radial-gradient(120% 90% at 30% 20%, ${sheen}22 0%, ${base} 60%)` }} />;
}
