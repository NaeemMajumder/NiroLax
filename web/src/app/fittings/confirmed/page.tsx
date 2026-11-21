import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Confirmed } from '@/components/fittings/Confirmed';

export const metadata: Metadata = { title: 'You are expected', robots: { index: false } };

export default function ConfirmedPage() {
  return (
    <div className="min-h-svh bg-noir">
      <Suspense>
        <Confirmed />
      </Suspense>
    </div>
  );
}
