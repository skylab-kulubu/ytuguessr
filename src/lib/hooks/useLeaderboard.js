"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../api"; 

export function useLeaderboard(page = 1) {
  const query = useQuery({
    queryKey: ["leaderboard", page],
    queryFn: () => getLeaderboard(page),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

  const formatted =
    query.data && {
      page: query.data.page,
      totalPages: query.data.total_pages,
      totalUsers: query.data.total_users,
      userRank: query.data.user_rank,
      entries: query.data.leaderboard.map((u, i) => ({
        rank: (query.data.page - 1) * query.data.leaderboard.length + i + 1,
        name: u.name,
        score: Math.round(u.score),
        isMe: u.is_me,
      })),
    };

  const topThree = formatted?.entries.slice(0, 3);

  return { ...query, formatted, topThree };
}
