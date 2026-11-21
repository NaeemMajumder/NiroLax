import type { Metadata } from 'next';
import { ConsoleApp } from '@/components/console/ConsoleApp';

export const metadata: Metadata = { title: 'Atelier Console', robots: { index: false, follow: false } };

export default function ConsolePage() {
  return <ConsoleApp />;
}
