"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useState } from "react";

function CylPanorama({ imageUrl }) {
  const tex = useLoader(THREE.TextureLoader, imageUrl);
  tex.wrapS = THREE.ClampToEdgeWrapping; // sag ve sol uclar birlessin
  tex.wrapT = THREE.ClampToEdgeWrapping; // ust ve alt kesilmesin

  return (
    <mesh rotation={[0, Math.PI, 0]}>
      <cylinderGeometry args={[500, 500, 350, 128, 1, true]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} />
    </mesh>
  );
}

export default function PanoramaViewer({ imageUrl }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => setHasError(false), [imageUrl]);

  if (!imageUrl || hasError) {
    return <div className="fixed inset-0 z-0 bg-canvas" />;
  }

  return (
    <div className="fixed inset-0 z-0 cursor-grab overflow-hidden active:cursor-grabbing">
      <Canvas
        className="!block !h-full !w-full"
        camera={{ fov: 35, position: [0, 0, 0.1] }}
        onCreated={(state) => {
          state.gl.domElement.onerror = () => setHasError(true);
        }}
      >
        <Suspense fallback={null}>
          <CylPanorama imageUrl={imageUrl} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={-0.3}
          minPolarAngle={Math.PI / 2 - THREE.MathUtils.degToRad(1.5)}
          maxPolarAngle={Math.PI / 2 + THREE.MathUtils.degToRad(1.5)}
        />
      </Canvas>
    </div>
  );
}
