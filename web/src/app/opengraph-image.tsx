import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'Nirolax — Quiet luxury, made to measure';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The social preview: black, a gold rule, the wordmark */
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%, #1d1a16 0%, #0b0b0c 70%)', color: '#f2ede4', fontFamily: 'serif' }}>
        <div style={{ fontSize: 22, letterSpacing: 10, color: '#dcaf6a', textTransform: 'uppercase' }}>Season I · Dhaka</div>
        <div style={{ marginTop: 28, fontSize: 132, letterSpacing: 36, paddingLeft: 36 }}>NIROLAX</div>
        <div style={{ marginTop: 18, width: 120, height: 1, background: '#dcaf6a' }} />
        <div style={{ marginTop: 30, fontSize: 34, fontStyle: 'italic', color: '#d9cdb8' }}>Quiet luxury, made to measure</div>
        <div style={{ marginTop: 14, fontSize: 22, color: '#8f877b' }}>Ten numbered pieces a season · cut by hand in our atelier</div>
      </div>
    ),
    size,
  );
}
