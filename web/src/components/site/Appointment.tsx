'use client';
import { useSite } from '@/lib/catalogue';

import { useEffect, useMemo, useState } from 'react';
import { MARK } from '@/lib/logo-paths';
import { href } from '@/components/ui/Lnk';

type Day = { key: string; weekday: string; day: number; month: string; full: string };

const TIMES = ['11:00', '13:00', '15:00', '17:00', '19:00'];

/** Next ten atelier days (closed on Fridays) */
function nextDays(): Day[] {
  const out: Day[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < 10) {
    if (d.getDay() !== 5) {
      out.push({
        key: d.toISOString().slice(0, 10),
        weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        day: d.getDate(),
        month: d.toLocaleDateString('en-GB', { month: 'short' }),
        full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Some slots already taken — stable per day so the demo looks consistent */
const isTaken = (dayKey: string, time: string) => (dayKey.charCodeAt(9) + time.charCodeAt(1)) % 3 === 0;

const label = (t: string) => {
  const h = Number(t.slice(0, 2));
  return `${h > 12 ? h - 12 : h} ${h >= 12 ? 'pm' : 'am'}`;
};

export function Appointment() {
  const site = useSite();
  const [days, setDays] = useState<Day[]>([]);
  const [day, setDay] = useState<Day | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => setDays(nextDays()), []);
  const ready = day && time && name.trim().length > 1;
  const guest = useMemo(() => name.trim() || 'Guest', [name]);

  return (
    <section id="appointment" data-tone="light" className="relative overflow-x-clip bg-bone text-noir">
      <div className="mx-auto grid max-w-[1440px] gap-16 px-5 py-28 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[6vw] md:px-[6vw] md:py-44">
        <div className="min-w-0 md:sticky md:top-32 md:self-start">
          <p data-reveal="fade" className="kicker text-antique!">
            The first fitting
          </p>
          <h2 data-reveal="lines" className="mt-5 font-display text-[clamp(40px,5vw,80px)] leading-[1.02]">
            An hour, and a tailor&rsquo;s <em className="text-antique">full attention.</em>
          </h2>
          <p data-reveal="fade" className="mt-8 max-w-md text-[16px] leading-[1.75] text-stone">
            You will be met at the door, offered tea, and measured by the tailor who will cut your piece. We discuss
            cloth, the way you stand, and how you mean to wear it.
          </p>
          <dl data-reveal="fade" className="mt-10 grid max-w-md grid-cols-3 border-y border-noir/10 py-6 text-[13px]">
            <div>
              <dt className="text-[10px] tracking-[0.22em] text-stone uppercase">Length</dt>
              <dd className="mt-2 font-display text-[20px]">60 min</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em] text-stone uppercase">Where</dt>
              <dd className="mt-2 font-display text-[20px]">Gulshan 2</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em] text-stone uppercase">Deposit</dt>
              <dd className="mt-2 font-display text-[20px]">BDT 10,000</dd>
            </div>
          </dl>
          <p data-reveal="fade" className="mt-4 max-w-md text-[12px] text-stone">
            The deposit is taken from the price of your piece. Change or cancel up to 24 hours before.
          </p>
        </div>

        {/* The invitation */}
        <div data-reveal="fade" className="relative min-w-0">
          <div className="relative bg-ivory p-2 shadow-[0_40px_80px_-30px_rgba(11,11,12,0.35)]">
            <div className="relative border border-gold/50 p-6 md:p-12">
              <div className="pointer-events-none absolute inset-1.5 border border-gold/25" />

              <svg viewBox={MARK.viewBox} className="mx-auto h-9 w-auto" aria-hidden>
                <path d={MARK.paths[0]} fill="#A9824A" />
              </svg>

              {!sent ? (
                <div className="mt-8">
                  <p className="text-center font-display text-[24px] md:text-[28px]">Request an appointment</p>
                  <p className="mt-2 text-center text-[13px] text-stone">Choose a day and an hour. We confirm within the hour.</p>

                  <fieldset className="mt-10 min-w-0">
                    <legend className="text-[10px] tracking-[0.24em] text-stone uppercase">Day</legend>
                    <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
                      {days.map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => {
                            setDay(d);
                            setTime(null);
                          }}
                          aria-pressed={day?.key === d.key}
                          className={`flex w-[68px] shrink-0 snap-start flex-col items-center py-3.5 transition-colors duration-500 ${
                            day?.key === d.key ? 'bg-noir text-ivory' : 'border border-noir/12 hover:border-noir/50'
                          }`}
                        >
                          <span className="text-[10px] tracking-[0.18em] uppercase opacity-70">{d.weekday}</span>
                          <span className="mt-1 font-display text-[26px] leading-none">{d.day}</span>
                          <span className="mt-1 text-[10px] tracking-[0.18em] uppercase opacity-70">{d.month}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mt-8 min-w-0" disabled={!day}>
                    <legend className="text-[10px] tracking-[0.24em] text-stone uppercase">Hour</legend>
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {TIMES.map((t) => {
                        const taken = day ? isTaken(day.key, t) : false;
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={!day || taken}
                            onClick={() => setTime(t)}
                            aria-pressed={time === t}
                            className={`py-3 text-[14px] transition-colors duration-500 ${
                              time === t
                                ? 'bg-noir text-ivory'
                                : taken
                                  ? 'text-noir/25 line-through'
                                  : 'border border-noir/12 hover:border-noir/50 disabled:opacity-40'
                            }`}
                          >
                            {label(t)}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <label className="mt-8 block">
                    <span className="text-[10px] tracking-[0.24em] text-stone uppercase">Your name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="As you would like to be greeted"
                      className="mt-3 w-full border-b border-noir/20 bg-transparent pb-3 font-display text-[22px] outline-none placeholder:text-noir/25 focus:border-antique"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => (window.location.href = href('/fittings') + `?day=${day!.key}&time=${time}&name=${encodeURIComponent(name.trim())}`)}
                    className="mt-10 w-full bg-noir py-[18px] text-[11px] tracking-[0.26em] text-ivory uppercase transition-colors duration-500 hover:bg-antique disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div className="mt-10 animate-[invite_1.2s_var(--ease-luxe)_both] text-center">
                  <p className="text-[10px] tracking-[0.3em] text-antique uppercase">You are expected</p>
                  <p className="mt-8 font-hand text-[30px] leading-snug text-noir/85 md:text-[36px]">Dear {guest},</p>
                  <p className="mx-auto mt-6 max-w-sm font-display text-[22px] leading-snug md:text-[26px]">
                    The atelier will expect you on {day!.full}, at {label(time!)}.
                  </p>
                  <div className="mx-auto mt-8 h-px w-16 bg-gold/60" />
                  <p className="mx-auto mt-8 max-w-xs text-[14px] leading-relaxed text-stone">
                    Abdul Karim, who will cut your piece, has set the hour aside. A confirmation follows by SMS.
                  </p>
                  <p className="mt-6 text-[12px] tracking-[0.12em] text-stone">{site.atelier.address1} · {site.atelier.address2}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setTime(null);
                    }}
                    className="mt-10 text-[11px] tracking-[0.24em] text-antique uppercase underline-offset-8 hover:underline"
                  >
                    Choose another time
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-stone">You choose the purpose and confirm on the next page.</p>
        </div>
      </div>
    </section>
  );
}
