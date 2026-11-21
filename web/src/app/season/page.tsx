import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { SeasonGrid } from '@/components/season/SeasonGrid';

export const metadata: Metadata = { alternates: { canonical: '/season' },
  title: 'Season I',
  description: 'Ten pieces, each made in a numbered edition. Ready to wear, or made to your measure.',
};

export default function SeasonPage() {
  return (
    <>
      <PageHeader
        kicker="Season I · Autumn–Winter 2026"
        title={
          <>
            Ten pieces. <em className="text-champagne">Numbered.</em>
          </>
        }
        dek="Each piece is made in a fixed edition. When an edition closes, its pattern is retired and it is not made again."
      />
      <SeasonGrid />
    </>
  );
}
