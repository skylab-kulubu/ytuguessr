"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/** Genel tablo ve etkinlik tablolari arasinda gecis. selected: etkinlik slug'i ya da null (genel). */
export default function BoardTabs({ events, selected, hrefFor }) {
  const tabs = [{ slug: null, name: "Genel" }, ...events];

  return (
    <nav aria-label="Tablo" className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
      {tabs.map((tab) => {
        const current = tab.slug === selected;
        return (
          <Link
            key={tab.slug ?? "genel"}
            href={hrefFor(tab.slug)}
            aria-current={current ? "page" : undefined}
            className={`relative rounded-control px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
              current ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {tab.name}
            {current && (
              <motion.span
                layoutId="board-tab-active"
                className="absolute inset-x-3 -bottom-px h-px bg-accent sm:inset-x-4"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
