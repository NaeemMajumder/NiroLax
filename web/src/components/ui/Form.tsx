'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Tone = 'dark' | 'light';
const line = (tone: Tone) =>
  tone === 'dark'
    ? 'border-ivory/20 text-ivory placeholder:text-bone/30 focus:border-gold'
    : 'border-noir/20 text-noir placeholder:text-noir/30 focus:border-antique';
const lab = (tone: Tone) => (tone === 'dark' ? 'text-bone/60' : 'text-stone');

export function Field({ label, error, tone = 'dark', hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; tone?: Tone; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className={`text-[10px] tracking-[0.24em] uppercase ${lab(tone)}`}>{label}</span>
      <input
        {...props}
        aria-invalid={!!error}
        className={`mt-2 w-full border-b bg-transparent pb-2.5 text-[16px] outline-none transition-colors ${line(tone)} ${error ? 'border-bordeaux!' : ''}`}
      />
      {error ? <span className="mt-1.5 block text-[12px] text-[#c2566a]">{error}</span> : hint ? <span className={`mt-1.5 block text-[12px] ${lab(tone)}`}>{hint}</span> : null}
    </label>
  );
}

export function TextArea({ label, tone = 'dark', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; tone?: Tone }) {
  return (
    <label className="block">
      <span className={`text-[10px] tracking-[0.24em] uppercase ${lab(tone)}`}>{label}</span>
      <textarea {...props} className={`mt-2 w-full resize-none border-b bg-transparent pb-2.5 text-[16px] outline-none ${line(tone)}`} />
    </label>
  );
}

export function Select({ label, tone = 'dark', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; tone?: Tone }) {
  return (
    <label className="block">
      <span className={`text-[10px] tracking-[0.24em] uppercase ${lab(tone)}`}>{label}</span>
      <select {...props} className={`mt-2 w-full border-b bg-transparent pb-2.5 text-[16px] outline-none ${line(tone)} [&>option]:bg-noir [&>option]:text-ivory`}>
        {children}
      </select>
    </label>
  );
}

/** A large selectable card — delivery methods, payment methods, purposes */
export function Choice({ checked, onSelect, title, detail, aside, tone = 'dark', disabled }: { checked: boolean; onSelect: () => void; title: ReactNode; detail?: ReactNode; aside?: ReactNode; tone?: Tone; disabled?: boolean }) {
  const on = tone === 'dark' ? 'border-gold bg-gold/[0.06]' : 'border-noir bg-noir/[0.03]';
  const off = tone === 'dark' ? 'border-ivory/12 hover:border-ivory/35' : 'border-noir/12 hover:border-noir/40';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-start gap-4 border p-5 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-35 ${checked ? on : off}`}
    >
      <span className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${tone === 'dark' ? 'border-ivory/40' : 'border-noir/40'}`}>
        {checked && <span className={`h-2 w-2 rounded-full ${tone === 'dark' ? 'bg-gold' : 'bg-noir'}`} />}
      </span>
      <span className="flex-1">
        <span className={`block text-[15px] ${tone === 'dark' ? 'text-ivory' : 'text-noir'}`}>{title}</span>
        {detail && <span className={`mt-1 block text-[13px] leading-relaxed ${lab(tone)}`}>{detail}</span>}
      </span>
      {aside && <span className={`shrink-0 text-[14px] ${tone === 'dark' ? 'text-champagne' : 'text-antique'}`}>{aside}</span>}
    </button>
  );
}

export const btnGold =
  'inline-flex items-center justify-center bg-gold px-8 py-[18px] text-[11px] tracking-[0.26em] text-noir uppercase transition-colors duration-500 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-35';
export const btnGhost =
  'inline-flex items-center justify-center border border-ivory/25 px-8 py-[18px] text-[11px] tracking-[0.26em] text-ivory uppercase transition-colors duration-500 hover:border-gold hover:text-gold disabled:opacity-35';
export const btnInk =
  'inline-flex items-center justify-center bg-noir px-8 py-[18px] text-[11px] tracking-[0.26em] text-ivory uppercase transition-colors duration-500 hover:bg-antique disabled:cursor-not-allowed disabled:opacity-35';
