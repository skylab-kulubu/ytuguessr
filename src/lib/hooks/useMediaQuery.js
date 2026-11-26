"use client";

import { useEffect, useState } from "react";

/**
 * SSR sirasinda daima false doner. Layout'un iki durumda da dogru olmasi
 * gerekiyorsa `mounted` degerini de kontrol edin.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);

    update();
    setMounted(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return { matches, mounted };
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
