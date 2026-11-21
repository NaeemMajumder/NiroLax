import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articles, findArticle } from '@/lib/journal';
import { Lnk } from '@/components/ui/Lnk';
import { asset } from '@/lib/asset';

export const dynamicParams = false;
export const generateStaticParams = () => articles.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = findArticle((await params).slug);
  return a ? { title: `${a.title} — Journal`, description: a.dek, alternates: { canonical: `/journal/${a.slug}` }, openGraph: { type: 'article', title: a.title, description: a.dek, images: [{ url: `/${a.cover}`, alt: a.coverAlt }] } } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = findArticle((await params).slug);
  if (!a) notFound();
  const next = articles[(articles.indexOf(a) + 1) % articles.length];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.dek,
    image: `/${a.cover}`,
    author: { '@type': 'Organization', name: 'Nirolax' },
    publisher: { '@type': 'Organization', name: 'Nirolax' },
    mainEntityOfPage: `/journal/${a.slug}`,
  };
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="bg-noir pt-36 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-3xl px-5">
          <p data-reveal="fade" className="kicker">
            Journal · {a.kicker}
          </p>
          <h1 data-reveal="lines" className="mt-6 font-display text-[clamp(44px,6vw,88px)] leading-[1.02] text-ivory">
            {a.title}
          </h1>
          <p data-reveal="fade" className="mt-8 text-[18px] leading-relaxed text-bone/65">
            {a.dek}
          </p>
          <p data-reveal="fade" className="mt-8 text-[12px] tracking-[0.16em] text-bone/60 uppercase">
            {a.date} · {a.minutes} min read
          </p>
        </div>
      </header>
      <figure className="bg-noir pb-16 md:pb-24">
        <div data-reveal="image" className="relative mx-auto aspect-[16/10] max-w-5xl overflow-hidden md:px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(a.cover)} alt={a.coverAlt} className="h-full w-full object-cover" />
        </div>
      </figure>
      <div data-tone="light" className="bg-ivory text-noir">
        <div className="mx-auto max-w-2xl px-5 py-20 md:py-28">
          {a.body.map((b, i) => (
            <div key={i} data-reveal="fade" className={i ? 'mt-12' : ''}>
              {b.h && <h2 className="mb-4 font-display text-[28px]">{b.h}</h2>}
              <p className={`leading-[1.85] text-noir/80 ${i === 0 ? 'font-display text-[24px] leading-[1.5] text-noir' : 'text-[18px]'}`}>{b.p}</p>
            </div>
          ))}
          <div className="mt-20 border-t border-noir/10 pt-8">
            <p className="text-[10px] tracking-[0.26em] text-stone uppercase">Next in the journal</p>
            <Lnk href={`/journal/${next.slug}`} className="mt-3 block font-display text-[30px] hover:text-antique">
              {next.title}
            </Lnk>
          </div>
        </div>
      </div>
    </article>
  );
}
