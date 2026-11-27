"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGuard } from "@/lib/hooks/useGuard";
import { useHandleQuestion } from "@/lib/hooks/useHandleQuestion";
import { ROUND_COUNT } from "@/lib/constants";

import PanoramaViewer from "./components/PanoramaViewer";
import HUD from "./components/hud/HUD";
import ResultModal from "./components/result/ResultModal";
import { GameLoadingScreen } from "../components/LoadingScreen";

const GuessMap = dynamic(() => import("./components/GuessMap"), {
  ssr: false,
  loading: () => null,
});

export default function GamePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { statusQuery, safeGuess, safeNext, guessMut, nextMut } = useGuard();

  const status = statusQuery.data;

  const { question, deadline, remaining, guess, actual, setGuess, formattedDistance } =
    useHandleQuestion({ status, nextMut, guessMut, safeNext, safeGuess });

  const [showMap, setShowMap] = useState(false);
  /* Tur -> kazanilan puan. Sunucu gecmis turlari dondurmuyor; sayfa yenilenirse
     seritteki eski turlar puansiz (orta tonda) gorunur. */
  const [scores, setScores] = useState({});

  useEffect(() => {
    const data = guessMut.data;
    if (!data) return;
    setScores((s) => ({ ...s, [data.question_number]: data.earned_score }));
  }, [guessMut.data]);

  useEffect(() => {
    if (
      statusQuery.isFetched &&
      !statusQuery.isFetching &&
      status &&
      status.has_active_game === false &&
      !guessMut.isSuccess
    ) {
      router.push("/");
    }
  }, [statusQuery.isFetched, statusQuery.isFetching, status, router, guessMut.isSuccess]);

  const handlePick = useCallback((lat, lng) => setGuess([lat, lng]), [setGuess]);

  const handleConfirmGuess = useCallback(() => {
    if (!guess) return;
    safeGuess({ lat: guess[0], lng: guess[1] });
    setShowMap(false);
  }, [guess, safeGuess]);

  const roundResult = guessMut.isSuccess ? guessMut.data : null;

  useEffect(() => {
    if (roundResult || !guess) return;
    const onKey = (e) => {
      if (e.repeat || (e.key !== " " && e.key !== "Enter")) return;
      // Odak bir butondaysa tarayici zaten tikliyor; ikinci kez gondermeyelim.
      if (e.target instanceof Element && e.target.closest("button, a, input, textarea")) return;
      e.preventDefault();
      handleConfirmGuess();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [roundResult, guess, handleConfirmGuess]);

  if (statusQuery.isLoading) return <GameLoadingScreen />;
  if (statusQuery.isError)
    return <GameLoadingScreen error="Sunucudan durum alınamadı. Lütfen tekrar deneyin." />;

  if (status && status.has_active_game === false && !guessMut.isSuccess) {
    return <GameLoadingScreen />;
  }

  const round = roundResult?.question_number ?? question?.question_number ?? status?.question_number ?? 1;
  const known = roundResult ? { ...scores, [round]: roundResult.earned_score } : scores;
  const rounds = Array.from({ length: ROUND_COUNT }, (_, i) => {
    const n = i + 1;
    if (n in known) return { state: "done", score: known[n] };
    if (n < round) return { state: "done" };
    return { state: n === round ? "current" : "todo" };
  });

  const guessStatus = guessMut.isPending ? "pending" : guessMut.isError ? "error" : "idle";

  return (
    <div className="page-enter relative h-[100dvh] w-full overflow-hidden bg-canvas text-ink">
      {question?.image_url && !status.game_over && (
        <PanoramaViewer
          key={question.image_url}
          imageUrl={question.image_url}
          showHint={question.question_number === 1}
        />
      )}

      {!status.game_over && !roundResult && (
        <HUD
          secondsLeft={remaining}
          deadline={deadline}
          round={round}
          rounds={rounds}
          score={status?.current_score}
        />
      )}

      {!roundResult && (
        <GuessMap
          marker={guess}
          onPick={handlePick}
          onToggleMap={() => setShowMap((v) => !v)}
          onConfirm={handleConfirmGuess}
          status={guessStatus}
          showMap={showMap}
          secondsLeft={remaining}
        />
      )}

      {roundResult && (
        <ResultModal
          score={roundResult.earned_score}
          totalScore={roundResult.current_score}
          distanceKm={roundResult.distance_km}
          formattedDistance={formattedDistance}
          guessCoords={guess}
          correctCoords={actual}
          questionNumber={roundResult.question_number}
          maxQuestions={ROUND_COUNT}
          rounds={rounds}
          onNext={() => {
            guessMut.reset();
            safeNext();
          }}
          onSummary={() => {
            queryClient.invalidateQueries({ queryKey: ["summary"] });
            router.push("/summary");
          }}
        />
      )}
    </div>
  );
}
