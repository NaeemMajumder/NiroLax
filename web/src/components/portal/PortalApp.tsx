'use client';

import { useDB } from '@/lib/store';
import { toTop, useBooted } from '@/lib/actions';
import { useEffect } from 'react';
import { SignIn } from './SignIn';
import { Dashboard } from './Dashboard';

export function PortalApp() {
  const session = useDB((d) => d.session);
  const clients = useDB((d) => d.clients);
  // Wait until we know who is signed in before choosing a screen (avoids a flash of the sign-in form)
  const ready = useBooted();
  const who = session?.role === 'client' ? session.clientId : null;
  useEffect(() => {
    if (ready) toTop();
  }, [who, ready]);
  if (!ready) return <div className="min-h-svh" />;
  const me = session?.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;
  return me ? <Dashboard me={me} /> : <SignIn />;
}
