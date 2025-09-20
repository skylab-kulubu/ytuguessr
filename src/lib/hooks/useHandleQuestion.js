/* ---------------------------------------------------------------------
 * Question handling ve otomatik tahmin mantığını yöneten hook
 * 
 * @param {Object} params
 * @param {Object} params.status - Game status from useGuard
 * @param {Object} params.nextMut - Next question mutation from useGuard
 * @param {Object} params.guessMut - Guess mutation from useGuard
 * @param {Function} params.safeNext - Safe next function from useGuard
 * @param {Function} params.safeGuess - Safe guess function from useGuard
 * --------------------------------------------------------------------- */
"use client";

import { useState, useEffect, useRef } from "react";

export const useHandleQuestion = ({ status, nextMut, guessMut, safeNext, safeGuess }) => {
  
  /* LOCAL STATE ------------------------------------------------------------------ */  
  const [question, setQuestion] = useState(null);      // { image_url, time_left }
  const [remaining, setRemaining] = useState(0);       // saniye int
  const [guess, setGuess] = useState(null);            // [lat,lng]
  const [actual, setActual] = useState(null);          // [lat,lng]
  const [formattedDistance, setFormattedDistance] = useState(null); // formatlanmış mesafe

  /* REFS FOR AUTO GUESS ------------------------------------------------------------------ */
  const autoSentRef = useRef(false);
  const prevRemainingRef = useRef(remaining);

  /* QUESTION HANDLING ------------------------------------------------------------------ */
  useEffect(() => { // İlk yüklemede ya da question state'i boşken yeni soru çek
    if (!status || status.game_over || nextMut.isPending) return;
    if (!question) {
      safeNext();
    }
  }, [status, question, safeNext, nextMut.isPending]);

  useEffect(() => { // nextMut başarıya ulaştığında soruyu state'e al
    if (nextMut.isSuccess && nextMut.data) {
      setQuestion(nextMut.data);
      setActual(null);
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

  useEffect(() => {
    if (guessMut.isSuccess && guessMut.data?.actual_lat && guessMut.data?.actual_lng) {
      setActual([guessMut.data.actual_lat, guessMut.data.actual_lng]);
      
      // Distance'ı formatla (km'den m'ye çevir ve formatla)
      const distanceInMeters = guessMut.data?.distance_km * 1000;
      setFormattedDistance(formatDistance(distanceInMeters));
    }
  }, [guessMut.isSuccess, guessMut.data]);

  /* DISTANCE FORMATTING ------------------------------------------------------------------ */
  const formatDistance = (distance) => {
    if (!Number.isFinite(distance)) return null;
    
    if (distance === 0) return "0 m";
    
    // Distance < 1m && > 0 -> cm'e dönüştür
    if (distance < 1 && distance > 0) {
      const centimeters = distance * 100;
      return centimeters < 10 ? `${centimeters.toFixed(2)} cm` : `${Math.round(centimeters)} cm`;
    }
    
    // Distance >= 5000m -> km'e dönüştür
    if (distance >= 5000) {
      const kilometers = distance / 1000;
      return kilometers >= 10 
        ? `${Math.round(kilometers)} km` 
        : `${kilometers.toFixed(1)} km`;
    }
    
    // Distance 1m-5000m arası -> metre olarak göster
    return `${Math.round(distance)} m`;
  };

  /* OTOMATİK 0-TAHMİN ------------------------------------------------------------------ */
  useEffect(() => { // Soru her değiştiğinde bayrakları sıfırla
    autoSentRef.current = false;
    prevRemainingRef.current = remaining;
  }, [question?.image_url]);

  
  useEffect(() => { // UI timer'ı ile otomatik tahmin
    if (
      prevRemainingRef.current > 0 &&   // geri sayım daha önce pozitifti
      remaining === 0 &&                // şimdi 0'a düştü
      !autoSentRef.current &&           // oto-gönderi henüz yapılmadı
      !guessMut.isPending &&            // başka tahmin yollanmıyor
      !guessMut.isSuccess &&            // manuel tahmin yapılmadı
      !guess                            // kullanıcı işaret seçmedi
    ) {
      autoSentRef.current = true;
      setGuess([0, 0]);
      safeGuess({ lat: 0, lng: 0 });   
    }
    
    prevRemainingRef.current = remaining;
  }, [remaining, guess, guessMut.isPending, guessMut.isSuccess, safeGuess]);

  return {
    question,
    remaining,
    guess,
    actual,
    setGuess,
    formattedDistance,
  };
};
