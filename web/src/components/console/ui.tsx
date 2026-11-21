'use client';

import type { ReactNode } from 'react';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`border border-ivory/10 bg-noir/50 ${className}`}>{children}</div>
);

export const H = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <h2 className="font-display text-[34px] leading-tight text-ivory">{children}</h2>
    {aside}
  </div>
);

export const Pill = ({ tone = 'muted', children }: { tone?: 'gold' | 'muted' | 'ok' | 'warn'; children: ReactNode }) => {
  const c = { gold: 'border-gold/50 text-gold', muted: 'border-ivory/15 text-bone/50', ok: 'border-[#6f9b7a]/50 text-[#9cc5a6]', warn: 'border-[#c2566a]/50 text-[#d98597]' }[tone];
  return <span className={`inline-block border px-2.5 py-1 text-[10px] tracking-[0.18em] whitespace-nowrap uppercase ${c}`}>{children}</span>;
};

export const SmallBtn = ({ children, onClick, tone = 'ghost', disabled }: { children: ReactNode; onClick?: () => void; tone?: 'ghost' | 'gold'; disabled?: boolean }) => (
  <button
    type={onClick ? 'button' : 'submit'}
    disabled={disabled}
    onClick={onClick}
    className={`px-3.5 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-30 ${
      tone === 'gold' ? 'bg-gold text-noir hover:bg-gold-light' : 'border border-ivory/20 text-bone/80 hover:border-gold hover:text-gold'
    }`}
  >
    {children}
  </button>
);

/** Shrink a photo in the browser before storing it (keeps the demo store small) */
export function readPhoto(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/webp', 0.78));
    };
    img.onerror = reject;
    img.src = url;
  });
}
