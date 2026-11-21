import type { Metadata } from 'next';
import { Prose } from '@/components/ui/Prose';
import { Lnk } from '@/components/ui/Lnk';
import { getPublicSettings } from '@/lib/catalogue.server';

export const metadata: Metadata = { alternates: { canonical: '/terms' }, title: 'Terms of sale', description: 'The terms on which Nirolax makes, sells and delivers its pieces.' };

const L = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Lnk href={to} className="text-antique underline-offset-4 hover:underline">
    {children}
  </Lnk>
);

export default async function TermsPage() {
  const { atelier, deposit } = await getPublicSettings();
  const where = `${atelier.address1}, ${atelier.address2}, Bangladesh`;
  return (
    <Prose
      kicker="Terms"
      title="Terms of sale"
      dek="Plainly written. If anything here is unclear, ask us before you order — we would rather explain than surprise you."
      updated="20 November 2026"
      sections={[
        {
          h: 'Who we are',
          p: [
            `Nirolax is the trading name of Nirolax Atelier Ltd., a tailoring house registered in Bangladesh, with its atelier at ${where}. In these terms “we” means Nirolax and “you” means the person placing an order, booking a fitting or using this website.`,
            'These terms apply to every order placed on nirolax.com, by telephone, by WhatsApp or at the atelier. By placing an order you agree to them.',
          ],
        },
        {
          h: 'Editions',
          p: [
            'Each piece is made in a fixed, numbered edition. Edition numbers are given in the order pieces are finished and cannot be chosen or reserved. When an edition closes, the piece is not made again.',
            'The number of pieces remaining shown on the website is updated as orders are paid. In the rare case that two orders are paid for the last number at the same moment, the later order is refunded in full the same day.',
          ],
        },
        {
          h: 'Prices',
          p: [
            'Prices are in Bangladeshi taka (BDT) and include VAT. Delivery within Bangladesh is free. We may change prices for future orders; the price you pay is the one shown when you check out.',
            'Made-to-measure prices on the website are the starting price for the piece as designed. The final price is confirmed in writing at the first fitting, once cloth and details are agreed, and does not change after that.',
          ],
        },
        {
          h: 'Placing an order',
          p: [
            'A ready-to-wear size you reserve is held for 24 hours. Your order is accepted when payment is received — or, for cash on delivery, when we confirm it by SMS. We send a receipt by SMS and, if you gave one, by email.',
            'We may decline an order if a piece is no longer available, if the details given are incomplete, or if we reasonably suspect fraud. If we decline an order after payment, we refund it in full.',
          ],
        },
        {
          h: 'Payment',
          p: [
            'Payment is by card or bKash through SSLCommerz, a licensed payment gateway, or in cash on delivery within Dhaka. We never see or store your card number or bKash PIN.',
            'Card instalments (EMI) are offered by your bank through SSLCommerz; the bank’s own terms apply to them.',
          ],
        },
        {
          h: 'Made to measure',
          p: [
            `Made-to-measure begins with a fitting. A first fitting for a new piece asks for a BDT ${deposit.toLocaleString('en-IN')} deposit, which is taken from the price of the piece. The balance is due at the final fitting, before the piece leaves the atelier.`,
            'We will give you a ready-by date when the cloth is cut, and keep it up to date in your client portal. If we cannot meet a date we agreed for a specific occasion, you may cancel and we refund everything you have paid.',
            'Once cloth is cut, a made-to-measure order cannot be cancelled, because the piece can be worn by no one else. Instead we alter it free of charge for a year from delivery until it fits as agreed.',
          ],
        },
        {
          h: 'Appointments',
          p: [
            'You may move or cancel an appointment free of charge up to 24 hours before it. The deposit is then refunded in full within seven working days. Within 24 hours, or if you do not come, the deposit stays on your account for your next appointment for six months.',
          ],
        },
        {
          h: 'Delivery',
          p: [
            <>
              Delivery times, collection from the atelier and what happens if no one is home are set out on our <L to="/delivery">delivery page</L>. The piece is your responsibility from the moment it is handed to you or to the person you name.
            </>,
          ],
        },
        {
          h: 'Returns & refunds',
          p: [
            'Ready-to-wear pieces may be returned unworn, with their tags and certificate, within seven days of delivery. We collect them free of charge and refund the full price to the original payment method within seven working days of receiving the piece; for cash on delivery we refund by bKash or bank transfer.',
            'This does not affect your rights under the Consumer Rights Protection Act 2009 or the Digital Commerce Operation Guidelines 2021 if a piece is faulty or not as described.',
          ],
        },
        {
          h: 'Alterations & aftercare',
          p: [
            <>
              Made-to-measure pieces are altered free for a year from delivery, ready-to-wear pieces within thirty days. Pressing at the atelier is free for the life of the piece. Our <L to="/care">care page</L> explains how to look after it.
            </>,
          ],
        },
        {
          h: 'Our responsibility',
          p: [
            'We are responsible for loss or damage you suffer that is a foreseeable result of our breaking these terms or failing to use reasonable care. We are not responsible for loss that was not foreseeable, or for business loss. Nothing here limits liability that cannot be limited by law.',
          ],
        },
        {
          h: 'This website',
          p: [
            'The photographs, text, designs and the Nirolax name and mark belong to Nirolax and may not be copied for commercial use. We take care that information on the website is accurate, but colours on screen can differ slightly from the cloth.',
            <>
              How we look after your personal details is described in our <L to="/privacy">privacy notice</L>.
            </>,
          ],
        },
        {
          h: 'Changes to these terms',
          p: [
            'We may update these terms from time to time, for example when the law or our services change. The date at the top shows when they last changed. The terms that apply to an order are the ones published on the day you placed it.',
          ],
        },
        {
          h: 'Disputes & contact',
          p: [
            'These terms are governed by the laws of Bangladesh, and the courts of Dhaka have jurisdiction. Before anything else, please speak to us — almost everything can be put right at a fitting.',
            <>
              Write to <a href={`mailto:${atelier.email}`} className="text-antique underline-offset-4 hover:underline">{atelier.email}</a>, call {atelier.phone}, or use our <L to="/contact">contact page</L>. Complaints are acknowledged within two working days and answered within seven.
            </>,
          ],
        },
      ]}
    />
  );
}
