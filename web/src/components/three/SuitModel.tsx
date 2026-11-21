'use client';

import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

export const MODEL_HEIGHT = 2; // metres the piece is scaled to

type Props = { url: string } & ThreeElements['group'];

/**
 * Loads a Meshy-generated GLB (meshopt-compressed), stands it on the floor at
 * y = -1 and scales it to MODEL_HEIGHT so every piece frames the same way.
 */
export function SuitModel({ url, ...props }: Props) {
  const { scene } = useGLTF(url, false, true);

  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = MODEL_HEIGHT / size.y;
    model.scale.setScalar(s);
    model.position.set(-center.x * s, -box.min.y * s - MODEL_HEIGHT / 2, -center.z * s);

    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      // Generated maps are a little flat; let the studio reflections do the work.
      mat.envMapIntensity = 1.1;
      mat.side = THREE.FrontSide;
      if (mat.map) mat.map.anisotropy = 8;
    });
  }, [model]);

  return (
    <group {...props}>
      <primitive object={model} />
    </group>
  );
}
