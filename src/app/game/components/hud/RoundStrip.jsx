/**
 * Bes turun durumu. Biten turun cizgisi aldigi puan kadar parlak; sayfa
 * yenilenince gecmis puanlar bilinmedigi icin orta tonda kalir.
 *
 * @param {{state: "done" | "current" | "todo", score?: number}[]} rounds
 */
export default function RoundStrip({ rounds, className = "" }) {
  return (
    <ol className={`flex items-center gap-1 ${className}`} aria-label="Turlar">
      {rounds.map((r, i) => (
        <li
          key={i}
          className={`round-tick is-${r.state}`}
          style={Number.isFinite(r.score) ? { "--q": Math.max(0.3, r.score / 1000) } : undefined}
        >
          <span className="sr-only">
            {i + 1}. tur
            {r.state === "current" ? " (şu an)" : ""}
            {Number.isFinite(r.score) ? `: ${Math.round(r.score)} puan` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
