'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { bdt } from '@/lib/pieces';
import { useDB } from '@/lib/store';
import { fetchBooking, fetchOrder, go, payDemo } from '@/lib/actions';

/**
 * Stand-in for the payment provider's page (SSLCommerz / bKash). On the live
 * site the customer is redirected to the real gateway and back.
 */
export function Gateway() {
  const q = useSearchParams();
  const orderId = q.get('order');
  const bookingId = q.get('booking');
  const method = (q.get('method') ?? 'card') as 'card' | 'bkash';
  const key = q.get('key');
  const [problem, setProblem] = useState('');
  const order = useDB((d) => d.orders.find((o) => o.id === orderId));
  const booking = useDB((d) => d.bookings.find((b) => b.id === bookingId));
  const [step, setStep] = useState<'enter' | 'otp' | 'working'>('enter');

  useEffect(() => {
    if (orderId) fetchOrder(orderId, key).catch(() => {});
    if (bookingId) fetchBooking(bookingId, key).catch(() => {});
  }, [orderId, bookingId, key]);

  const amount = order?.total ?? booking?.deposit ?? 0;
  const ref = order?.id ?? booking?.id;

  const finish = (approve: boolean) => {
    const kind = order ? 'order' : 'booking';
    const id = (order?.id ?? booking?.id)!;
    payDemo(kind, id, key, approve, method).then(go, (e: Error) => {
      setProblem(e.message);
      setStep('enter');
    });
  };
  const approve = () => {
    setStep('working');
    setTimeout(() => finish(true), 1400);
  };
  const decline = () => finish(false);

  if (!ref) return <p className="py-40 text-center text-bone/60">This payment link is no longer valid.</p>;

  const bk = method === 'bkash';
  return (
    <div className="grid min-h-svh place-items-center bg-[#f2f2f2] px-5 py-16 text-[#222]">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)]">
        <div className={`px-6 py-5 text-white ${bk ? 'bg-[#e2136e]' : 'bg-[#1f3c88]'}`}>
          <p className="text-[12px] opacity-80">{bk ? 'bKash Payment' : 'Secure card payment'} · Demo</p>
          <p className="mt-1 text-[15px] font-medium">Nirolax Atelier</p>
          <p className="mt-3 text-[28px] font-semibold">{bdt(amount)}</p>
          <p className="text-[12px] opacity-80">Ref {ref}</p>
        </div>
        <div className="p-6">
          {step === 'working' ? (
            <div className="py-10 text-center">
              <div className={`mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent ${bk ? 'border-[#e2136e]' : 'border-[#1f3c88]'}`} />
              <p className="mt-4 text-[14px] text-[#555]">Confirming payment…</p>
            </div>
          ) : step === 'enter' ? (
            <>
              <label className="block text-[12px] text-[#666]">
                {bk ? 'bKash account number' : 'Card number'}
                <input
                  defaultValue={bk ? '01XXXXXXXXX' : '4111 1111 1111 1111'}
                  className="mt-1 w-full rounded-md border border-[#ddd] px-3 py-2.5 text-[15px] outline-none focus:border-[#999]"
                />
              </label>
              {!bk && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input defaultValue="12 / 29" className="rounded-md border border-[#ddd] px-3 py-2.5 text-[15px]" aria-label="Expiry" />
                  <input defaultValue="123" className="rounded-md border border-[#ddd] px-3 py-2.5 text-[15px]" aria-label="CVV" />
                </div>
              )}
              <button onClick={() => setStep('otp')} className={`mt-5 w-full rounded-md py-3 text-[14px] font-medium text-white ${bk ? 'bg-[#e2136e]' : 'bg-[#1f3c88]'}`}>
                Continue
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] text-[#555]">Enter the code sent to your phone (any 6 digits in the demo).</p>
              <input defaultValue="123456" className="mt-3 w-full rounded-md border border-[#ddd] px-3 py-2.5 text-center text-[20px] tracking-[0.5em]" aria-label="One-time code" />
              <button onClick={approve} className={`mt-5 w-full rounded-md py-3 text-[14px] font-medium text-white ${bk ? 'bg-[#e2136e]' : 'bg-[#1f3c88]'}`}>
                Confirm payment
              </button>
            </>
          )}
          {problem && <p className="mt-3 text-[13px] text-[#c0392b]">{problem}</p>}
          {step !== 'working' && (
            <button onClick={decline} className="mt-3 w-full py-2 text-[13px] text-[#888] hover:text-[#333]">
              Cancel and go back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
