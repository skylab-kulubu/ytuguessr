"use client";

import Link from "next/link";
import { SleepingRobot } from "../../components/ArtlabRobot";
import { formatEventStart } from "../../../lib/events";

/** Etkinlik tablosunda henuz biten oyun yokken. */
export default function EventEmpty({ event, status }) {
  const copy = {
    upcoming: ["Henüz başlamadı", `Başlangıç: ${formatEventStart(event)}`],
    active: ["Henüz biten oyun yok", "Etkinlik süresince biten oyunlar burada sıralanır."],
    ended: ["Bu etkinlikte biten oyun yok", null],
  }[status];

  return (
    <div className="group/robot panel flex flex-col items-center px-6 py-12 text-center">
      {/* Robot cizgiye yaslanir; asil cizimde de bir cizginin ustunden bakar. */}
      <div className="border-b border-hair px-6">
        <SleepingRobot className="block h-auto w-[180px] sm:w-[220px]" />
      </div>
      <p className="mt-6 font-medium">{copy[0]}</p>
      {copy[1] && <p className="mt-1 text-sm text-muted">{copy[1]}</p>}
      {status === "active" && (
        <Link href="/" className="btn btn-primary mt-6 h-11 px-6 text-sm">
          Oyna
        </Link>
      )}
    </div>
  );
}
