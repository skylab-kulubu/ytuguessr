"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLeaderboard } from "../../lib/hooks/useLeaderboard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CampusMap from "../components/CampusMap";
import LoadingScreen from "../components/LoadingScreen";
import { Reveal } from "../components/utils";
import Podium from "../components/Podium";
import Leaderboard from "./components/Leaderboard";
import Pagination from "./components/Pagination";

function LeaderboardView() {
  const router = useRouter();
  const params = useSearchParams();
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);

  const { isLoading, error, formatted } = useLeaderboard(page);

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-5">
          <div className="panel w-full max-w-sm px-6 py-8 text-center">
            <p className="font-medium">Sıralama yüklenemedi.</p>
            <p className="mt-1 text-sm text-muted">{error.message}</p>
            <button
              onClick={() => router.refresh()}
              className="btn btn-ghost mt-6 h-11 w-full text-sm"
            >
              Tekrar dene
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { page: current, totalPages, totalUsers, userRank, entries } = formatted;
  const firstPage = current === 1;
  const rows = firstPage ? entries.slice(3) : entries;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
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
              Lider tablosu
            </h1>
            <p className="mt-4 text-muted">
              {userRank ? (
                <>
                  Şu anda <span className="tnum text-ink">{userRank}.</span>{" "}
                  sıradasınız.
                </>
              ) : (
                "Henüz bir sıralamanız yok."
              )}
            </p>
          </Reveal>

          {firstPage && (
            <div className="mt-16">
              <Podium />
            </div>
          )}

          <div className="mt-12">
            <Leaderboard entries={rows} current={current} />
          </div>

          <Pagination
            current={current}
            totalPages={totalPages}
            totalUsers={totalUsers}
            onPageChange={(p) => router.push(`/leaderboard?page=${p}`)}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LeaderboardView />
    </Suspense>
  );
}
