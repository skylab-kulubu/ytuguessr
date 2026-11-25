"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const NAV = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/leaderboard", label: "Lider Tablosu" },
];

export default function Header() {
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setLifted(v > 16));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-colors duration-300 lg:h-[72px] ${
        lifted
          ? "border-b border-hair bg-canvas/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center" aria-label="YTUGuessr ana sayfa">
          <img src="/logo.svg" alt="YTUGuessr" className="h-6 sm:h-7" />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-control px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-px h-px bg-accent sm:inset-x-4"
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
