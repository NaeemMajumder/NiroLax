import type { Metadata } from 'next';
import { Prose } from '@/components/ui/Prose';
import { getPublicSettings } from '@/lib/catalogue.server';

export const metadata: Metadata = { alternates: { canonical: '/privacy' }, title: 'Privacy', description: 'What Nirolax keeps about you, why, and how to see or delete it.' };

export default async function PrivacyPage() {
  const { atelier } = await getPublicSettings();
  return (
    <Prose
      kicker="Privacy"
      title="Your privacy"
      dek="A tailor knows your measurements. We keep them, and everything else you tell us, with the same discretion."
      updated="20 November 2026"
      sections={[
        {
          h: 'What we keep',
          p: [
            'When you order, book a fitting or write to us: your name, mobile number, email and delivery address.',
            'When you are measured: your measure sheet, fitting notes and photographs of your piece as it is made.',
            'When you buy: a record of your orders, appointments and payments. Card and bKash details are handled by SSLCommerz and never reach us.',
            'When you use the website: the pages you visit and the device you use, through privacy-respecting analytics, so we can see what works and fix what does not.',
          ],
        },
        {
          h: 'Why we keep it',
          p: [
            'To make, deliver and alter your pieces; to confirm and remind you of appointments by SMS; to show you your pieces in the client portal; to answer your notes; to keep the records the law asks of us; and — only if you join the Letter — to send you our letter four times a year.',
          ],
        },
        {
          h: 'Who sees it',
          p: [
            'The people in the atelier who make your piece; our courier, who sees your name, number and address to deliver; SSLCommerz for payment; and the providers who run our website, database, SMS and image storage on our behalf, under contract and only for these purposes.',
            'We do not sell or rent your details to anyone, and we do not share your measurements outside the atelier.',
          ],
        },
        {
          h: 'Signing in',
          p: [
            'The client portal uses your mobile number and a six-digit code sent by SMS — there is no password to steal. A single cookie keeps you signed in on your device for 30 days; signing out removes it.',
          ],
        },
        {
          h: 'Cookies',
          p: [
            'We use a sign-in cookie, a record of your reservation bag in your browser, and analytics. If we add advertising measurement (such as the Meta pixel) to the shop pages, it will never run on the client portal, and we will update this notice first.',
          ],
        },
        {
          h: 'How long we keep it',
          p: [
            'Orders and payments: as long as tax law requires, currently six years. Measure sheets: for as long as you are a client, so your next piece starts from your pattern — or until you ask us to delete them. Notes from the contact form: two years.',
          ],
        },
        {
          h: 'Your choices',
          p: [
            'You may ask to see what we keep about you, to correct it, to have a printed copy of your measure sheet, or to have your details deleted (except what we must keep by law). You may leave the Letter at any time from the link in each letter.',
          ],
        },
        {
          h: 'Security',
          p: [
            'Your details are stored encrypted with our database provider, reached only over secure connections, and seen in the atelier console only by staff who sign in. If anything ever went wrong, we would tell you promptly.',
          ],
        },
        {
          h: 'Children',
          p: ['Our services are meant for adults. We do not knowingly keep details about anyone under eighteen except as part of an order placed by a parent or guardian — measurements for a wedding sherwani, for example.'],
        },
        {
          h: 'Changes to this notice',
          p: ['If we change how we use your details, we will update this page and the date at the top. If the change is significant, we will tell clients with an account by email or SMS before it takes effect.'],
        },
        {
          h: 'Contact',
          p: [`Nirolax Atelier Ltd. is responsible for your details. Write to privacy@nirolax.com, call ${atelier.phone}, or write to Nirolax, ${atelier.address1}, ${atelier.address2}. We reply within seven days.`],
        },
      ]}
    />
  );
}
