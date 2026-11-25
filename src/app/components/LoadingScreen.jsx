import React from "react";
import loadingAnimation from "../../../public/lottie/loading.json";
import Lottie from "lottie-react";
import { TriangleAlert } from 'lucide-react';

{/* ---- Ana Yükleniyor Ekranı ---- */}
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-canvas text-white">
      <div className="flex justify-center items-center pt-24 h-[calc(100vh-6rem)]">
        <Lottie
          animationData={loadingAnimation}
          style={{ width: 96, height: 96 }}
          loop={true}
        />
      </div>
    </div>
  );
};

{/* ---- Oyun Yükleniyor Ekranı ---- */}
const GameLoadingScreen = ({ error }) => {
  if (error) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6 text-ink">
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
    <div className="grid min-h-[100dvh] place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <span className="hud-label">Oyun hazırlanıyor</span>
        <span aria-hidden="true" className="loader-line" />
      </div>
    </div>
  );
};

export default LoadingScreen;
export { GameLoadingScreen };