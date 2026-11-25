"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Leaderboard({ entries, current }) {
  const reduce = useReducedMotion();

  if (!entries.length) {
    return (
      <div className="panel px-6 py-12 text-center">
        <p className="font-medium">Bu sayfada kimse yok.</p>
        <p className="mt-1 text-sm text-muted">Başka bir sayfayı deneyin.</p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-hair text-left font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
            <th className="w-14 px-4 py-3.5 font-normal sm:w-20 sm:px-6">Sıra</th>
            <th className="px-2 py-3.5 font-normal sm:px-6">Oyuncu</th>
            <th className="w-24 px-4 py-3.5 text-right font-normal sm:w-36 sm:px-6">
              Puan
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-hair">
          {entries.map((row, i) => (
            <motion.tr
              key={`${current}-${row.rank}`}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: Math.min(i * 0.03, 0.4),
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`transition-colors ${
                row.isMe ? "bg-accent/[0.07]" : "hover:bg-surface/60"
              }`}
            >
              <td className="px-4 py-4 sm:px-6">
                <span
                  className={`tnum text-sm ${
                    row.isMe ? "font-semibold text-accent" : "text-faint"
                  }`}
                >
                  {row.rank}
                </span>
              </td>
              <td className="truncate px-2 py-4 sm:px-6">
                <span className="font-medium">{row.name}</span>
                {row.isMe && (
                  <span className="ml-2 rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                    Siz
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-right sm:px-6">
                <span className="tnum font-semibold">
                  {row.score.toLocaleString("tr-TR")}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
