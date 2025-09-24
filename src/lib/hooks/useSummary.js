"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistance } from "../utils";
import { getSummary } from "../gameService";

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}dk ${sec}s`;
};
const formatScore = (sc) => Math.round(sc);

export function useSummary() {
  const query = useQuery({
    queryKey: ["summary"],
    queryFn: getSummary,
    staleTime: 1000 * 60
  });

  const formatted =
    query.data && {
      summary: {
        totalDistance: formatDistance(query.data.summary.total_distance_km * 1000),
        totalTime:     formatTime(query.data.summary.total_time_sec),
        totalScore:    formatScore(query.data.summary.total_score),
      },
      guesses: query.data.guesses.map((g) => ({
        distance: formatDistance(g.distance_km * 1000),
        time:     formatTime(g.time_sec),
        score:    formatScore(g.score),
      })),
    };

  return {
    ...query,
    formatted,
  };
}
