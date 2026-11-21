import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Gateway } from '@/components/checkout/Gateway';

export const metadata: Metadata = { title: 'Payment', robots: { index: false } };

export default function PayPage() {
  return (
    <Suspense>
      <Gateway />
    </Suspense>
  );
}
