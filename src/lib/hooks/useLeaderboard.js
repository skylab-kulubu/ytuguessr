"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../api";
import { LEADERBOARD_PAGE_SIZE } from "../constants";

/** event yoksa genel tablo; event bir etkinlik slug'i ise o etkinligin tablosu. */
export function useLeaderboard(page = 1, event = null, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: ["leaderboard", event ?? "genel", page],
    queryFn: () => getLeaderboard(page, event),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const formatted =
    query.data && {
      page: query.data.page,
      totalPages: query.data.total_pages,
      totalUsers: query.data.total_users,
      userRank: query.data.user_rank,
      entries: query.data.leaderboard.map((u, i) => ({
        rank: (query.data.page - 1) * LEADERBOARD_PAGE_SIZE + i + 1,
        name: u.name,
        score: Math.round(u.score),
        isMe: u.is_me,
      })),
    };

  const topThree = formatted?.entries.slice(0, 3);

  return { ...query, formatted, topThree };
}
