"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../api";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
    staleTime: 1000 * 60 * 5,
    // Liste gelmezse sayfa genel tabloyla acilir; varsayilan 3 deneme ~7 sn bekletiyordu.
    retry: 1,
  });
}
