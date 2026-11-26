"use client";

import { useEffect, useState } from "react";

/** Dakikada bir yenilenen saat: etkinlik durumu sayfa acikken de degisir (ör. gece yarisi). */
export function useNow(intervalMs = 60 * 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
