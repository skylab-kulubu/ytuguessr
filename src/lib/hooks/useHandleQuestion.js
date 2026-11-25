"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatDistance } from "../utils";

export const useHandleQuestion = ({ status, nextMut, guessMut, safeNext, safeGuess }) => {
  const [question, setQuestion] = useState(null);
  const [deadline, setDeadline] = useState(null);
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

  /* Tur bir kez cevaplaninca yeni soru gelene kadar kapali kalir. guessMut
     "Sonraki tur"da sifirlandigi icin ona bakmak yetmiyor: eski sayac yeni soru
     gelmeden 0'a duserse yeni tura (0,0) gonderiyordu. */
  const answeredRef = useRef(false);
  const autoSentRef = useRef(false);
  const prevRemainingRef = useRef(0);

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
    answeredRef.current = false;
    autoSentRef.current = false;
    // En az 1 sn: suresi dolmus bir soruya donulunce de 0'a inis yasansin, otomatik gonderim tetiklensin.
    const end = Date.now() + Math.max(1, question.time_left) * 1000;
    setDeadline(end);
    setRemaining(Math.ceil((end - Date.now()) / 1000));
  }, [question]);

  useEffect(() => {
    if (guessMut.isSuccess) answeredRef.current = true;
  }, [guessMut.isSuccess]);

  useEffect(() => {
    if (!deadline) return;
    /* Kalan sure bitis anindan hesaplaniyor: arka plan sekmesinde yavaslayan
       setInterval'i saymak sayaci kaydiriyordu. */
    const id = setInterval(() => {
      if (answeredRef.current) return;
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [deadline]);

  /* ------ Otomatik 0 Tahmini ------ */
  useEffect(() => { // UI timer'ı ile otomatik tahmin
    if (
      prevRemainingRef.current > 0 &&   // geri sayım daha önce pozitifti
      remaining === 0 &&                // şimdi 0'a düştü
      !autoSentRef.current &&           // oto-gönderi henüz yapılmadı
      !answeredRef.current &&           // tur cevaplanmadı
      !guessMut.isPending               // başka tahmin yollanmıyor
    ) {
      autoSentRef.current = true;
      safeGuess({ lat: 0, lng: 0 });
    }

    prevRemainingRef.current = remaining;
  }, [remaining, guessMut.isPending, safeGuess]);

  return { question, deadline, remaining, guess, actual, setGuess, formattedDistance };
};
