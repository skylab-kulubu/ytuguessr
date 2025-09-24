import React from "react";
import loadingAnimation from "../../../public/lottie/loading.json";
import Lottie from "lottie-react";
import { TriangleAlert } from 'lucide-react';

{/* ---- Ana Yükleniyor Ekranı ---- */}
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-[#1B1740] text-white">
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
      <div className="min-h-screen flex flex-col justify-center items-center pt-24 bg-black text-white">
        <div className="text-center flex flex-col items-center">
          <TriangleAlert className="text-red-700" size={64} />
          <p className="text-sm leading-thight mb-6 mt-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-3 py-1 border-2 border-gray-400 text-gray-400 rounded-xl text-sm transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center pt-16 bg-black h-[calc(100vh-6rem)]">
      <Lottie
          animationData={loadingAnimation}
          style={{ width: 96, height: 96 }}
          loop={true}
        />
    </div>
  );
};

export default LoadingScreen;
export { GameLoadingScreen };