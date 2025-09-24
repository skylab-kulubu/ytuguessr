import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "../api";

/* ---------------------------------------------------------------------
 * Oyunu başlat (anasayfa)
 * Oyunu başlatmak için backend'e istek gönderir.
 * --------------------------------------------------------------------- */
export const useStartGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.startGame,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["status"] });
      await qc.fetchQuery({ queryKey: ["status"], queryFn: svc.getStatus });
    },
  });
};

/* ---------------------------------------------------------------------
 * Aktif soru bilgisi
 * Backend'den aktif soru bilgisi alır.
 * Her 1 saniyede bir backend'e istek gönderir. (Oyunun var olduğunun kontrolü)
 * --------------------------------------------------------------------- */
export const useCurrentStatus = () =>
  useQuery({
    queryKey: ["status"],
    queryFn : svc.getStatus,
    refetchOnMount: "always",
  });

/* ---------------------------------------------------------------------
 * Tahmin gönder
 * Kullanıcının tahminini backend'e gönderir.
 * Tahmin gönderildiğinde status cache’ini invalid eder.
 * Girdi olarak: { lat, lng } alır.
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
