"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../api";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
    staleTime: 1000 * 60 * 5,
  });
}
