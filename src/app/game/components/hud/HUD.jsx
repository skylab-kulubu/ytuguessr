"use client";

import { useLayoutEffect, useRef } from "react";
import RoundStrip from "./RoundStrip";
import { ROUND_COUNT, ROUND_SECONDS } from "@/lib/constants";

const URGENT_AT = 10;

const pad = (n) => String(n).padStart(2, "0");
const clock = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

/**
 * Kalan sureyi gosteren cetvel. Her saniye JS ile guncellemek yerine bitis
 * anina kadar tek bir dogrusal CSS gecisi kurulur; kompozitorde akar.
 */
function TimeRuler({ deadline, urgent }) {
  const fill = useRef(null);

  useLayoutEffect(() => {
    const el = fill.current;
    if (!el || !deadline) return;
    const left = Math.max(0, deadline - Date.now());
    el.style.transition = "none";
    el.style.transform = `scaleX(${Math.min(1, left / (ROUND_SECONDS * 1000))})`;
    /* Baslangic olcegini yerlestir; yoksa gecis onceki turun degerinden baslar. */
    el.getBoundingClientRect();
    el.style.transition = `transform ${left}ms linear, background-color 300ms ease`;
    el.style.transform = "scaleX(0)";
  }, [deadline]);

  return (
    <div className="hud-ruler" aria-hidden="true">
      <div ref={fill} className={`hud-ruler__fill ${urgent ? "is-urgent" : ""}`} />
    </div>
  );
}

export default function HUD({ secondsLeft, deadline, round, rounds, score }) {
  const seconds = Number.isFinite(secondsLeft) ? Math.max(0, secondsLeft) : 0;
  const urgent = seconds > 0 && seconds <= URGENT_AT;
  const top = { top: "calc(env(safe-area-inset-top, 0px) + 1.125rem)" };

  return (
    <>
      {/* Parlak gokyuzunde de okunsun diye ust kenarda hafif karartma. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-20 h-40 bg-gradient-to-b from-canvas/80 via-canvas/35 to-transparent"
      />

      <div className="pointer-events-none fixed left-5 z-30 lg:left-8" style={top}>
        <div className="flex items-center gap-3">
          <p className="hud-label tnum">
            Tur {pad(round || 1)}
            <span className="text-faint">/{pad(ROUND_COUNT)}</span>
          </p>
          <RoundStrip rounds={rounds} />
        </div>

        <p role="timer" className={`hud-time tnum mt-2 ${urgent ? "is-urgent" : ""}`}>
          {clock(seconds)}
        </p>

        <TimeRuler deadline={deadline} urgent={urgent} />
      </div>

      {Number.isFinite(score) && (
        <div className="pointer-events-none fixed right-5 z-30 text-right lg:right-8" style={top}>
          <p className="hud-label">Puan</p>
          <p className="hud-score tnum mt-2">{Math.round(score).toLocaleString("tr-TR")}</p>
        </div>
      )}
    </>
  );
}
