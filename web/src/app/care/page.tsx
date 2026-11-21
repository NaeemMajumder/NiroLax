import type { Metadata } from 'next';
import { Prose } from '@/components/ui/Prose';

export const metadata: Metadata = { alternates: { canonical: '/care' }, title: 'Care of your piece', description: 'How to brush, hang, press and store a Nirolax piece — and when to bring it back to the atelier.' };

export default function CarePage() {
  return (
    <Prose
      kicker="Care"
      title={<>Care of <em className="text-champagne">your piece.</em></>}
      dek="Good cloth asks for very little: rest, a brush, and to be left alone by the dry cleaner."
      sections={[
        { h: 'After wearing', p: ['Empty the pockets and hang the jacket on its shaped hanger for a day before it goes back in the wardrobe. The wool recovers its shape as it rests.', 'Brush it downwards with a soft clothes brush to lift dust from the weave.'] },
        { h: 'Pressing', p: ['Steam rather than iron. If a crease needs pressing, use a cloth between the iron and the wool, and never press the lapels flat — their roll is built in by hand.', 'We press any Nirolax piece free of charge at the atelier, for life.'] },
        { h: 'Cleaning', p: ['Dry clean as rarely as you can — no more than twice a season. Silk and velvet pieces should go only to a specialist; we can recommend one in Dhaka.'] },
        { h: 'Storing', p: ['Keep pieces in the cotton bag they came in, away from direct light. In the monsoon months, a cedar block in the wardrobe keeps moths and damp away.'] },
        { h: 'Silk, satin & velvet', p: ['Satin lapels and silk gowns mark easily: keep perfume and deodorant to the skin, not the cloth, and let them dry before dressing. Never steam velvet face-down; hang it in a steamy bathroom and let the pile lift on its own.'] },
        { h: 'Travelling', p: ['Fold a jacket inside out along the shoulders, lapels inward, and lay it on top in the case. Hang it as soon as you arrive. Our garment bags fold in three and fit carry-on luggage.'] },
        { h: 'Alterations', p: ['Made-to-measure pieces are altered free for a year from delivery. Ready-to-wear pieces are altered free within thirty days. After that, alterations are charged at cost — and as your shape changes over the years, we keep your pattern so a piece can be let out or taken in properly.'] },
      ]}
    />
  );
}
