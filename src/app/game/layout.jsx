"use client";

import { useEffect } from "react";

export default function GameLayout({ children }) {
  /* Oyun ekrani tam ekran: arka planin kaymasi paroramayi da kaydiriyor. */
  useEffect(() => {
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevOverscroll = style.overscrollBehavior;

    style.overflow = "hidden";
    style.overscrollBehavior = "contain";

    return () => {
      style.overflow = prevOverflow;
      style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  return <div className="h-[100dvh] overflow-hidden">{children}</div>;
}
