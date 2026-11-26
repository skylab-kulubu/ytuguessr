"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** 1 ... n-1 n n+1 ... son seklinde kisaltilmis sayfa listesi. */
function pageWindow(current, total) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  return sorted.reduce((acc, page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) acc.push(`gap-${page}`);
    acc.push(page);
    return acc;
  }, []);
}

export default function Pagination({ current, totalPages, totalUsers, onPageChange }) {
  if (totalPages <= 1) return null;

  const arrow ="btn btn-ghost h-10 w-10 shrink-0 disabled:opacity-35 disabled:hover:border-hair disabled:hover:bg-transparent";

  return (
    <div className="mt-10">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label="Önceki sayfa"
          className={arrow}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-1">
          {pageWindow(current, totalPages).map((page) =>
            typeof page === "string" ? (
              <span key={page} className="px-1 text-faint">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={page === current ? "page" : undefined}
                className={`tnum h-10 w-10 rounded-control text-sm font-medium transition-colors ${
                  page === current
                    ? "border border-accent/35 bg-accent/10 text-accent"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current >= totalPages}
          aria-label="Sonraki sayfa"
          className={arrow}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-faint">
        <span className="tnum">{totalUsers}</span> oyuncu arasından{" "}
        <span className="tnum">{current}</span>. sayfa
      </p>
    </div>
  );
}
