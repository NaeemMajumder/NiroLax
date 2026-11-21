'use client';

import { Toaster as Sonner } from 'sonner';

const Icon = ({ d, tone }: { d: string; tone: string }) => (
  <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${tone}`} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Quiet notices for everything the visitor does: dark card, gold hairline, one line of detail. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={{ top: 96 }}
      mobileOffset={{ top: 76, left: 12, right: 12 }}
      visibleToasts={3}
      duration={4200}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group pointer-events-auto flex w-full items-start gap-3.5 border border-gold/25 bg-[#0e0e0f]/95 px-5 py-4 text-ivory shadow-[0_24px_60px_-18px_rgba(0,0,0,0.85)] backdrop-blur-md font-sans md:w-[380px]',
          title: 'text-[14px] leading-snug text-ivory',
          description: 'mt-1 text-[13px] leading-snug text-bone/60',
          icon: 'mt-0.5 shrink-0',
          actionButton: 'ml-auto shrink-0 self-center border border-gold/50 px-3 py-1.5 text-[10px] tracking-[0.22em] text-gold uppercase hover:bg-gold hover:text-noir',
          cancelButton: 'ml-auto shrink-0 self-center px-2 py-1.5 text-[10px] tracking-[0.22em] text-bone/60 uppercase',
          error: 'border-[#c2566a]/40',
        },
      }}
      icons={{
        success: <Icon d="M5 12.5l4.2 4.2L19 7" tone="text-gold" />,
        error: <Icon d="M12 7.5v5.5M12 16.5v.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" tone="text-[#d9788a]" />,
        info: <Icon d="M12 11v5.5M12 7.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" tone="text-champagne" />,
        warning: <Icon d="M12 8v5M12 16.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" tone="text-gold" />,
        loading: <span className="mt-0.5 block h-4 w-4 animate-spin rounded-full border border-gold/30 border-t-gold" />,
      }}
    />
  );
}
