/* ---------------------------------------------------------------------
 * Oyun Kancaları
 * UI katmanını sadeleştirir; React-Query cache’ini
 * otomatik invalidation ile günceller.
 * --------------------------------------------------------------------- */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "../gameService";

/* ---------------------------------------------------------------------
 * Oyunu başlat (anasayfa)
 * Oyunu başlatmak için backend'e istek gönderir.
 * --------------------------------------------------------------------- */
export const useStartGame = () =>
  useMutation({ mutationFn: svc.startGame });

/* ---------------------------------------------------------------------
 * Aktif soru / süre bilgisi (polling)
 * Backend'den aktif soru ve süre bilgisi alır.
 * Her 1 saniyede bir backend'e istek gönderir.
 * --------------------------------------------------------------------- */
export const useCurrentStatus = () =>
  useQuery({
    queryKey: ["status"],
    queryFn : svc.getStatus,
    refetchInterval: 1000,
    refetchOnMount: "always",
  });

/* ---------------------------------------------------------------------
 * Tahmin gönder
 * Kullanıcının tahminini backend'e gönderir.
 * Tahmin gönderildiğinde status cache’ini invalid eder.
 * @param {Object} params
 * @param {number} params.lat - Latitude bilgisi
 * @param {number} params.lng - Longitude bilgisi
 * --------------------------------------------------------------------- */
export const useGuess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lat, lng }) => svc.makeGuess(lat, lng),
    onSuccess : () => qc.invalidateQueries({ queryKey: ["status"] }),
  });
};

/* ---------------------------------------------------------------------
 * Sonraki soruya geç
 * Backend'den bir sonraki soruyu alır.
 * Sorular arasında geçiş yapıldığında status cache’ini invalid eder.
 * --------------------------------------------------------------------- */
export const useNextQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.nextQuestion,
    onSuccess : () => qc.invalidateQueries({ queryKey: ["status"] }),
  });
};
