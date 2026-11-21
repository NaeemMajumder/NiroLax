import Link from 'next/link';
import type { ComponentProps } from 'react';

const EXPORT = process.env.NEXT_PUBLIC_EXPORT === '1';

/**
 * Internal URL. On the live site this is the normal route ("/pieces/x").
 * In the static preview it becomes a file path relative to the export root
 * ("pieces/x.html"), which every page resolves through its <base> tag.
 */
export function href(path: string) {
  if (!EXPORT || !path.startsWith('/')) return path;
  const [route, hash] = path.split('#');
  const file = route === '/' ? 'index.html' : `${route.slice(1).replace(/\/$/, '')}.html`;
  return hash ? `${file}#${hash}` : file;
}

type Props = Omit<ComponentProps<'a'>, 'href'> & { href: string };

/** Internal link — client-side navigation on the live site, a plain link in the preview. */
export function Lnk({ href: to, ...props }: Props) {
  if (EXPORT || to.startsWith('#') || to.startsWith('mailto:')) return <a href={href(to)} {...props} />;
  return <Link href={to} {...props} />;
}
