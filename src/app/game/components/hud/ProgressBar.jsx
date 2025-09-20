"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ProgressBar({
  width,
  height,
  borderRadius,
  secondsLeft,
  totalSeconds = 60,
  strokeWidth = 4,
  padding = 0,
}) {
  /* --- Geometry -------------------------------------------------------- */
  const rectW = width + padding * 2;
  const rectH = height + padding * 2;
  const rx     = borderRadius;
  const svgW   = rectW + strokeWidth * 2;
  const svgH   = rectH + strokeWidth * 2;
  const offset = strokeWidth;

  const perimeter   = 2 * (rectW + rectH - 4 * rx) + 2 * Math.PI * rx;
  const progress    = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const dashLength  = perimeter * progress;

  /* --- Rounded‑rect path ---------------------------------------------- */
  const startX = offset + rectW / 2;
  const startY = offset;
  const d = `
    M ${startX},${startY}
    L ${offset + rectW - rx},${offset}
    A ${rx},${rx} 0 0 1 ${offset + rectW},${offset + rx}
    L ${offset + rectW},${offset + rectH - rx}
    A ${rx},${rx} 0 0 1 ${offset + rectW - rx},${offset + rectH}
    L ${offset + rx},${offset + rectH}
    A ${rx},${rx} 0 0 1 ${offset},${offset + rectH - rx}
    L ${offset},${offset + rx}
    A ${rx},${rx} 0 0 1 ${offset + rx},${offset}
    Z
  `;

  /* --- Path reference for animation ----------------------------------- */
  const pathRef = useRef(null);

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{
        position: "absolute",
        top: `-${strokeWidth}px`,
        left: `-${strokeWidth}px`,
        overflow: "visible",
      }}
    >
      {/* background track */}
      <path
        d={d}
        fill="transparent"
        stroke="#374151"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* animated bar */}
      <motion.path
        ref={pathRef}
        d={d}
        fill="transparent"
        stroke="#BEBAD1"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDasharray: `${perimeter} ${perimeter}` }}
        animate={{ strokeDasharray: `${dashLength} ${perimeter}` }}
        transition={{ duration: 1, ease: "linear" }}
      />
    </svg>
  );
}
