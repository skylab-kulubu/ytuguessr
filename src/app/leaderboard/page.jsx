"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLeaderboard } from "../../lib/hooks/useLeaderboard";
import { useEvents } from "../../lib/hooks/useEvents";
import { useNow } from "../../lib/hooks/useNow";
import {
  GENERAL,
  STATUS_LABEL,
  boardEvents,
  eventStatus,
  formatEventWindow,
} from "../../lib/events";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CampusMap from "../components/CampusMap";
import SkylabLoader from "../components/SkylabLoader";
import { Reveal, SmoothHeight } from "../components/utils";
import Podium from "../components/Podium";
import Leaderboard from "./components/Leaderboard";
import Pagination from "./components/Pagination";
import BoardTabs from "./components/BoardTabs";
import EventEmpty from "./components/EventEmpty";
import { PeekingRobot } from "../components/ArtlabRobot";

function BoardLoader() {
  return (
    <div role="status" className="flex justify-center py-24">
      <SkylabLoader size={56} />
      <span className="sr-only">Sıralama yükleniyor</span>
    </div>
  );
}

/** Bir tablonun etkinlik bilgisi, sirasi, podyumu, listesi ve sayfalari. event null ise genel tablo. */
function Board({ event, data, now, onPageChange }) {
  const { page: current, totalPages, totalUsers, userRank, entries } = data;
  const firstPage = current === 1;
  const rows = firstPage ? entries.slice(3) : entries;
  const status = event && eventStatus(event, now);
  const emptyEvent = event && firstPage && entries.length === 0;

  return (
    <>
      <div className="text-center">
        {event && (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{formatEventWindow(event)}</span>
            <span className="text-faint">·</span>
            <span>{STATUS_LABEL[status]}</span>
            <span className="text-faint">·</span>
            <span>Yalnız bu aralıkta biten oyunlar sayılır.</span>
          </p>
        )}
        {!emptyEvent && (
          <p className="mt-4 text-muted">
            {userRank ? (
              <>
                {event ? "Bu tabloda" : "Şu anda"}{" "}
                <span className="tnum text-ink">{userRank}.</span> sıradasınız.
              </>
            ) : event ? (
              "Bu tabloda henüz sıralamanız yok."
            ) : (
              "Henüz bir sıralamanız yok."
            )}
          </p>
        )}
      </div>

      {emptyEvent ? (
        <div className="mt-12">
          <EventEmpty event={event} status={status} />
        </div>
      ) : (
        <>
          {firstPage && (
            <div className="mt-16">
              <Podium event={event?.slug ?? null} />
            </div>
          )}

          {(rows.length > 0 || !firstPage) && (
            <div className={event ? "relative mt-20" : "mt-12"}>
              {event && <PeekingRobot className="absolute bottom-full left-3 sm:left-6" />}
              <Leaderboard entries={rows} current={current} />
            </div>
          )}
        </>
      )}

      <Pagination
        current={current}
        totalPages={totalPages}
        totalUsers={totalUsers}
        onPageChange={onPageChange}
      />
    </>
  );
}

function LeaderboardView() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const params = useSearchParams();
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const param = params.get("event");

  // Etkinlikler gelmeden hangi tablonun acilacagi bilinmez: suren etkinlik varsa o one cikar.
  // Etkinlik listesi alinamazsa genel tablo acilir.
  const events = useEvents();
  const now = useNow();
  const all = events.data ?? [];
  const tabs = boardEvents(all, now);
  const running = tabs.find((e) => eventStatus(e, now) === "active") ?? null;
  const selectedEvent =
    param === GENERAL ? null : param ? all.find((e) => e.slug === param) ?? null : running;
  const slug = selectedEvent?.slug ?? null;
  if (selectedEvent && !tabs.includes(selectedEvent)) tabs.push(selectedEvent);

  const board = useLeaderboard(page, slug, { enabled: !events.isLoading });
  const boardKey = `${slug ?? GENERAL}/${page}`;
  const failed = board.isError && !board.data;

  /* Ekrandaki tablo adrestekinin gerisinde kalabilir: baska sekme ya da sayfa
     yuklenirken onceki soluk halde durur, sayfa yukleme ekranina dusmez.
     Hatadan sonra silinir; yeniden denerken eski tablo geri gelmesin. */
  const [shown, setShown] = useState(null);
  if (board.data && board.data !== shown?.data) {
    setShown({ key: boardKey, event: selectedEvent, data: board.data, formatted: board.formatted });
  } else if (failed && shown) {
    setShown(null);
  }

  const view = failed ? "error" : shown ? shown.key : "loading";
  const pending = !failed && !!shown && shown.key !== boardKey;

  // Suren etkinlik varken genel tabloya acikca "genel" ile gidilir.
  const hrefFor = (s, p = 1) => {
    const q = new URLSearchParams();
    if (s) q.set("event", s);
    else if (running) q.set("event", GENERAL);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/leaderboard?${qs}` : "/leaderboard";
  };

  return (
    <>
      {tabs.length > 0 && (
        <Reveal delay={0.05} className="mt-8">
          <BoardTabs events={tabs} selected={slug} hrefFor={hrefFor} />
        </Reveal>
      )}

      <SmoothHeight>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: pending ? 0.4 : 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            // Gecikme: hizli yanitta soluklasma yanip sonmesin.
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: pending ? 0.15 : 0 }}
            aria-busy={pending || undefined}
            className={pending ? "pointer-events-none" : undefined}
          >
            {view === "loading" ? (
              <BoardLoader />
            ) : view === "error" ? (
              <div className="panel mx-auto mt-12 max-w-sm px-6 py-8 text-center">
                <p className="font-medium">Sıralama yüklenemedi.</p>
                <p className="mt-1 text-sm text-muted">{board.error.message}</p>
                <button
                  onClick={() => board.refetch()}
                  className="btn btn-ghost mt-6 h-11 w-full text-sm"
                >
                  Tekrar dene
                </button>
              </div>
            ) : (
              <Board
                event={shown.event}
                data={shown.formatted}
                now={now}
                onPageChange={(p) => router.push(hrefFor(shown.event?.slug ?? null, p))}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </SmoothHeight>
    </>
  );
}

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="page-enter relative flex-1 overflow-hidden">
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
          </Reveal>

          {/* Sekmeler ve tablo adrese bagli (useSearchParams Suspense ister);
              baslik ve harita onlari beklemeden gorunur. */}
          <Suspense fallback={<BoardLoader />}>
            <LeaderboardView />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
