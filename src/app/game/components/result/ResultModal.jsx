"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import RoundStrip from "../hud/RoundStrip";
import { ArrowRight } from "../Glyph";
import { MAX_ROUND_SCORE, ROUND_COUNT } from "@/lib/constants";

const ResultMap = dynamic(() => import("./ResultMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-canvas-2" />,
});

const EASE = [0.16, 1, 0.3, 1];
const pad = (n) => String(n).padStart(2, "0");
const format = (n) => Math.round(n).toLocaleString("tr-TR");

/** Baslik puana degil mesafeye gore: oyuncuya neyin iyi gittigini soyler. */
function verdict(distanceKm, timedOut) {
  if (timedOut) return "Süre doldu";
  const m = distanceKm * 1000;
  if (m <= 15) return "Tam isabet";
  if (m <= 50) return "Neredeyse oradaydın";
  if (m <= 150) return "Yakın";
  if (m <= 500) return "Biraz uzak";
  return "Kampüsün öbür ucu";
}

/** Puani sayarak yazar; her karede React render'i yerine dogrudan metni gunceller. */
function CountUp({ value, reduce }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = (v) => {
      el.textContent = format(v);
    };
    if (reduce) {
      show(value);
      return;
    }
    const controls = animate(0, value, { duration: 0.9, delay: 0.35, ease: EASE, onUpdate: show });
    return () => controls.stop();
  }, [value, reduce]);

  return <span ref={ref}>{reduce ? format(value) : "0"}</span>;
}

export default function ResultModal({
  score = 0,
  totalScore = null,
  distanceKm = null,
  formattedDistance = null,
  guessCoords = null,
  correctCoords = null,
  questionNumber = 1,
  maxQuestions = ROUND_COUNT,
  rounds = [],
  onNext,
  onSummary,
}) {
  const reduce = useReducedMotion();
  const last = questionNumber >= maxQuestions;
  const value = Number.isFinite(score) ? Math.round(score) : 0;
  const round = Math.min(Math.max(questionNumber, 1), maxQuestions);
  /* Sure dolunca sunucu mesafeyi -1 dondurur ve isareti yok sayar. */
  const timedOut = !(distanceKm >= 0);
  const advance = last ? onSummary : onNext;

  /* Onaylarken basili tutulan Enter/Bosluk sonucu okumadan gecirmesin. */
  const armed = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => {
      armed.current = true;
    }, 450);
    return () => clearTimeout(id);
  }, []);

  const go = useCallback(() => {
    if (armed.current) advance();
  }, [advance]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
      if (e.target instanceof Element && e.target.closest("button, a, input")) return;
      e.preventDefault();
      go();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-title"
      className="fixed inset-0 z-50 bg-canvas"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* isolate: Leaflet panelerinin z-index'i (400+) disari sizip paneli ortmesin. */}
      <div className="absolute inset-x-0 top-0 isolate h-[58dvh] lg:h-full">
        <ResultMap
          guess={timedOut ? null : guessCoords}
          actual={correctCoords}
          distance={timedOut ? null : formattedDistance}
        />
      </div>

      <motion.section
        className="result-panel"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="hud-label tnum">
            Tur {pad(round)}
            <span className="text-faint">/{pad(maxQuestions)}</span>
          </p>
          <RoundStrip rounds={rounds} />
        </div>

        <h2 id="round-title" className="mt-5 text-[1.625rem] leading-tight font-semibold tracking-tight text-balance">
          {verdict(distanceKm, timedOut)}
        </h2>

        <p className="mt-4 flex items-baseline gap-2">
          <span className="tnum text-6xl font-bold tracking-[-0.03em]">
            <CountUp value={value} reduce={reduce} />
          </span>
          <span className="tnum text-sm text-faint">/ {format(MAX_ROUND_SCORE)} puan</span>
        </p>

        <div className="score-scale mt-4" aria-hidden="true">
          <motion.div
            className="score-scale__fill"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: value / MAX_ROUND_SCORE }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
          />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-hair pt-4">
          <div>
            <dt className="hud-label">Sapma</dt>
            <dd className="tnum mt-1.5 text-ink">{timedOut ? "Tahmin yok" : formattedDistance}</dd>
          </div>
          <div>
            <dt className="hud-label">Toplam</dt>
            <dd className="tnum mt-1.5 text-ink">
              {Number.isFinite(totalScore) ? format(totalScore) : "-"}
            </dd>
          </div>
        </dl>

        <ul className="mt-5 flex gap-5 text-xs text-muted">
          {!timedOut && (
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="legend-dot bg-marker" />
              Tahminin
            </li>
          )}
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="legend-dot bg-accent" />
            Doğru konum
          </li>
        </ul>

        <button
          type="button"
          autoFocus
          onClick={go}
          className="btn btn-primary mt-6 h-12 w-full justify-between rounded-[8px] px-5 text-base"
        >
          {last ? "Sonuçları gör" : "Sonraki tur"}
          <span className="flex items-center gap-2.5">
            <kbd className="kbd kbd--on-accent max-lg:hidden">Enter</kbd>
            <ArrowRight />
          </span>
        </button>
      </motion.section>
    </motion.div>
  );
}
