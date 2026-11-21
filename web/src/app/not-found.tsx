import { Lnk } from '@/components/ui/Lnk';

export default function NotFound() {
  return (
    <section className="grid min-h-svh place-items-center bg-noir px-5 text-center">
      <div>
        <p className="kicker">Not found</p>
        <h1 className="mt-5 font-display text-[clamp(44px,6vw,96px)] leading-none text-ivory">
          This page <em className="text-champagne">was never cut.</em>
        </h1>
        <Lnk href="/" className="mt-10 inline-block border border-gold/60 px-8 py-4 text-[11px] tracking-[0.26em] text-gold uppercase hover:bg-gold hover:text-noir">
          Return home
        </Lnk>
      </div>
    </section>
  );
}
