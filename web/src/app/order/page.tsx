import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OrderConfirmed } from '@/components/checkout/OrderConfirmed';

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } };

export default function OrderPage() {
  return (
    <div className="min-h-svh bg-noir">
      <Suspense>
        <OrderConfirmed />
      </Suspense>
    </div>
  );
}
