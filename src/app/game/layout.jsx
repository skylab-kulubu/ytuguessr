"use client";

import { Providers } from "../../lib/providers";
import { useEffect } from "react";

export default function GameLayout({ children }) {

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      <Providers>{children}</Providers>
    </div>
  );
}