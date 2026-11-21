import type { Metadata } from 'next';
import { Prose } from '@/components/ui/Prose';
import { Lnk } from '@/components/ui/Lnk';

export const metadata: Metadata = { alternates: { canonical: '/delivery' }, title: 'Delivery, returns & sizing', description: 'Free delivery across Bangladesh, seven-day returns on ready-to-wear, and how to choose your size.' };

const sizes = [
  ['46', '92', '78', '44'],
  ['48', '96', '82', '45'],
  ['50', '100', '86', '46'],
  ['52', '104', '90', '47'],
  ['54', '108', '94', '48'],
];
const gowns = [
  ['34', '82', '64', '90'],
  ['36', '86', '68', '94'],
  ['38', '90', '72', '98'],
  ['40', '94', '76', '102'],
  ['42', '98', '80', '106'],
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-noir/20 text-[10px] tracking-[0.2em] text-stone uppercase">
            {head.map((h) => (
              <th key={h} className="py-3 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-noir/10">
              {r.map((c, i) => (
                <td key={i} className={`py-3 pr-4 ${i ? 'text-noir/70' : 'font-display text-[17px]'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DeliveryPage() {
  return (
    <Prose
      kicker="Service"
      title={<>Delivery, returns <em className="text-champagne">& sizing.</em></>}
      dek="Every piece arrives pressed, boxed and numbered, by our own courier — and if it is not right, we put it right."
      updated="20 November 2026"
      sections={[
        {
          h: 'Delivery',
          p: [
            'Delivery is free. Within Dhaka our own courier delivers within three working days of your order; anywhere else in Bangladesh within five, by our partner courier. Made-to-measure pieces are delivered after the final fitting, or collected then.',
            'We send an SMS the day before with a two-hour window, and the courier calls before arriving. Every piece arrives on its shaped hanger, in a cotton garment bag inside the Nirolax box, with its certificate of edition.',
            'If no one is home, we try again the next working day. After two attempts, the piece returns to the atelier and we arrange a time with you.',
          ],
        },
        {
          h: 'Collecting from the atelier',
          p: [
            'Choose “Collect from the atelier” at checkout and come any day Saturday to Thursday, 11 am to 8 pm, from the day after your order. A tailor will be there to make any last adjustment while you wait.',
          ],
        },
        {
          h: 'Outside Bangladesh',
          p: ['Not yet from the website. Write to us and we will arrange international delivery by DHL for ready-to-wear pieces, at cost, with duties paid by you.'],
        },
        {
          h: 'Reservations',
          p: ['A ready-to-wear size can be held for 24 hours while you decide. After that it returns to the edition for someone else. You will see the time left in your bag.'],
        },
        {
          h: 'Returns',
          p: [
            'Ready-to-wear pieces may be returned unworn, with their tags and certificate, within seven days of delivery. Tell us by WhatsApp, phone or the contact page and we collect the piece from you free of charge.',
            'We refund the full price to the original payment method within seven working days of receiving the piece. Cash-on-delivery orders are refunded by bKash or bank transfer.',
            'Made-to-measure pieces cannot be returned, because they are cut for one person — but they are altered free for a year until they fit as agreed.',
          ],
        },
        {
          h: 'Exchanges',
          p: ['If a ready-to-wear size is not right, we will first try to adjust it at the atelier, free. If another size of the same piece is still in the edition, we can exchange it within seven days.'],
        },
        {
          h: 'If something is wrong',
          p: ['If a piece arrives damaged or not as you ordered, tell us within 48 hours with a photograph. We collect it the same or next day and replace, repair or refund it — your choice.'],
        },
        {
          id: 'sizing',
          h: 'Sizing',
          p: [
            'Jackets and suits are sized by chest in European sizes 46 to 54; gowns 34 to 42. Measurements below are of the body, in centimetres, not of the garment. Between sizes, choose the larger — we will take it in at no charge.',
            <Table key="j" head={['Jacket', 'Chest', 'Waist', 'Shoulder']} rows={sizes} />,
            <Table key="g" head={['Gown', 'Bust', 'Waist', 'Hip']} rows={gowns} />,
            <>
              Unsure? <Lnk href="/fittings" className="text-antique underline-offset-4 hover:underline">Book a fitting</Lnk> — there is no obligation to choose made-to-measure, and a tailor will tell you your size in five minutes.
            </>,
          ],
        },
        {
          h: 'Payment',
          p: ['We accept cards and bKash through SSLCommerz, and cash on delivery within Dhaka. Made-to-measure begins with a BDT 10,000 deposit, which is taken from the price of the piece.'],
        },
      ]}
    />
  );
}
