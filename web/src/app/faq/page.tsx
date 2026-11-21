import type { Metadata } from 'next';
import { FAQ } from '@/lib/faq';
import { Faq } from '@/components/faq/Faq';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { alternates: { canonical: '/faq' },
  title: 'Questions',
  description: 'Editions, made-to-measure, fittings, payment, delivery, returns and care — answered by the atelier.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.flatMap((g) => g.items).map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a.join(' ') } })),
};

export default function FaqPage() {
  return (
    <>
      <PageHeader kicker="Questions" title={<>Asked, <em className="text-champagne">and answered.</em></>} dek="What clients most often ask before their first piece — about editions, fittings, payment, delivery and care." />
      <Faq />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
