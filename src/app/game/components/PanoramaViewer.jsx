"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Component, Suspense, useCallback, useEffect, useState } from "react";
import { Drag } from "./Glyph";

function CylPanorama({ imageUrl, onReady }) {
  const tex = useLoader(THREE.TextureLoader, imageUrl);
  tex.wrapS = THREE.ClampToEdgeWrapping; // sag ve sol uclar birlessin
  tex.wrapT = THREE.ClampToEdgeWrapping; // ust ve alt kesilmesin

  useEffect(() => {
    onReady();
  }, [tex, onReady]);

  return (
    <mesh rotation={[0, Math.PI, 0]}>
      <cylinderGeometry args={[500, 500, 350, 128, 1, true]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} />
    </mesh>
  );
}

/* useLoader hatasi Canvas'in disina firlatilir. Yakalanmazsa tum oyun sayfasi
   coker; zamanlayici da onunla gittigi icin tur hic bitmez. */
class PanoramaBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Notice({ failed }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center px-8">
      {failed ? (
        <p className="max-w-xs text-center text-sm text-balance text-muted">
          Bu turun fotoğrafı yüklenemedi. Haritadan yine de tahmin edebilirsin.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <span className="hud-label">Panorama yükleniyor</span>
          <span aria-hidden="true" className="loader-line" />
        </div>
      )}
    </div>
  );
}

/** Panoramanin kayan bir fotograf oldugu ilk bakista anlasilmiyor. */
function DragHint() {
  return (
    <p className="drag-hint pointer-events-none absolute inset-x-0 bottom-28 mx-auto flex w-max items-center gap-2.5 lg:bottom-10">
      <Drag />
      Etrafa bakmak için sürükle
    </p>
  );
}

export default function PanoramaViewer({ imageUrl, showHint = false }) {
  const [state, setState] = useState("loading");
  const [hintDone, setHintDone] = useState(false);
  const ready = useCallback(() => setState("ready"), []);
  const failed = useCallback(() => setState("failed"), []);

  useEffect(() => {
    if (!showHint || state !== "ready") return;
    const id = setTimeout(() => setHintDone(true), 5000);
    return () => clearTimeout(id);
  }, [showHint, state]);

  return (
    <div
      className="fixed inset-0 z-0 cursor-grab overflow-hidden bg-canvas active:cursor-grabbing"
      onPointerDown={() => setHintDone(true)}
    >
      {imageUrl && (
        <PanoramaBoundary onError={failed}>
          {/* flat: varsayilan ACES tone mapping fotografi soluklastiriyordu (128 gri 141 basiliyordu). */}
          <Canvas
            flat
            className="!block !h-full !w-full"
            camera={{ fov: 35, position: [0, 0, 0.1] }}
          >
            <Suspense fallback={null}>
              <CylPanorama imageUrl={imageUrl} onReady={ready} />
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
        </PanoramaBoundary>
      )}

      {state !== "ready" && <Notice failed={state === "failed"} />}
      {showHint && state === "ready" && !hintDone && <DragHint />}
    </div>
  );
}
