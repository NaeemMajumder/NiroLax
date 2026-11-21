import type { MetadataRoute } from 'next';
import { getCatalogue } from '@/lib/catalogue.server';
import { articles } from '@/lib/journal';

export const dynamic = 'force-static';
export const revalidate = 3600;
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'monthly') => ({ url: `${SITE}${path}`, lastModified: now, changeFrequency, priority });
  const pieces = await getCatalogue();
  return [
    page('/', 1, 'weekly'),
    page('/season', 0.9, 'weekly'),
    ...pieces.map((p) => page(`/pieces/${p.slug}`, 0.8, 'weekly')),
    page('/fittings', 0.8),
    page('/atelier', 0.6),
    page('/journal', 0.6, 'weekly'),
    ...articles.map((a) => page(`/journal/${a.slug}`, 0.5)),
    page('/faq', 0.5),
    page('/contact', 0.5),
    page('/delivery', 0.4),
    page('/care', 0.4),
    page('/terms', 0.2, 'yearly'),
    page('/privacy', 0.2, 'yearly'),
  ];
}
