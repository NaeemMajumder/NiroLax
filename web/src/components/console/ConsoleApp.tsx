'use client';

import { useEffect, useState } from 'react';
import { ATELIER_DEMO, useDB, type Perm } from '@/lib/store';
import { API, resetDemo, signInAtelier, signOutStaff, toTop, useBooted, useDemo } from '@/lib/actions';
import { CataloguePanel } from './CataloguePanel';
import { ActivityPanel, MyPassword, ReportsPanel, ROLE_LABEL, SettingsPanel, StaffPanel } from './AdminPanels';
import { notify } from '@/lib/toast';
import { asset } from '@/lib/asset';
import { Lnk } from '@/components/ui/Lnk';
import { Field, btnGold } from '@/components/ui/Form';
import { Clients, Editions, Fittings, Messages, Orders, Overview, Production } from './Sections';

/** Tab, label, the permission it needs */
const TABS = [
  ['overview', 'Overview', 'overview'],
  ['fittings', 'Fittings', 'fittings'],
  ['production', 'Production', 'production'],
  ['orders', 'Orders', 'orders'],
  ['clients', 'Clients', 'clients'],
  ['catalogue', 'Catalogue', 'catalogue'],
  ['editions', 'Editions', 'editions'],
  ['messages', 'Messages', 'messages'],
  ['reports', 'Reports', 'reports'],
  ['settings', 'Settings', 'settings'],
  ['staff', 'Staff', 'staff'],
  ['activity', 'Activity', 'audit'],
] as const satisfies readonly (readonly [string, string, Perm])[];
type Tab = (typeof TABS)[number][0];

/** Sample staff for the demo (the same accounts the API seeds) */
const DEMO_STAFF = [
  ['Owner', 'atelier@nirolax.com', 'atelier2026'],
  ['Manager', 'farah@nirolax.com', 'Manager@1234'],
  ['Tailor', 'karim@nirolax.com', 'Tailor@1234'],
  ['Orders', 'rina@nirolax.com', 'Orders@1234'],
  ['Content', 'mitu@nirolax.com', 'Content@1234'],
] as const;

function AtelierSignIn() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isDemo = useDemo();
  return (
    <div className="grid min-h-svh place-items-center bg-noir px-5">
      <div className="w-full max-w-md border border-ivory/10 bg-graphite/40 p-8 md:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('brand/nirolax-lockup-horizontal-gold.svg')} alt="Nirolax" className="h-5 w-auto" />
        <p className="mt-10 font-display text-[30px] text-ivory">Atelier Console</p>
        <p className="mt-2 text-[14px] text-bone/50">For the people who make the pieces.</p>
        <form
          className="mt-10 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setErr('');
            signInAtelier(email, pw)
              .then(() => notify.ok('Welcome to the atelier', 'Your part of the console is below.'))
              .catch((x: Error) => setErr(x.message))
              .finally(() => setBusy(false));
          }}
        >
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          {err && <p className="text-[13px] text-[#c2566a]">{err}</p>}
          <button type="submit" disabled={busy} className={`${btnGold} w-full disabled:opacity-60`}>
            {busy ? 'One moment…' : 'Enter'}
          </button>
        </form>
        {isDemo && (
          <div className="mt-8 border-t border-ivory/10 pt-6 text-[12px] text-bone/45">
            <p>Demo accounts — each role sees a different console:</p>
            <ul className="mt-3 space-y-1.5">
              {(API ? DEMO_STAFF : DEMO_STAFF.slice(0, 1)).map(([role, e, p]) => (
                <li key={e} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="text-bone/70">{role}</span> · {e}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(e);
                      setPw(p);
                    }}
                    className="shrink-0 text-gold hover:underline"
                  >
                    {role === 'Owner' ? 'Fill in' : 'Use'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Lnk href="/" className="mt-6 inline-block text-[11px] tracking-[0.22em] text-bone/40 uppercase hover:text-ivory">
          ← Back to the site
        </Lnk>
      </div>
    </div>
  );
}

export function ConsoleApp() {
  const staff = useDB((d) => d.staff);
  const [tab, setTab] = useState<Tab>('overview');
  const ready = useBooted();
  const isDemo = useDemo();
  const unread = useDB((d) => (d.messages ?? []).filter((m) => !m.read).length);
  const isIn = !!staff;
  const tabs = TABS.filter(([, , perm]) => staff?.can.includes(perm));
  useEffect(() => {
    if (ready) toTop();
  }, [isIn, tab, ready]);
  if (!ready) return <div className="min-h-svh bg-noir" />;
  if (!staff) return <AtelierSignIn />;
  const shown = tabs.some(([k]) => k === tab) ? tab : 'overview';

  return (
    <div className="min-h-svh bg-graphite lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-ivory/10 bg-noir lg:sticky lg:top-0 lg:h-svh lg:overflow-y-auto lg:border-r lg:border-b-0 lg:pb-8">
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 lg:block lg:px-7 lg:pt-8 lg:pb-0">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('brand/nirolax-lockup-horizontal-gold.svg')} alt="Nirolax" className="h-4 w-auto" />
            <p className="mt-2 text-[10px] tracking-[0.26em] text-bone/40 uppercase lg:mt-3">Atelier Console</p>
          </div>
          {/* Phone and tablet: sign out sits in the header, top right */}
          <div className="lg:hidden">
            <SignOutButton />
          </div>
        </div>
        {/* Who is signed in */}
        <div className="mx-5 mb-4 flex items-center justify-between gap-3 border border-ivory/10 bg-ivory/[0.03] px-4 py-3 lg:mx-4 lg:mt-7 lg:mb-6 lg:block lg:p-4">
          <p className="min-w-0">
            <span className="block truncate text-[13px] text-ivory">{staff.name}</span>
            <span className="text-[10px] tracking-[0.22em] text-gold uppercase">{ROLE_LABEL[staff.role]}</span>
          </p>
          <Lnk href="/" className="shrink-0 text-[10px] tracking-[0.2em] text-bone/60 uppercase hover:text-ivory lg:mt-3 lg:block">
            View the site →
          </Lnk>
          {/* Laptop: sign out right here, above Overview */}
          <div className="mt-4 hidden lg:block">
            <SignOutButton className="w-full" />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:px-4 lg:pb-0">
          {tabs.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`shrink-0 px-4 py-2.5 text-left text-[12px] tracking-[0.16em] uppercase transition-colors lg:py-2.5 ${shown === k ? 'bg-ivory/[0.08] text-gold' : 'text-bone/60 hover:text-ivory'}`}
            >
              {l}
              {k === 'messages' && unread > 0 && <span className="ml-2 inline-grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] tracking-normal text-noir">{unread}</span>}
            </button>
          ))}
        </nav>
        {isDemo && staff.can.includes('backup') && (
          <div className="hidden px-7 pt-8 text-[11px] tracking-[0.18em] uppercase lg:block">
            <button onClick={() => confirmReset()} className="block text-bone/45 hover:text-ivory">
              Reset sample data
            </button>
          </div>
        )}
      </aside>
      <div className="min-w-0 px-5 py-8 lg:px-12 lg:py-14">
        {shown === 'overview' && (
          <div className="space-y-10">
            <Overview go={(t) => setTab(t as Tab)} />
            <MyPassword />
          </div>
        )}
        {shown === 'fittings' && <Fittings />}
        {shown === 'production' && <Production />}
        {shown === 'orders' && <Orders />}
        {shown === 'clients' && <Clients />}
        {shown === 'catalogue' && <CataloguePanel />}
        {shown === 'editions' && <Editions />}
        {shown === 'messages' && <Messages />}
        {shown === 'reports' && <ReportsPanel canBackup={staff.can.includes('backup')} />}
        {shown === 'settings' && <SettingsPanel />}
        {shown === 'staff' && <StaffPanel />}
        {shown === 'activity' && <ActivityPanel />}
      </div>
    </div>
  );
}

function SignOutButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOutStaff().then(() => notify.ok('You are signed out'), () => {})}
      className={`inline-flex shrink-0 items-center justify-center gap-2 border border-gold/70 px-4 py-2.5 text-[11px] tracking-[0.2em] text-gold uppercase transition-colors hover:bg-gold hover:text-noir focus-visible:bg-gold focus-visible:text-noir focus-visible:outline-none ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
        <path d="M10 17l-5-5 5-5" />
        <path d="M5 12h11" />
      </svg>
      Sign out
    </button>
  );
}

function confirmReset() {
  // window.confirm is blocked in some embedded previews, so reset directly; the data is only demo data.
  resetDemo().catch(() => {});
}
