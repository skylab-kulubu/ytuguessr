"use client";
import React, { useRef, useState, useEffect } from "react";
import ProgressBar from "./ProgressBar";

export default function HUD({ secondsLeft, totalSeconds = 60 }) {
  const overlayRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0, borderRadius: 0 });

  useEffect(() => {
    const measure = () => {
      if (!overlayRef.current) return;
      const rect  = overlayRef.current.getBoundingClientRect();
      const style = getComputedStyle(overlayRef.current);
      setDims({
        width: rect.width,
        height: rect.height,
        borderRadius: parseFloat(style.borderRadius) || 0,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-10 top-8"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 2rem)" }}
    >
      <div className="relative inline-flex items-center justify-center z-40">
        <ProgressBar
          width={dims.width}
          height={dims.height}
          borderRadius={dims.borderRadius}
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
        />
        <div
          ref={overlayRef}
          className="px-8 py-1 min-w-24 min-h-8 bg-gray-800/50 rounded-xl flex items-center justify-center"
        >
          <span className="text-white text-lg font-semibold">
            {secondsLeft ? secondsLeft : "-" }
          </span>
        </div>
      </div>
    </div>
  );
}
