'use client';

import { WORDMARK } from '@/lib/logo-paths';
import { Lnk } from '@/components/ui/Lnk';
import { usePathname } from 'next/navigation';
import { bareRoute } from '@/lib/chrome';
import { useState } from 'react';
import { subscribe, useDemo } from '@/lib/actions';
import { notify } from '@/lib/toast';
import { useSite } from '@/lib/catalogue';
import { openDays } from '@/lib/hours';


const cols = [
  {
    title: 'The House',
    links: [
      ['Season I', '/season'],
      ['The Atelier', '/atelier'],
      ['Journal', '/journal'],
      ['Care of your piece', '/care'],
      ['Contact & visit', '/contact'],
    ],
  },
  {
    title: 'Service',
    links: [
      ['Book a fitting', '/fittings'],
      ['Client portal', '/portal'],
      ['Questions (FAQ)', '/faq'],
      ['Delivery & returns', '/delivery'],
      ['Terms of sale', '/terms'],
      ['Privacy', '/privacy'],
      ['Atelier staff sign-in', '/console'],
    ],
  },
];

function Letter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-8 flex max-w-sm border-b border-ivory/25 focus-within:border-gold"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        subscribe(email)
          .then(
            (already) => {
              setEmail('');
              if (already) notify.info('You are already on the list', 'The next letter comes with the spring pieces.');
              else notify.ok('Welcome to the Letter', 'Four letters a year, and the new pieces before anyone else.');
            },
            (x: Error) => notify.err(x.message),
          )
          .finally(() => setBusy(false));
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        aria-label="Your email"
        className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-ivory outline-none placeholder:text-bone/35"
      />
      <button disabled={busy} className="py-3 pl-4 text-[11px] tracking-[0.24em] text-gold uppercase disabled:opacity-50">
        {busy ? '…' : 'Join'}
      </button>
    </form>
  );
}

export function Footer() {
  const path = usePathname();
  const isDemo = useDemo();
  const site = useSite();
  if (bareRoute(path)) return null;
  const links: [string, string | undefined][] = [
    ['Instagram', site.social?.instagram],
    ['Facebook', site.social?.facebook],
    ['YouTube', site.social?.youtube],
    ['Pinterest', site.social?.pinterest],
  ];
  const social = links.filter((x): x is [string, string] => !!x[1]);
  return (
    <footer id="footer" className="relative overflow-hidden bg-noir">
      <div className="mx-auto max-w-[1440px] px-5 pt-24 md:px-[6vw] md:pt-36">
        <div className="grid gap-16 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
          <div>
            <p className="kicker">The Letter</p>
            <p className="mt-5 max-w-sm font-display text-[28px] leading-snug text-ivory">
              Four letters a year. New pieces before anyone else, and nothing more.
            </p>
<Letter />
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[10px] tracking-[0.3em] text-bone/60 uppercase">{c.title}</p>
              <ul className="mt-6 space-y-3">
                {c.links.map(([l, to]) => (
                  <li key={l}>
                    <Lnk href={to} className="text-[15px] text-bone/75 transition-colors hover:text-gold">
                      {l}
                    </Lnk>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-[10px] tracking-[0.3em] text-bone/60 uppercase">The Atelier</p>
            <address className="mt-6 text-[15px] leading-[1.9] text-bone/75 not-italic">
              {site.atelier.address1}
              <br />
              {site.atelier.address2}
              <br />
              {openDays(site.closedWeekdays)}, by appointment
              <br />
              <a href={`tel:${site.atelier.phone.replace(/[^+\d]/g, '')}`} className="hover:text-gold">
                {site.atelier.phone}
              </a>
              <br />
              <a href={`mailto:${site.atelier.email}`} className="hover:text-gold">
                {site.atelier.email}
              </a>
            </address>
            <Lnk href="/contact" className="mt-5 inline-block text-[11px] tracking-[0.22em] text-gold uppercase hover:text-gold-light">
              Find the atelier →
            </Lnk>
            {social.length > 0 && (
              <ul aria-label="Nirolax on social media" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] tracking-[0.2em] uppercase">
                {social.map(([name, url]) => (
                  <li key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-bone/70 transition-colors hover:text-gold">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Name, edge to edge */}
      <div className="mt-24 px-3 md:mt-36 md:px-[3vw]">
        <svg viewBox={WORDMARK.viewBox} className="w-full" aria-label="Nirolax">
          <defs>
            <linearGradient id="foot-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#DCAF6A" />
              <stop offset="1" stopColor="#7A5C2E" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <g transform={WORDMARK.transform || undefined}>
            <path d={WORDMARK.paths[0]} fill="url(#foot-g)" />
          </g>
        </svg>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-6 text-[11px] tracking-[0.16em] text-stone uppercase md:flex-row md:items-center md:justify-between md:px-[6vw]">
          <p>© {new Date().getFullYear()} Nirolax Atelier Ltd. · Dhaka, Bangladesh</p>
          <p className="normal-case tracking-[0.08em]">
            <span className="uppercase tracking-[0.16em]">We accept</span> &nbsp;bKash · Nagad · Visa · Mastercard · Amex · Cash at the atelier
          </p>
          <p>{isDemo ? 'Demo — sample content' : 'Made by hand in Dhaka'}</p>
        </div>
      </div>
    </footer>
  );
}
