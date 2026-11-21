'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { bareRoute } from '@/lib/chrome';
import { openCart, useDB } from '@/lib/store';
import { signOut, useBooted } from '@/lib/actions';
import { notify } from '@/lib/toast';
import { asset } from '@/lib/asset';
import { Lnk } from '@/components/ui/Lnk';

const links = [
  { label: 'Season I', href: '/season', also: ['/pieces'] },
  { label: 'The Atelier', href: '/atelier' },
  { label: 'Fittings', href: '/fittings' },
  { label: 'Journal', href: '/journal' },
  { label: 'Contact', href: '/contact' },
];

export function Nav() {
  const path = usePathname();
  // The section you are in: its own page, anything under it, and (for the season) every piece page
  const here = (path ?? '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const isActive = (l: (typeof links)[number]) =>
    [l.href, ...('also' in l && l.also ? l.also : [])].some((h) => here === h || here.startsWith(h + '/'));
  const bag = useDB((d) => d.cart.length);
  const [solid, setSolid] = useState(false);
  // True while a light (ivory/bone) section sits under the header — then the header turns solid dark
  const [overLight, setOverLight] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const ready = useBooted();
  const who = useDB((d) => {
    const s = d.session;
    if (s?.role === 'client') return d.clients.find((c) => c.id === s.clientId)?.name ?? null;
    return null;
  });
  const first = who && who !== 'atelier' ? who.split(' ')[0] : '';
  const initial = who === 'atelier' ? 'A' : first.charAt(0).toUpperCase();
  const leave = () => {
    setMenu(false);
    setOpen(false);
    signOut().then(
      () => notify.ok('You are signed out', 'See you at the atelier.'),
      (e: Error) => notify.err(e.message),
    );
  };

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-account]')) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  useEffect(() => {
    let last = window.scrollY;
    const checkLight = () => {
      const h = window.innerWidth >= 768 ? 80 : 64;
      setOverLight(
        Array.from(document.querySelectorAll<HTMLElement>('[data-tone="light"]')).some((el) => {
          const r = el.getBoundingClientRect();
          return r.top < h && r.bottom > 0;
        }),
      );
    };
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      checkLight();
      setHidden(y > 400 && y > last);
      last = y;
    };
    onScroll();
    const t = window.setTimeout(checkLight, 300); // after the new page has rendered
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkLight);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkLight);
    };
  }, [path]);

  if (bareRoute(path)) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,transform] duration-700 ease-(--ease-luxe) ${
        overLight ? 'bg-noir/95 shadow-[0_1px_0_rgba(220,175,106,0.15)] backdrop-blur-md' : solid || open ? 'bg-noir/75 backdrop-blur-md' : 'bg-transparent'
      } ${hidden && !open && !menu ? '-translate-y-full' : ''}`}
    >
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-20 md:px-10">
        <Lnk href="/" aria-label="Nirolax — home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('brand/nirolax-lockup-horizontal-gold.svg')} alt="Nirolax" className="h-[18px] w-auto md:h-[22px]" />
        </Lnk>

        <ul className="hidden items-center gap-9 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Lnk
                href={l.href}
                aria-current={isActive(l) ? 'page' : undefined}
                className={`relative py-2 text-[12px] tracking-[0.2em] uppercase transition-colors hover:text-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-500 ${
                  isActive(l) ? 'text-gold after:scale-x-100' : 'text-bone/80 after:scale-x-0 hover:after:scale-x-100'
                }`}
              >
                {l.label}
              </Lnk>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 md:gap-5">
          {/* Account: "Sign in" when signed out; initial + menu when signed in (shown on phones too) */}
          <div data-account className={`relative transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}>
            {who ? (
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label={`Account — ${who === 'atelier' ? 'Atelier' : who}`}
                className="flex h-11 items-center gap-2.5 text-bone/80 transition-colors hover:text-gold"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/60 font-display text-[15px] text-gold">{initial}</span>
                <span className="hidden text-[12px] tracking-[0.2em] uppercase xl:inline">{who === 'atelier' ? 'Atelier' : first}</span>
              </button>
            ) : (
              <Lnk
                href="/portal"
                aria-label="Sign in"
                className="flex h-11 items-center gap-2 text-[12px] tracking-[0.2em] text-bone/80 uppercase transition-colors hover:text-gold"
              >
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                  <circle cx="12" cy="8.5" r="3.5" />
                  <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
                </svg>
                <span className="hidden md:inline">Sign in</span>
              </Lnk>
            )}
            {menu && who && (
              <div role="menu" className="absolute top-full right-0 mt-2 w-60 border border-gold/25 bg-noir p-2 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9)]">
                <p className="px-3 pt-2 pb-3 text-[11px] tracking-[0.18em] text-bone/60 uppercase">
                  {who === 'atelier' ? 'Signed in · Atelier' : `Signed in · ${who}`}
                </p>
                {who === 'atelier' ? (
                  <Lnk role="menuitem" href="/console" onClick={() => setMenu(false)} className="block px-3 py-2.5 text-[14px] text-ivory hover:bg-ivory/[0.06]">
                    Atelier Console
                  </Lnk>
                ) : (
                  <>
                    <Lnk role="menuitem" href="/portal" onClick={() => setMenu(false)} className="block px-3 py-2.5 text-[14px] text-ivory hover:bg-ivory/[0.06]">
                      My portal
                    </Lnk>
                    <Lnk role="menuitem" href="/fittings" onClick={() => setMenu(false)} className="block px-3 py-2.5 text-[14px] text-ivory hover:bg-ivory/[0.06]">
                      Book a fitting
                    </Lnk>
                  </>
                )}
                <button role="menuitem" type="button" onClick={leave} className="block w-full px-3 py-2.5 text-left text-[14px] text-bone/60 hover:bg-ivory/[0.06] hover:text-ivory">
                  Sign out
                </button>
              </div>
            )}
          </div>
          <Lnk
            href="/fittings"
            className="hidden border border-gold/60 sm:inline-block px-4 py-2.5 text-[11px] tracking-[0.22em] text-gold uppercase transition-colors duration-500 hover:bg-gold hover:text-noir md:px-5"
          >
            Book a Fitting
          </Lnk>
          <button
            type="button"
            onClick={() => openCart(true)}
            aria-label={`Reservations (${bag})`}
            className="relative grid h-11 w-11 place-items-center text-bone/80 transition-colors hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
              <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            {bag > 0 && <span className="absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] text-noir">{bag}</span>}
          </button>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center lg:hidden"
          >
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-ivory transition-transform duration-500 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 h-px w-6 bg-ivory transition-transform duration-500 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <ul className="border-t border-gold/15 px-5 pt-4 pb-8 lg:hidden">
          {links.map((l) => (
            <li key={l.label}>
              <Lnk
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l) ? 'page' : undefined}
                className={`flex items-center gap-3 py-3 font-display text-2xl transition-colors hover:text-gold ${isActive(l) ? 'text-gold' : 'text-ivory'}`}
              >
                {l.label}
                {isActive(l) && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />}
              </Lnk>
            </li>
          ))}
          <li className="mt-6 border-t border-ivory/10 pt-6">
            {who ? (
              <>
                <p className="text-[11px] tracking-[0.2em] text-bone/60 uppercase">{who === 'atelier' ? 'Signed in · Atelier' : `Signed in · ${who}`}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Lnk href={who === 'atelier' ? '/console' : '/portal'} onClick={() => setOpen(false)} className="border border-gold/60 px-5 py-3 text-[11px] tracking-[0.22em] text-gold uppercase">
                    {who === 'atelier' ? 'Atelier Console' : 'My portal'}
                  </Lnk>
                  <button type="button" onClick={leave} className="px-5 py-3 text-[11px] tracking-[0.22em] text-bone/60 uppercase">
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Lnk href="/portal" onClick={() => setOpen(false)} className="border border-gold/60 px-5 py-3 text-[11px] tracking-[0.22em] text-gold uppercase">
                  Client sign in
                </Lnk>
                <Lnk href="/fittings" onClick={() => setOpen(false)} className="bg-gold px-5 py-3 text-[11px] tracking-[0.22em] text-noir uppercase sm:hidden">
                  Book a fitting
                </Lnk>
                <Lnk href="/console" onClick={() => setOpen(false)} className="basis-full pt-3 text-[11px] tracking-[0.2em] text-bone/60 uppercase">
                  Atelier staff →
                </Lnk>
              </div>
            )}
          </li>
        </ul>
      )}
    </header>
  );
}
