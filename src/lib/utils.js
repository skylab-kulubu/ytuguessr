/* ---------- MESAFE FORMATLAYICI ---------- */
  export function formatDistance(distance) {
    if (!Number.isFinite(distance)) return null;

    if (distance < 0) return "---";

    if (distance === 0) return "0 m";

    if (distance < 1 && distance > 0) {
      const centimeters = distance * 100;
      return centimeters < 10 ? `${centimeters.toFixed(2)} cm` : `${Math.round(centimeters)} cm`;
    }

    if (distance >= 5000) {
      const kilometers = distance / 1000;
      return kilometers >= 10
        ? `${Math.round(kilometers)} km`
        : `${kilometers.toFixed(1)} km`;
    }

    return `${Math.round(distance)} m`;
  };