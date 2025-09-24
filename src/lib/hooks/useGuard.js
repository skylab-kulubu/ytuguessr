"use client";

import { useRef } from "react";
import { useCurrentStatus, useGuess, useNextQuestion } from "./useGame";

export const useGuard = () => {
    const statusQuery = useCurrentStatus();
    const guessMut = useGuess();
    const nextMut = useNextQuestion();

    const guessedRef = useRef(false);

    /* ------ Aynı Soruya Çift Tahmin ------ */
    const safeGuess = async (coords) => {
        if (guessedRef.current) return;
        guessedRef.current = true;
        await guessMut.mutateAsync(coords);
        guessedRef.current = false;
    };

    /* ------ Sıradaki Soruya Geçme ------ */
    const safeNext = () => {
        if (nextMut.isPending) return;
        nextMut.mutate();
    };

    return { statusQuery, safeGuess, safeNext, guessMut, nextMut };
};