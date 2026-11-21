import type { Metadata } from 'next';
import { PortalApp } from '@/components/portal/PortalApp';

export const metadata: Metadata = { title: 'Client portal', robots: { index: false } };

export default function PortalPage() {
  return (
    <div className="min-h-svh bg-noir">
      <PortalApp />
    </div>
  );
}
