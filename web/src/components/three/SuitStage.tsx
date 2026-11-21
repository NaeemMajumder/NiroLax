'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SuitModel } from './SuitModel';
import { DESKTOP_BEATS, MOBILE_BEATS, sampleBeats, stage } from '@/lib/stage';

const MODEL_URL = `${process.env.NEXT_PUBLIC_ASSET_BASE ?? '/'}models/midnight-tuxedo.glb`;
useGLTF.preload(MODEL_URL, false, true);

/* ── Camera + turntable, driven by scroll progress and drag ─────────────── */

function Rig({ turntable }: { turntable: React.RefObject<THREE.Group | null> }) {
  const { camera, size, pointer } = useThree();
  const look = useRef(new THREE.Vector3(-0.75, 0, 0));
  const sample = useMemo(() => ({ cam: [0, 0, 0], look: [0, 0, 0], yaw: 0 }), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const reduce = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const k = stage.snap ? 60 : 3; // camera follow speed
    const mobile = size.width < 768;
    sampleBeats(mobile ? MOBILE_BEATS : DESKTOP_BEATS, stage.progress, sample);

    // Drag inertia
    if (!stage.dragging) {
      stage.dragYaw += stage.dragVelocity;
      stage.dragVelocity *= Math.pow(0.9, dt * 60);
    }

    // Idle sway at the top of the page, so the piece feels alive before any input
    const idle = reduce || stage.snap || stage.progress > 0.04 ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.32;

    if (turntable.current) {
      const yaw = sample.yaw + stage.dragYaw + idle;
      turntable.current.rotation.y = THREE.MathUtils.damp(turntable.current.rotation.y, yaw, stage.snap ? 60 : 4, dt);
    }

    // Subtle parallax from the mouse on desktop
    const px = mobile ? 0 : pointer.x * 0.12;
    const py = mobile ? 0 : pointer.y * 0.06;
    target.set(sample.cam[0] + px, sample.cam[1] + py, sample.cam[2]);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, k, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, k, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, k, dt);

    look.current.x = THREE.MathUtils.damp(look.current.x, sample.look[0], k, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, sample.look[1], k, dt);
    look.current.z = THREE.MathUtils.damp(look.current.z, sample.look[2], k, dt);
    camera.lookAt(look.current);
  });

  return null;
}

/* ── A soft pool of light on the floor under the piece ─────────────────── */

function FloorGlow() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(234,219,192,0.22)');
    grad.addColorStop(0.35, 'rgba(220,175,106,0.07)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -1.002, 0]}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ── Studio lighting ───────────────────────────────────────────────────── */

function Studio() {
  return (
    <>
      <ambientLight intensity={0.08} />
      {/* Key: warm spot from above, slightly in front */}
      <spotLight
        position={[0.9, 4.6, 2.8]}
        angle={0.38}
        penumbra={0.85}
        intensity={140}
        decay={2}
        color="#fff4e3"
      />
      {/* Gold rim from behind-left, cool edge from behind-right — separates black cloth from black ground */}
      <directionalLight position={[-3, 2.4, -3.2]} intensity={2.6} color="#dcaf6a" />
      <directionalLight position={[3.2, 1.6, -2.4]} intensity={1.4} color="#c9d2e0" />
      {/* Low fill so the trouser legs don't vanish */}
      <pointLight position={[0, -0.4, 2.4]} intensity={2.2} distance={6} color="#f7f3ec" />

      {/* Reflections for satin lapels, patent shoes and the brass base */}
      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 1]} rotation-x={Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#dcaf6a" position={[-4, 1, -1]} rotation-y={Math.PI / 2} scale={[3, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[4, 1, 1]} rotation-y={-Math.PI / 2} scale={[3, 4, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, 0.5, 4]} scale={2} />
      </Environment>
    </>
  );
}

/* ── Public component ─────────────────────────────────────────────────── */

export function SuitStage({ onReady }: { onReady?: () => void }) {
  const turntable = useRef<THREE.Group>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);
  const [visible, setVisible] = useState(true);

  // Stop rendering when the stage is off screen — saves battery on phones
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Drag to turn. Horizontal only, so vertical swipes still scroll the page.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      stage.dragging = true;
      stage.dragVelocity = 0;
      lastX = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!stage.dragging) return;
      const dx = (e.clientX - lastX) / Math.max(320, el.clientWidth);
      lastX = e.clientX;
      const turn = dx * Math.PI * 1.6;
      stage.dragYaw += turn;
      stage.dragVelocity = turn;
    };
    const up = () => (stage.dragging = false);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" aria-hidden>
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        camera={{ fov: 30, near: 0.1, far: 40, position: [-0.75, 0.05, 5] }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <color attach="background" args={['#0b0b0c']} />
        <fog attach="fog" args={['#0b0b0c', 6.5, 13]} />
        <PerformanceMonitor onDecline={() => setDpr([1, 1])} onIncline={() => setDpr([1, 1.75])} />

        <Studio />
        <FloorGlow />
        <ContactShadows position={[0, -0.999, 0]} scale={3.2} far={1.6} blur={2.6} opacity={0.75} resolution={512} color="#000000" />

        <group ref={turntable}>
          <Suspense fallback={null}>
            <SuitModel url={MODEL_URL} />
            <Ready onReady={onReady} />
          </Suspense>
        </group>

        <Rig turntable={turntable} />
      </Canvas>
    </div>
  );
}

/** Fires once the model is in the scene and a frame has been drawn. */
function Ready({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    requestAnimationFrame(() => onReady?.());
  });
  return null;
}
