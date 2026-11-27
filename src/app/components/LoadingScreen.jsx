import React from "react";
import { TriangleAlert } from 'lucide-react';
import Header from "./Header";
import SkylabLoader from "./SkylabLoader";

{/* ---- Ana Yükleniyor Ekranı ---- */}
/* Header icerikli sayfadakiyle ayni yerde durur: veri gelince yalniz icerik degisir. */
const LoadingScreen = () => {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="page-enter grid flex-1 place-items-center">
        <div role="status">
          <SkylabLoader size={72} />
          <span className="sr-only">Yükleniyor</span>
        </div>
      </main>
    </div>
  );
};

{/* ---- Oyun Yükleniyor Ekranı ---- */}
const GameLoadingScreen = ({ error }) => {
  if (error) {
    return (
      <div className="page-enter grid min-h-[100dvh] place-items-center bg-canvas px-6 text-ink">
        <div className="flex max-w-sm flex-col items-center text-center">
          <TriangleAlert className="text-danger" size={28} strokeWidth={1.75} />
          <p className="mt-4 font-medium">Oyun yüklenemedi</p>
          <p className="mt-1.5 text-sm text-balance text-muted">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-ghost mt-6 h-11 px-5 text-sm"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter grid min-h-[100dvh] place-items-center bg-canvas">
      <div role="status" className="flex flex-col items-center gap-5">
        <SkylabLoader size={64} />
        <span className="hud-label">Oyun hazırlanıyor</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
export { GameLoadingScreen };
