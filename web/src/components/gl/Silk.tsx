'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Live satin: a full-screen shader that draws slow-moving folds of silk.
 * No model, no texture — just maths, so it is light on phones and never
 * looks low-resolution. Used behind the hero and as the fabric preview for
 * pieces that do not have photography yet.
 */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec3 uColor;
  uniform vec3 uSheen;
  uniform float uGloss;
  uniform float uScale;
  uniform float uExposure;

  // Smooth value noise (quintic, so no grid lines)
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  // Height of the cloth: a few long folds, slowly drifting
  float height(vec2 p) {
    float t = uTime * 0.12;
    vec2 q = vec2(noise(p * 0.45 + vec2(t * 0.5, 0.0)), noise(p * 0.45 + vec2(7.3, -t * 0.4)));
    vec2 w = p + (q - 0.5) * 2.2 + (uMouse - 0.5) * 0.5;
    // Mostly-parallel diagonal folds, bent by the warp above — how a length of silk hangs
    float u1 = dot(w, normalize(vec2(1.0, 0.42)));
    float u2 = dot(w, normalize(vec2(1.0, 0.05)));
    float h = sin(u1 * 3.1 + t * 1.2) * 0.5;
    h += sin(u2 * 4.7 - t * 0.8 + 1.7) * 0.22;
    h += sin(u1 * 8.3 + t * 0.6) * 0.04;
    return h;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uScale;

    float e = 0.004 * uScale;
    float h = height(p);
    float hx = height(p + vec2(e, 0.0)) - h;
    float hy = height(p + vec2(0.0, e)) - h;
    vec3 n = normalize(vec3(-hx / e * 0.42, -hy / e * 0.42, 1.0));

    vec3 L = normalize(vec3(-0.45, 0.65, 0.62));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);

    float diff = clamp(dot(n, L), 0.0, 1.0);
    float ndh = clamp(dot(n, H), 0.0, 1.0);
    float spec = pow(ndh, uGloss);          // tight satin highlight along the folds
    float broad = pow(ndh, uGloss * 0.22);  // soft bloom around it
    float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);

    vec3 col = uColor * (0.5 + 0.7 * diff);
    col += uSheen * (spec * 0.55 + broad * 0.16);
    col += uSheen * rim * 0.06;

    vec2 d = uv - 0.5;
    col *= 1.0 - dot(d, d) * 1.1;                       // vignette
    col += (hash(uv * uRes + uTime) - 0.5) * 0.012;      // grain, so gradients never band

    gl_FragColor = vec4(col * uExposure, 1.0);
  }
`;

type SilkProps = {
  color?: string;
  sheen?: string;
  gloss?: number;
  scale?: number;
  exposure?: number;
  /** Follow the mouse a little */
  interactive?: boolean;
};

function SilkPlane({ color = '#121214', sheen = '#c9a467', gloss = 38, scale = 2.4, exposure = 1, interactive = true, still = false }: SilkProps & { still?: boolean }) {
  const { size, gl, invalidate } = useThree();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uColor: { value: new THREE.Color(color) },
      uSheen: { value: new THREE.Color(sheen) },
      uGloss: { value: gloss },
      uScale: { value: scale },
      uExposure: { value: exposure },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Colour changes animate rather than snap
  const target = useMemo(() => new THREE.Color(color), [color]);
  const targetSheen = useMemo(() => new THREE.Color(sheen), [sheen]);
  // A still (non-animated) canvas only draws on demand: redraw it when the colours change
  useEffect(() => {
    if (still) invalidate();
  }, [still, color, sheen, invalidate]);

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: PointerEvent) => mouse.current.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [interactive]);

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(dt, 0.05);
    u.uRes.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio());
    (u.uMouse.value as THREE.Vector2).lerp(mouse.current, 0.03);
    (u.uColor.value as THREE.Color).lerp(target, still ? 1 : 0.08);
    (u.uSheen.value as THREE.Color).lerp(targetSheen, still ? 1 : 0.08);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

/**
 * What this device can do: 'hard' = a real GPU, 'soft' = software rendering (SwiftShader, llvmpipe —
 * headless browsers, some low-end phones), 'none' = no WebGL. Software rendering draws one still frame
 * instead of animating, so the page stays responsive.
 */
let tier: 'hard' | 'soft' | 'none' | null = null;
function glTier() {
  if (tier) return tier;
  try {
    const c = document.createElement('canvas');
    const g = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!g) return (tier = 'none');
    const ext = g.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
    tier = /swiftshader|llvmpipe|software|basic render/i.test(name) ? 'soft' : 'hard';
    g.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    tier = 'none';
  }
  return tier;
}

export function Silk({ className = '', dpr = 1, alwaysOn = false, ...props }: SilkProps & { className?: string; dpr?: number; alwaysOn?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'wait' | 'hard' | 'soft' | 'none'>('wait');
  const [hidden, setHidden] = useState(false);

  // Start the shader once the page has settled, so it never competes with the first paint
  useEffect(() => {
    const go = () => setMode(glTier());
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 1500 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(go, 600);
    return () => clearTimeout(t);
  }, []);

  // Only animate while on screen, and never in a background tab
  useEffect(() => {
    const el = wrap.current;
    if (!el || alwaysOn) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [alwaysOn]);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = mode === 'hard' && (alwaysOn || visible) && !reduce && !hidden;
  const base = props.color ?? '#0f0f11';

  return (
    <div ref={wrap} className={className} aria-hidden style={{ background: `radial-gradient(120% 90% at 30% 20%, ${props.sheen ?? '#3a3226'}22 0%, ${base} 60%)` }}>
      {(mode === 'hard' || mode === 'soft') && (
        <Canvas
          dpr={mode === 'soft' ? 0.75 : Math.min(dpr, typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
          frameloop={animate ? 'always' : 'demand'}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          flat
          linear
        >
          <SilkPlane {...props} still={!animate} />
        </Canvas>
      )}
    </div>
  );
}
