"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useGuard } from "@/lib/hooks/useGuard";
import { useHandleQuestion } from "@/lib/hooks/useHandleQuestion";

import PanoramaViewer from "./components/PanoramaViewer";
import HUD from "./components/hud/HUD";
import ResultModal from "./components/result/ResultModal";
import { GameLoadingScreen } from "../components/LoadingScreen";

const GuessMap = dynamic(() => import("./components/GuessMap"), {
  ssr: false,
  loading: () => (<GameLoadingScreen />),
});

function GameCore() {
  const router = useRouter();
  
  /* GUARD HOOK ------------------------------------------------------------------ */
  const {
    statusQuery,      // query for overall game status
    safeGuess,        // guarded guess mutation
    safeNext,         // guarded next-question mutation
    guessMut,         // raw guess mutation object (for modal flags)
    nextMut,          // raw next mutation (for question data)
  } = useGuard();

  const status = statusQuery.data;

  const { question, remaining, guess, actual, setGuess, formattedDistance } = useHandleQuestion({ status, nextMut, guessMut, safeNext, safeGuess });

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (status && status.has_active_game === false && !guessMut.isSuccess) {
      router.push("/");
    }
  }, [status, router, guessMut.isSuccess]);

  const handleConfirmGuess = useCallback(() => {
    if (!guess) return;
    safeGuess({ lat: guess[0], lng: guess[1] });
    setShowMap(false);
  }, [guess, safeGuess]);

  /* RENDER GUARD ------------------------------------------------------------------ */
  if (statusQuery.isLoading)
    return <GameLoadingScreen />;
  if (statusQuery.isError)
    return <GameLoadingScreen error="Sunucudan durum alınamadı. Lütfen tekrar deneyin." />;

  if (status && status.has_active_game === false && !guessMut.isSuccess) {
    return <GameLoadingScreen />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {question?.image_url && !status.game_over && (
        <PanoramaViewer key={question.image_url} imageUrl={question.image_url} />
      )}

      {!status.game_over && (
        <HUD secondsLeft={remaining} />
      )}

      <GuessMap
        marker={guess}
        onPick={(lat, lng) => setGuess([lat, lng])}
        onToggleMap={() => setShowMap((v) => !v)}
        onConfirm={handleConfirmGuess}
        guessSelected={!!guess}
        showMap={showMap}
      />

      {/* RESULT MODAL */}
      {guessMut.isSuccess && (
        <ResultModal
          score={guessMut.data.earned_score}
          totalScore={guessMut.data.current_score}
          distance={guessMut.data.distance_km}
          formattedDistance={formattedDistance}
          guessCoords={guess}
          correctCoords={actual}
          questionNumber={guessMut.data.question_number}
          maxQuestions={5}
          onNext={() => {
            guessMut.reset();
            const last = guessMut.data.question_number >= 5;
            if (last) { 
              router.push("/summary");
            } else {
              safeNext();
            }
          }}
          onSummary={() => router.push("/summary")}
        />
      )}
    </div>
  );
}

export default function GamePage() {
  return (
      <GameCore />
  );
}