/**
 * Shared, mutable state between the DOM (scroll, pointer) and the 3D scene.
 * Kept outside React so updating it never re-renders anything — the scene
 * reads it every frame.
 */
export const stage = {
  /** 0 → 1 across the pinned "story" section */
  progress: 0,
  /** Rotation the visitor has added by dragging (radians) */
  dragYaw: 0,
  /** Drag velocity, decays to give the turn some weight */
  dragVelocity: 0,
  /** True while a finger / mouse button is down on the stage */
  dragging: false,
  /** `#snap` in the URL: jump straight to each camera beat (used for screenshots) */
  snap: typeof window !== 'undefined' && window.location.hash === '#snap',
};

/**
 * Camera beats, one per chapter of the story. Positions are in metres around a
 * model that stands 2 m tall with its centre at the origin.
 * `yaw` turns the piece on its stand for that beat.
 */
export type Beat = {
  at: number;
  cam: [number, number, number];
  look: [number, number, number];
  yaw: number;
};

export const DESKTOP_BEATS: Beat[] = [
  { at: 0.0, cam: [-0.72, 0.08, 4.5], look: [-0.72, 0.02, 0], yaw: 0 },
  { at: 0.3, cam: [0.45, 0.5, 1.95], look: [0.1, 0.4, 0], yaw: 0.18 },
  { at: 0.58, cam: [-0.55, -0.05, 2.1], look: [0.05, -0.05, 0], yaw: -0.75 },
  { at: 0.82, cam: [0.25, 0.2, 2.4], look: [0.0, 0.1, 0], yaw: 2.6 },
  { at: 1.0, cam: [0.8, 0.05, 4.7], look: [0.8, 0.02, 0], yaw: 0.35 },
];

export const MOBILE_BEATS: Beat[] = [
  { at: 0.0, cam: [0, -0.48, 7.5], look: [0, -0.6, 0], yaw: 0 },
  { at: 0.3, cam: [0.25, 0.42, 2.3], look: [0.05, 0.22, 0], yaw: 0.18 },
  { at: 0.58, cam: [-0.4, -0.1, 2.3], look: [0.0, -0.15, 0], yaw: -0.75 },
  { at: 0.82, cam: [0.15, 0.3, 2.6], look: [0.0, 0.2, 0], yaw: 2.6 },
  { at: 1.0, cam: [0, -0.9, 7.6], look: [0, -1.0, 0], yaw: 0.35 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Interpolate the beats at progress p (0..1). Writes into `out` to avoid allocations. */
export function sampleBeats(beats: Beat[], p: number, out: { cam: number[]; look: number[]; yaw: number }) {
  let i = 0;
  while (i < beats.length - 2 && p > beats[i + 1].at) i++;
  const a = beats[i];
  const b = beats[i + 1];
  const t = smooth(Math.min(1, Math.max(0, (p - a.at) / (b.at - a.at))));
  for (let k = 0; k < 3; k++) {
    out.cam[k] = a.cam[k] + (b.cam[k] - a.cam[k]) * t;
    out.look[k] = a.look[k] + (b.look[k] - a.look[k]) * t;
  }
  out.yaw = a.yaw + (b.yaw - a.yaw) * t;
  return out;
}
