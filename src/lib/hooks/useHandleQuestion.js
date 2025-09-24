"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatDistance } from "../utils";

export const useHandleQuestion = ({ status, nextMut, guessMut, safeNext, safeGuess }) => {
  const [question, setQuestion] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [guess, setGuess] = useState(null);

  const distanceInMeters = guessMut.data?.distance_km ? guessMut.data.distance_km * 1000 : null;
  const formattedDistance = useMemo(() => formatDistance(distanceInMeters), [distanceInMeters]);

  const actual = useMemo(() => {
  if (guessMut.isSuccess && guessMut.data?.actual_lat && guessMut.data?.actual_lng) {
    return [guessMut.data.actual_lat, guessMut.data.actual_lng];
  }
  return null;
}, [guessMut.isSuccess, guessMut.data]);

  const autoSentRef = useRef(false);
  const prevRemainingRef = useRef(remaining);

 /* ------ Soru Verisini Kullanma ------ */
  useEffect(() => { // İlk yüklemede ya da question state'i boşken yeni soru çek
    if (!status || status.game_over || nextMut.isPending) return;
    if (!question) {
      safeNext();
    }
  }, [status, question, safeNext, nextMut.isPending]);

  useEffect(() => { // nextMut başarıya ulaştığında soruyu state'e al
    if (nextMut.isSuccess && nextMut.data) {
      setQuestion(nextMut.data);
      setGuess(null);
    }
  }, [nextMut.isSuccess, nextMut.data]);

  useEffect(() => {
    if (!question) return;
    setRemaining(Math.max(1, Math.ceil(question.time_left)));

    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1_000);

    return () => clearInterval(id);
  }, [question]);

  /* ------ Otomatik 0 Tahmini ------ */
  useEffect(() => {
    autoSentRef.current = false;
    prevRemainingRef.current = remaining;
  }, [question?.image_url]);


  useEffect(() => { // UI timer'ı ile otomatik tahmin
    if (
      prevRemainingRef.current > 0 &&   // geri sayım daha önce pozitifti
      remaining === 0 &&                // şimdi 0'a düştü
      !autoSentRef.current &&           // oto-gönderi henüz yapılmadı
      !guessMut.isPending &&            // başka tahmin yollanmıyor
      !guessMut.isSuccess               // manuel tahmin yapılmadı

    ) {
      autoSentRef.current = true;
      setGuess([0, 0]);
      safeGuess({ lat: 0, lng: 0 });
    }

    prevRemainingRef.current = remaining;
  }, [remaining, guessMut.isPending, guessMut.isSuccess, safeGuess]);

  return { question, remaining, guess, actual, setGuess, formattedDistance };
};
