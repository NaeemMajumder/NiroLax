import { isLight, sheenFor } from '@/lib/pieces';

const hexA = (hex: string, a: number) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
};

/**
 * A still "photograph" of the cloth for pieces without photography yet:
 * long bands of light across satin in the piece's colour. Pure CSS — cheap
 * enough to use many times on one page. On hover the light drifts.
 */
export function Swatch({ tint, no, className = '' }: { tint: string; no?: string; className?: string }) {
  const sheen = sheenFor(tint);
  const light = isLight(tint);
  const k = light ? 1 : 0.85; // strength of the highlights
  return (
    <div className={`overflow-hidden ${/\babsolute\b/.test(className) ? "" : "relative "}${className}`} style={{ backgroundColor: tint }} aria-hidden>
      {/* Folds: alternating shadow and light, like satin hanging in long diagonal folds */}
      <div
        className="absolute -inset-[25%] transition-transform duration-[1800ms] ease-(--ease-luxe) group-hover:translate-x-[5%] group-hover:-translate-y-[3%]"
        style={{
          background: [
            `linear-gradient(108deg,
              rgba(0,0,0,0.35) 0%,
              ${hexA(sheen, 0.0)} 10%,
              ${hexA(sheen, 0.42 * k)} 19%,
              ${hexA(sheen, 0.06 * k)} 26%,
              rgba(0,0,0,0.30) 34%,
              ${hexA(sheen, 0.04 * k)} 42%,
              ${hexA(sheen, 0.30 * k)} 50%,
              ${hexA(sheen, 0.0)} 57%,
              rgba(0,0,0,0.28) 64%,
              ${hexA(sheen, 0.05 * k)} 72%,
              ${hexA(sheen, 0.36 * k)} 80%,
              ${hexA(sheen, 0.0)} 87%,
              rgba(0,0,0,0.35) 100%)`,
            `radial-gradient(ellipse at 28% 22%, ${hexA(sheen, 0.22 * k)} 0%, transparent 55%)`,
          ].join(','),
          filter: 'blur(6px)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(0,0,0,0.4)_100%)]" />
      {no && (
        <span
          className={`absolute bottom-5 left-6 font-display text-[clamp(56px,7vw,110px)] leading-none italic ${light ? 'text-noir/20' : 'text-ivory/15'}`}
        >
          {no}
        </span>
      )}
    </div>
  );
}
