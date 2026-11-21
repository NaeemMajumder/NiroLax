'use client';

import { useEffect, useState } from 'react';
import { asset } from '@/lib/asset';
import { STAGES } from '@/lib/stages';

type Props = {
  stage: number;
  stageDates: (number | null)[];
  /** Photos uploaded by the atelier for this commission (stage slug -> URL) */
  photos?: Record<string, string>;
  readyBy?: string;
};

const short = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** The stage photograph: the atelier's own photo, else the house photo for that stage, else a placeholder */
function StagePhoto({ index, current, date, photo }: { index: number; current: boolean; date: number | null; photo?: string }) {
  const s = STAGES[index];
  const [missing, setMissing] = useState(false);
  useEffect(() => setMissing(false), [index]);
  const src = photo ?? asset(`atelier/stages/${s.slug}.webp`);
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#2a2724_0%,#141313_70%)]">
      {!missing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt={s.name} onError={() => setMissing(true)} className="absolute inset-0 h-full w-full animate-[invite_0.9s_var(--ease-luxe)_both] object-cover" />
      ) : (
        <div key={s.slug} className="absolute inset-0 flex animate-[invite_0.9s_var(--ease-luxe)_both] justify-center pt-[9%]">
          <div className="pointer-events-none absolute inset-4 border border-gold/20" />
          <div className="text-center">
            <p className="font-display text-[64px] leading-none text-gold/25 italic">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-3 text-[10px] tracking-[0.3em] text-bone/60 uppercase">Photograph of this stage</p>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-16">
        <p className="text-[10px] tracking-[0.26em] text-gold uppercase">
          {current ? 'Now' : date ? short(date) : 'Coming'} · Stage {index + 1} of {STAGES.length}
        </p>
        <p className="mt-1 font-display text-[22px] text-ivory">{s.name}</p>
        <p className="mt-1 max-w-sm text-[13px] text-bone/70">{s.note}</p>
      </div>
    </div>
  );
}

/** Where a made-to-measure piece is: photo of the chosen stage, progress bar, the eleven stages. */
export function StageTracker({ stage, stageDates, photos = {}, readyBy }: Props) {
  const [view, setView] = useState(stage);
  useEffect(() => setView(stage), [stage]);
  return (
    <div>
      {readyBy && (
        <p className="mb-5 text-[13px] text-bone/60">
          Ready <span className="font-display text-[18px] text-champagne">{new Date(readyBy + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </p>
      )}
      <StagePhoto index={view} current={view === stage} date={stageDates[view]} photo={photos[STAGES[view].slug]} />
      <div className="mt-6 h-px w-full bg-ivory/10">
        <div className="h-full bg-gold transition-[width] duration-700" style={{ width: `${((stage + 0.5) / STAGES.length) * 100}%` }} />
      </div>
      <ol className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {STAGES.map((s, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => setView(i)}
                aria-pressed={view === i}
                className={`flex w-full items-center gap-4 border-b py-3 text-left transition-colors duration-300 ${view === i ? 'border-gold/40' : 'border-ivory/[0.06] hover:border-ivory/20'}`}
              >
                <span className="relative grid h-4 w-4 shrink-0 place-items-center">
                  {current && <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />}
                  <span className={`h-2 w-2 rounded-full ${done ? 'bg-gold' : current ? 'bg-champagne' : 'border border-ivory/25'}`} />
                </span>
                <span className={`flex-1 text-[14px] ${done ? 'text-bone/70' : current ? 'text-ivory' : 'text-bone/60'}`}>{s.name}</span>
                {photos[s.slug] && <span className="text-[10px] tracking-[0.2em] text-gold/70 uppercase">Photo</span>}
                <span className="text-[12px] text-bone/60">{stageDates[i] ? short(stageDates[i]!) : current ? 'Now' : ''}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
