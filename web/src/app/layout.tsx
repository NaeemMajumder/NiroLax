import type { Metadata, Viewport } from 'next';
import '@fontsource/bodoni-moda/latin-400.css';
import '@fontsource/bodoni-moda/latin-400-italic.css';
import '@fontsource/bodoni-moda/latin-500.css';
import '@fontsource/jost/latin-300.css';
import '@fontsource/jost/latin-400.css';
import '@fontsource/jost/latin-500.css';
import '@fontsource/homemade-apple/latin-400.css';
import './globals.css';
import { SmoothScroll } from '@/components/site/SmoothScroll';
import { Cursor } from '@/components/motion/Cursor';
import { Motion } from '@/components/motion/Motion';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Toaster } from '@/components/ui/Toaster';
import { CatalogueProvider } from '@/lib/catalogue';
import { getCatalogue, getPublicSettings } from '@/lib/catalogue.server';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const DESCRIPTION = 'Ten pieces a season, cut by hand in our Dhaka atelier. Numbered editions of evening and ceremony wear — ready to wear or made to your measure.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Nirolax — Quiet luxury, made to measure', template: '%s — Nirolax' },
  description: DESCRIPTION,
  applicationName: 'Nirolax',
  keywords: ['Nirolax', 'made to measure', 'bespoke tailoring Dhaka', 'tuxedo Bangladesh', 'sherwani', 'luxury menswear', 'evening wear', 'Gulshan atelier'],
  icons: { icon: '/brand/nirolax-app-icon.svg', apple: '/brand/nirolax-app-icon.svg' },
  openGraph: { type: 'website', siteName: 'Nirolax', locale: 'en_BD', url: SITE, title: 'Nirolax — Quiet luxury, made to measure', description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: 'Nirolax — Quiet luxury, made to measure', description: DESCRIPTION },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0c',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [pieces, site] = await Promise.all([getCatalogue(), getPublicSettings()]);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="grain" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ClothingStore',
              name: site.atelier.name,
              url: SITE,
              logo: `${SITE}/brand/nirolax-app-icon.svg`,
              image: `${SITE}/opengraph-image`,
              description: DESCRIPTION,
              telephone: site.atelier.phone,
              email: site.atelier.email,
              priceRange: '৳৳৳৳',
              sameAs: Object.values(site.social ?? {}).filter(Boolean),
              paymentAccepted: 'Cash, bKash, Nagad, Visa, Mastercard, American Express',
              currenciesAccepted: 'BDT',
              address: { '@type': 'PostalAddress', streetAddress: site.atelier.address1, addressLocality: 'Dhaka', postalCode: '1212', addressCountry: 'BD' },
              openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].filter((_, i) => !site.closedWeekdays.includes((i + 6) % 7)), opens: site.hours[0], closes: '20:00' }],
            }),
          }}
        />
        <CatalogueProvider pieces={pieces} site={site}>
          <SmoothScroll />
          <Motion />
          <Cursor />
          <Nav />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </CatalogueProvider>
      </body>
    </html>
  );
}
