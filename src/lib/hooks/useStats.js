"use client";

import { useQuery } from "@tanstack/react-query";
import { getStats } from "../api";

export function useStats() {
    const query = useQuery({
        queryKey: ["stats"],
        queryFn: getStats,
        staleTime: 1000 * 30,
    });

    return query;
}