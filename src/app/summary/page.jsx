"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Trophy } from "lucide-react";
import { useSummary } from "../../lib/hooks/useSummary";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CampusMap from "../components/CampusMap";
import LoadingScreen from "../components/LoadingScreen";
import { Reveal } from "../components/utils";
import { MAX_ROUND_SCORE } from "@/lib/constants";

export default function SummaryPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { isLoading, error, formatted } = useSummary();

  const expired = error?.response?.status === 400;

  useEffect(() => {
    if (expired) router.push("/");
  }, [expired, router]);

  if (isLoading || expired || (!error && !formatted)) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-5">
          <div className="panel w-full max-w-sm px-6 py-8 text-center">
            <p className="font-medium">Özet yüklenemedi.</p>
            <p className="mt-1 text-sm text-muted">{error.message}</p>
            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost mt-6 h-11 w-full text-sm"
            >
              Ana sayfaya dön
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { summary, guesses } = formatted;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden">
          <CampusMap
            ambient
            labels={false}
            contours={2}
            flows={false}
            className="absolute -top-1/3 left-1/2 h-[220%] w-[150%] -translate-x-1/2 sm:w-[110%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-canvas/40 via-canvas/70 to-canvas" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 pt-28 pb-20 sm:px-8 lg:pt-32">
          <Reveal className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Oyun özeti
            </h1>
            <p className="tnum mt-6 text-6xl font-bold tracking-tight sm:text-7xl">
              {summary.totalScore.toLocaleString("tr-TR")}
            </p>
            <p className="mt-2 text-sm text-faint">toplam puan</p>
          </Reveal>

          <Reveal delay={0.1} className="mt-12">
            <div className="panel grid grid-cols-2 divide-x divide-hair">
              <div className="px-5 py-6 text-center">
                <p className="tnum text-2xl font-semibold">{summary.totalDistance}</p>
                <p className="mt-1.5 text-sm text-muted">toplam sapma</p>
              </div>
              <div className="px-5 py-6 text-center">
                <p className="tnum text-2xl font-semibold">{summary.totalTime}</p>
                <p className="mt-1.5 text-sm text-muted">toplam süre</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">Turlar</h2>

            <ol className="mt-5 divide-y divide-hair border-t border-hair">
              {guesses.map((g, i) => {
                const ratio = Math.min(g.score / MAX_ROUND_SCORE, 1);
                return (
                  <li key={i} className="relative">
                    <div className="flex items-baseline gap-4 py-5">
                      <span className="tnum w-6 shrink-0 text-sm text-faint">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{g.distance}</p>
                        <p className="tnum mt-1 text-sm text-muted">{g.time}</p>
                      </div>
                      <span className="tnum text-lg font-semibold">{g.score}</span>
                    </div>

                    {/* Cizginin uzunlugu turdaki puani gosterir. */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 block h-px bg-muted"
                      initial={reduce ? { width: `${ratio * 100}%` } : { width: 0 }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{
                        duration: 0.7,
                        delay: 0.3 + i * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal delay={0.2} className="mt-12 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/")}
              className="btn btn-primary h-12 flex-1 text-base"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Yeniden oyna
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="btn btn-ghost h-12 flex-1 text-base"
            >
              <Trophy className="h-4 w-4" strokeWidth={2} />
              Lider tablosu
            </button>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
