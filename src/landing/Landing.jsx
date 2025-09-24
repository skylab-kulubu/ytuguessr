"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import Lottie from "lottie-react";
import landing1 from '../../public/lottie/landing1.json'
import landing2 from '../../public/lottie/landing2.json'
import landing3 from '../../public/lottie/landing3.json'

export default function Landing({ onComplete }) {
  const [step, setStep] = useState(0);

  const slides = useMemo(
    () => [
      {
        title: "Yıldızı Keşfet",
        text:
          "Orta bahçeden kulüp odalarına, kampüsün her köşesini keşfederken kendini bulacaksın.",
        animation: landing1
      },
      {
        title: "İpuçlarını Bul",
        text:
          "Fotoğraflardaki detaylara dikkat et. Binalar, tabelalar ve çevre seni doğru noktaya götürür.",
        animation: landing2
      },
      {
        title: "Tahminini Yap",
        text:
          "Haritada noktanı işaretle, onayla ve puanını gör. Ne kadar yaklaşırsan o kadar çok puan alırsın.",
        animation: landing3
      },
    ],
    []
  );

  /* ------ Ekran Kaydırma Kilidi ------ */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const goNext = () => {
    if (step <= slides.length) {
      setStep((s) => s + 1);
    }
  };

  useEffect(() => {
    if (step === slides.length + 1) onComplete();
  }, [step, slides.length, onComplete]);

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => goNext(),
    onSwipedLeft: () => goNext(),
    delta: 10,
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  return (
    <div {...swipeHandlers} className="relative h-screen w-screen bg-[#1B1740] text-white flex items-center justify-center overflow-hidden">
      {/* ---- Logo ve Yapımcılar ---- */}
      <motion.div className="absolute inset-x-0 mb-20 flex items-center justify-center"
        initial={{ y: 0, scale: 1 }}
        animate={{ y: step > 0 ? -240 : 0, scale: step > 0 ? 0.9 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center">
          <img src="/logo.svg" alt="YTUGuessr Logo" className="h-10" />
          {step !== 0 && (
            <span className="text-white/40 font-medium text-md">
              Fatih Naz - Egehan Avcu
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="mt-2 text-white/70 text-sm flex items-center gap-2"
            >
              <span>Başlamak için kaydırın</span>
              <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M12 19l-5-5M12 19l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ---- Tanıtım Slaytları ---- */}
      <AnimatePresence mode="wait">
        {step > 0 && step <= slides.length && (
          <motion.div
            key={`slide-${step}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <Lottie
              animationData={slides[step - 1].animation}
              loop={true}
              autoplay={true}
              style={{
                transform: step === 1 ? "scale(2)" : "scale(1)",
              }}
              className="w-50 h-50 overflow-hidden"
            />
            <motion.h2 className="text-3xl sm:text-4xl font-bold my-4">
              {slides[step - 1].title}
            </motion.h2>
            <p className="max-w-xl px-2 text-gray-300 font-semibold text-sm mb-8">
              {slides[step - 1].text}
            </p>

            <div className="flex flex-col items-center gap-4 w-full">
              {step < slides.length && (
                <>
                  <button
                    onClick={() => goNext()}
                    className="w-full max-w-xs px-2 py-2 rounded-xl bg-violet-400/60 border border-indigo-800/20 text-white font-semibold shadow-md"
                  >
                    Devam Et
                  </button>
                  <div className="flex items-center w-full px-2 max-w-xs">
                    <span className="flex-grow h-px bg-white/30"></span>
                    <span className="px-2 mb-0.5 text-white/60 text-xs font-semibold">VEYA KAYDIR</span>
                    <span className="flex-grow h-px bg-white/30"></span>
                  </div>
                </>
              )}

              {step === slides.length && (
                <button
                  onClick={() => setStep(slides.length + 1)}
                  className="w-full max-w-xs px-6 py-3 rounded-xl bg-violet-400/60 border border-indigo-400/50 text-white font-semibold shadow-md hover:bg-white/20 transition"
                >
                  Başla
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ---- Adım Göstergesi ---- */}
      {step !== 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
          {slides.map((_, i) => {
            const isActive = i + 1 === step;
            return (
              <span
                key={i + 1}
                className={
                  "w-1.5 rounded-full transition-all " +
                  (isActive ? "h-8 bg-white/90" : "h-6 bg-white/30")
                }
              />
            );
          })}
        </div>
      )}

      {/* ---- Atla Butonu ---- */}
      {(step === 1 || step === 2) && (
        <button onClick={() => setStep(slides.length + 1)}
          className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Atla
        </button>
      )}

    </div>
  );
}

