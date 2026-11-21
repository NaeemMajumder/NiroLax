import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nirolax — Quiet luxury, made to measure',
    short_name: 'Nirolax',
    description: 'Ten pieces a season, cut by hand in our Dhaka atelier.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    icons: [{ src: '/brand/nirolax-app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
