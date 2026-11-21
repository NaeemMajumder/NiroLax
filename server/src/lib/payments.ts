/**
 * Payments. PAYMENT_PROVIDER=demo sends the customer to the web app's demo
 * gateway; =sslcommerz opens a real SSLCommerz session (cards, bKash, Nagad and
 * EMI are all offered on the SSLCommerz page).
 */
import { env } from '../env.js';

export type PayKind = 'order' | 'booking';
type Start = { kind: PayKind; id: string; amount: number; method: 'card' | 'bkash'; customer: { name: string; phone: string; email?: string; address?: string; city?: string } };

const sslBase = () => (env.SSLCZ_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com');

export async function startPayment(p: Start): Promise<string> {
  if (env.PAYMENT_PROVIDER === 'demo') {
    return `/pay?${p.kind}=${encodeURIComponent(p.id)}&method=${p.method}`;
  }
  const back = `${env.API_URL}/api/v1/payments/sslcommerz`;
  const form = new URLSearchParams({
    store_id: env.SSLCZ_STORE_ID!,
    store_passwd: env.SSLCZ_STORE_PASSWORD!,
    total_amount: String(p.amount),
    currency: 'BDT',
    tran_id: `${p.kind}:${p.id}`,
    success_url: `${back}/return`,
    fail_url: `${back}/return`,
    cancel_url: `${back}/return`,
    ipn_url: `${back}/ipn`,
    cus_name: p.customer.name,
    cus_email: p.customer.email || 'no-email@nirolax.com',
    cus_add1: p.customer.address || 'Dhaka',
    cus_city: p.customer.city || 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: p.customer.phone,
    shipping_method: 'NO',
    product_name: p.kind === 'order' ? 'Nirolax piece' : 'Fitting deposit',
    product_category: 'Clothing',
    product_profile: 'physical-goods',
    ...(p.method === 'bkash' ? { multi_card_name: 'bkash' } : {}),
  });
  const r = await fetch(`${sslBase()}/gwprocess/v4/api.php`, { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
  const j = (await r.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
  if (j.status !== 'SUCCESS' || !j.GatewayPageURL) throw new Error('SSLCommerz: ' + (j.failedreason ?? 'could not start payment'));
  return j.GatewayPageURL;
}

/** Ask SSLCommerz whether a payment really went through (never trust the browser redirect alone). */
export async function validateSsl(valId: string): Promise<{ ok: boolean; tranId?: string; amount?: number }> {
  const u = new URL(`${sslBase()}/validator/api/validationserverAPI.php`);
  u.searchParams.set('val_id', valId);
  u.searchParams.set('store_id', env.SSLCZ_STORE_ID!);
  u.searchParams.set('store_passwd', env.SSLCZ_STORE_PASSWORD!);
  u.searchParams.set('format', 'json');
  const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
  const j = (await r.json()) as { status?: string; tran_id?: string; amount?: string };
  return { ok: j.status === 'VALID' || j.status === 'VALIDATED', tranId: j.tran_id, amount: Number(j.amount) };
}
