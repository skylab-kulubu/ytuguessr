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
      return kilometers >= 10 ? `${Math.round(kilometers)} km` : `${kilometers.toFixed(1)} km`;
    }

    return `${Math.round(distance)} m`;
  };

  export function formatNameForPodium(fullName) {
    if (!fullName || fullName === "-") return fullName;
    
    const nameParts = fullName.trim().split(' ');
    
    if (nameParts.length === 1) return nameParts[0];
    
    const firstName = nameParts[0];
    const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    
    return `${firstName} ${lastNameInitial}.`;
  };