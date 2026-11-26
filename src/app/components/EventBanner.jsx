"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEvents } from "../../lib/hooks/useEvents";
import { useNow } from "../../lib/hooks/useNow";
import { eventStatus, featuredEvent, formatEventWindow, STATUS_LABEL } from "../../lib/events";
import { RobotHead } from "./ArtlabRobot";

/** Suren ya da yaklasan etkinligin tablosuna giden serit. Etkinlik yoksa hicbir sey cizmez. */
export default function EventBanner() {
  const { data } = useEvents();
  const now = useNow();
  const event = featuredEvent(data, now);
  if (!event) return null;

  const status = eventStatus(event, now);

  return (
    <Link
      href={`/leaderboard?event=${encodeURIComponent(event.slug)}`}
      className="group mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-hair bg-white/5 p-3 pr-4 backdrop-blur transition-colors duration-200 hover:bg-white/10"
    >
      <RobotHead className="h-9 w-auto shrink-0 sm:h-10" />
      <div className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold text-ink">{event.name}</span>
        <p className="mt-0.5 text-xs text-muted">
          {formatEventWindow(event)} · {STATUS_LABEL[status]} · Etkinlik sıralaması
        </p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-ink" />
    </Link>
  );
}
