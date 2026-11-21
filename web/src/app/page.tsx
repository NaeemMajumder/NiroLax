import type { Metadata } from 'next';
import { Intro } from '@/components/site/Intro';
import { Hero } from '@/components/site/Hero';
import { Manifesto } from '@/components/site/Manifesto';
import { PieceStory } from '@/components/site/PieceStory';
import { Collection } from '@/components/site/Collection';
import { Appointment } from '@/components/site/Appointment';
import { Portal } from '@/components/site/Portal';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <>
      <Intro />
      <Hero />
      <Manifesto />
      <PieceStory />
      <Collection />
      <Appointment />
      <Portal />
    </>
  );
}
