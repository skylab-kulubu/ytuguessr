"use client";

import Link from "next/link";
/** Genel tablo ve etkinlik tablolari arasinda gecis. selected: etkinlik slug'i ya da null (genel). */
export default function BoardTabs({ events, selected, hrefFor }) {
  const tabs = [{ slug: null, name: "Genel" }, ...events];

  return (
    <nav aria-label="Tablo" className="flex flex-wrap items-center justify-center gap-1">
      {tabs.map((tab) => {
        const current = tab.slug === selected;
        return (
          <Link
            key={tab.slug ?? "genel"}
            href={hrefFor(tab.slug)}
            aria-current={current ? "page" : undefined}
            className={`inline-flex h-10 items-center rounded-control px-4 text-sm font-medium transition-colors ${
              current
                ? "border border-accent/35 bg-accent/10 text-accent"
                : "border border-transparent text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
