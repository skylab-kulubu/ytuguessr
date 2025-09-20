"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, MapPinOff, Trophy } from "lucide-react";

const ResultMap = dynamic(() => import("./ResultMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-6 py-8 text-center text-white/75" />
  ),
});

export default function ResultModal({ score = 0, distance = null, formattedDistance = null, guessCoords = null, correctCoords = null, questionNumber = 1, maxQuestions = 5, onNext, onSummary }) {
  const lastQuestion = questionNumber >= maxQuestions;
  const scoreValue = Number.isFinite(score) ? Math.round(score) : 0;
  const scoreDisplay = scoreValue.toLocaleString("tr-TR");

  const clampedQuestion = Math.min(Math.max(questionNumber, 0), maxQuestions);
  const scoreProgressPercent = Math.min(Math.round((scoreValue / 1000) * 100), 100);
  const showMap = scoreValue > 0;

  return (
    <AnimatePresence>
      <motion.div key="overlay" className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div key="modal" className="relative w-full max-w-2xl mx-8"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        >
          {/* Background Glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 rounded-xl bg-violet-500/15 blur-3xl" />
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 mx-4 backdrop-blur-sm shadow-2xl">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  {/* Score Display */}
                  <motion.div className="relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/15 blur-xs" />
                    <div className="relative flex h-16 w-20 flex-col items-center justify-center rounded-xl border border-violet-500/30 bg-white/10 text-white">
                      <Trophy className="h-4 w-4 text-violet-300 mb-1" />
                      <span className="text-2xl font-bold leading-none">{scoreDisplay}</span>
                    </div>
                  </motion.div>
                  {/* Info Section */}
                  <div className="flex-1 space-y-2 text-white">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                        Tur {clampedQuestion} / {maxQuestions}
                      </p>
                      <h2 className="text-xl font-bold text-white">
                        {lastQuestion ? "Oyun Tamamlandı!" : score === 0 ? "Tur Başarısız!" : score > 950 ? "Destansı Başarı!" : "Tur Tamamlandı!"}
                      </h2>
                    </motion.div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Progress Section */}
                  <motion.div className="w-full sm:w-40"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-white/60 mb-2">
                      <span>Skor</span>
                      <span>{scoreValue}/1000</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div className="h-full rounded-full bg-violet-300/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${scoreProgressPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
              {showMap ? (
                <motion.div className="space-y-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  {/* Distance Info */}
                  {formattedDistance && (
                    <motion.div className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-white/90"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}    
                      >
                      <Compass className="h-4 w-4 text-violet-300" />
                      <span>Mesafe: {formattedDistance}</span>
                    </motion.div>
                  )}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-violet-500/20 bg-[#1B1740]">
                    <ResultMap guessCoords={guessCoords} correctCoords={correctCoords} distance={distance} className="h-full w-full" />
                  </div>
                </motion.div>
              ) : (
                <motion.div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-6 py-8 text-center text-white/75"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <MapPinOff className="h-8 w-8 mx-auto mb-3 text-violet-300" />
                  <p className="font-semibold">Harita bilgisi bulunamadı</p>
                  <p className="mt-1 text-sm text-white/50"> Bu turda tahmin yapılmadı.</p>
                </motion.div>
              )}
            </div>

            <div className="border-t border-white/10 bg-white/5 px-6 py-4 sm:px-8">
              <motion.button className="group relative w-full overflow-hidden rounded-xl bg-violet-300/10 text-violet-300/60 border border-violet-400/30 px-6 py-3 font-bold shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                onClick={lastQuestion ? onSummary : onNext}
              >
                <span className="relative z-10">
                  {lastQuestion ? "SONUÇLARI GÖR" : "SONRAKİ TUR"}
                </span>
              </motion.button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
