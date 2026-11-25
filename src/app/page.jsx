"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";

// Tanitimin 3 lottie'si ~500KB. Sadece ilk ziyarette indirilsin.
const Landing = dynamic(() => import("../landing/Landing"), { ssr: false });

const SEEN_KEY = "ytuguessr-landing-seen";

export default function Home() {
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      // Gizli sekmede localStorage erisimi hata verebilir: tanitimi goster.
    }
    if (!seen) setShowLanding(true);
    window.scrollTo(0, 0);
  }, []);

  const handleLandingComplete = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // Kaydedemezsek sorun degil, tanitim tekrar gosterilir.
    }
    setShowLanding(false);
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-canvas">
      {/* Icerik her zaman render edilir: SSR'da bos sayfa donmesin. */}
      <div className="min-h-[100dvh] bg-canvas flex flex-col">
        <Header />
        <main className="flex flex-col items-center bg-canvas text-white">
          <Hero />
        </main>
        <Footer />
      </div>

      {showLanding && (
        <div className="fixed inset-0 z-[60]">
          <Landing onComplete={handleLandingComplete} />
        </div>
      )}
    </div>
  );
}
