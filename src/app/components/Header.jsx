"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Oyna" },
  { href: "/leaderboard", label: "Lider tablosu", short: "Sıralama" },
];

const SLIDE = { duration: 350, easing: "cubic-bezier(0.16, 1, 0.3, 1)" };

/* Header her sayfada yeniden mount oluyor; gosterge onceki sayfanin linkinden kayarak gelsin diye
   son aktif adres modulde tutulur. Kayma linklerin header icindeki konumuyla yapilir, framer layout
   ile degil: framer fixed elemani sayfa kaydirmasiyla olctugu icin adres degisip sayfa en uste
   kaydirilinca (sayfalama, sekme, sayfa gecisi) gostergeyi asagidan ucuruyordu. */
let lastActive = null;

export default function Header() {
  const pathname = usePathname();
  const indicator = useRef(null);

  useLayoutEffect(() => {
    const from = lastActive;
    lastActive = pathname;
    const el = indicator.current;
    if (!el || !from || from === pathname) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const prev = el.closest("nav").querySelector(`a[href="${from}"]`);
    if (!prev) return;
    const cur = el.parentElement;
    const dx = prev.offsetLeft - cur.offsetLeft;
    el.animate(
      [
        { left: `${dx}px`, right: `${cur.offsetWidth - dx - prev.offsetWidth}px` },
        { left: "0px", right: "0px" },
      ],
      SLIDE,
    );
  }, [pathname]);

  return (
    /* Dis katman tam genislikte ama tiklamayi gecirir: yalniz pill tiklanabilir. */
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="pointer-events-auto mx-auto flex h-13 w-full max-w-350 items-center justify-between gap-4 rounded-full border border-hair bg-[#151b18]/80 pr-1.5 pl-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_40px_-15px_rgba(0,0,0,.6)] backdrop-blur-md sm:pl-6">
        <Link href="/" className="flex items-center" aria-label="YTUGuessr ana sayfa">
          <img src="/logo.svg" alt="YTUGuessr" className="h-[18px] sm:h-5" />
        </Link>

        <nav aria-label="Ana menü" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {active && (
                  <span ref={indicator} className="absolute inset-0 rounded-full bg-white/[0.08]" />
                )}
                {item.short ? (
                  <>
                    <span className="relative sm:hidden">{item.short}</span>
                    <span className="relative hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  <span className="relative">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
