import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bdt, pieceImage } from '@/lib/pieces';
import { getCatalogue } from '@/lib/catalogue.server';
import { Gallery } from '@/components/piece/Gallery';
import { Purchase } from '@/components/piece/Purchase';
import { PieceCard } from '@/components/ui/PieceCard';
import { Lnk } from '@/components/ui/Lnk';

// New pieces added in the console get a page on first visit
export const dynamicParams = true;
export const revalidate = 30;
export const generateStaticParams = async () => (await getCatalogue()).map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const p = (await getCatalogue()).find((x) => x.slug === slug) ?? (await getCatalogue(true)).find((x) => x.slug === slug);
  if (!p) return {};
  const img = pieceImage(p, 'front');
  return {
    title: `${p.name} — Nº ${p.no}`,
    description: `${p.line} ${p.cloth}. Numbered edition of ${p.edition}. Ready to wear ${bdt(p.rtw)} · made to measure from ${bdt(p.mtm)}.`,
    alternates: { canonical: `/pieces/${p.slug}` },
    openGraph: { type: 'website', title: p.name, description: p.line, ...(img && /^https?:/.test(img) ? { images: [{ url: img }] } : {}) },
  };
}

const steps = [
  ['Reserve a fitting', 'Sixty minutes at the Gulshan atelier with the tailor who will cut your piece.'],
  ['Three fittings', 'Basted, forward and final — each one closer, each change chalked on you.'],
  ['Followed by you', 'Every stage photographed in your client portal, with the date it will be ready.'],
];

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  let pieces = await getCatalogue();
  // A piece added in the console a moment ago: ask the API directly instead of the 30-second cache
  if (!pieces.some((x) => x.slug === slug)) pieces = await getCatalogue(true);
  const piece = pieces.find((x) => x.slug === slug);
  if (!piece) notFound();

  const idx = pieces.indexOf(piece);
  const related = [...pieces.filter((p) => p !== piece && p.kind === piece.kind), ...pieces.filter((p) => p !== piece && p.kind !== piece.kind)].slice(0, 3);
  const prev = pieces[(idx - 1 + pieces.length) % pieces.length];
  const next = pieces[(idx + 1) % pieces.length];

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const img = pieceImage(piece, 'front');
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: piece.name,
      description: `${piece.line} ${piece.story}`,
      sku: `NX-${piece.no}`,
      brand: { '@type': 'Brand', name: 'Nirolax' },
      material: piece.composition,
      category: piece.kind,
      ...(img ? { image: [img.startsWith('http') ? img : site + img.replace(/^\./, '')] } : {}),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BDT',
        price: piece.rtw,
        availability: piece.remaining > 0 ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut',
        url: `${site}/pieces/${piece.slug}`,
        seller: { '@type': 'Organization', name: 'Nirolax' },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Season I', item: `${site}/season` },
        { '@type': 'ListItem', position: 2, name: piece.name, item: `${site}/pieces/${piece.slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="bg-noir pt-24 md:pt-28">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-24 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-[5vw] md:px-[6vw] md:pb-36">
          <div className="max-md:-mx-5">
            <Gallery piece={piece} />
          </div>
          <div className="md:sticky md:top-28 md:self-start">
            <nav className="mb-8 text-[11px] tracking-[0.2em] text-bone/60 uppercase" aria-label="Breadcrumb">
              <Lnk href="/season" className="hover:text-gold">
                Season I
              </Lnk>{' '}
              / <span className="text-bone/60">Nº {piece.no}</span>
            </nav>
            <Purchase piece={piece} />
          </div>
        </div>
      </section>

      {/* The story */}
      <section data-tone="light" className="bg-ivory text-noir">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-[6vw] md:py-36">
          <p data-reveal="fade" className="kicker text-antique!">
            The piece
          </p>
          <p data-reveal="lines" className="mt-8 max-w-[24ch] font-display text-[clamp(30px,3.6vw,56px)] leading-[1.16]">
            {piece.story}
          </p>
          <div className="mt-20 grid gap-x-10 gap-y-12 border-t border-noir/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            {piece.details.map((d, i) => (
              <div key={d.title} data-reveal="fade" data-delay={i * 0.08}>
                <p className="font-display text-[15px] text-antique italic">{String(i + 1).padStart(2, '0')}</p>
                <h2 className="mt-3 font-display text-[26px]">{d.title}</h2>
                <p className="mt-3 text-[15px] leading-[1.7] text-stone">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Made to measure */}
      <section className="bg-graphite">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-[6vw] md:px-[6vw] md:py-32">
          <div>
            <p data-reveal="fade" className="kicker">
              Made to measure
            </p>
            <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(36px,4vw,64px)] leading-[1.04] text-ivory">
              Cut for you, <em className="text-champagne">and only you.</em>
            </h2>
            <Lnk
              href="/#appointment"
              data-reveal="fade"
              className="mt-10 inline-block bg-gold px-8 py-[18px] text-[11px] tracking-[0.26em] text-noir uppercase transition-colors duration-500 hover:bg-gold-light"
            >
              Book a fitting
            </Lnk>
          </div>
          <ol className="divide-y divide-ivory/10 border-y border-ivory/10">
            {steps.map(([t, b], i) => (
              <li key={t} data-reveal="fade" data-delay={i * 0.08} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 py-8">
                <span className="font-display text-[26px] text-gold/70 italic">{['I', 'II', 'III'][i]}</span>
                <div>
                  <h3 className="font-display text-[24px] text-ivory">{t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-bone/60">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* More from the season */}
      <section className="bg-noir">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-[6vw] md:py-36">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 data-reveal="lines" className="font-display text-[clamp(34px,3.6vw,56px)] leading-[1.04] text-ivory">
              From the same season
            </h2>
            <Lnk href="/season" className="text-[11px] tracking-[0.26em] text-gold uppercase hover:text-gold-light">
              All ten pieces
            </Lnk>
          </div>
          <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
            {related.map((p) => (
              <li key={p.slug} data-reveal="fade">
                <PieceCard piece={p} />
              </li>
            ))}
          </ul>
          <div className="mt-24 grid grid-cols-2 border-t border-ivory/10 pt-8 text-[13px]">
            <Lnk href={`/pieces/${prev.slug}`} className="group">
              <span className="text-[10px] tracking-[0.26em] text-bone/60 uppercase">Previous · Nº {prev.no}</span>
              <span className="mt-2 block font-display text-[20px] text-ivory group-hover:text-champagne md:text-[24px]">{prev.name}</span>
            </Lnk>
            <Lnk href={`/pieces/${next.slug}`} className="group text-right">
              <span className="text-[10px] tracking-[0.26em] text-bone/60 uppercase">Next · Nº {next.no}</span>
              <span className="mt-2 block font-display text-[20px] text-ivory group-hover:text-champagne md:text-[24px]">{next.name}</span>
            </Lnk>
          </div>
        </div>
      </section>
    </>
  );
}
