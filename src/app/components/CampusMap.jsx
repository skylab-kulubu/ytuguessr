import { buildCampusMapSvg } from "@/lib/campusMap";

/* Katman basina tek path uretiliyor; ayni opts icin tekrar hesaplamayalim. */
const cache = new Map();

function svgFor(opts) {
  const key = JSON.stringify(opts);
  let svg = cache.get(key);
  if (!svg) {
    svg = buildCampusMapSvg(opts);
    cache.set(key, svg);
  }
  return svg;
}

/**
 * YTU Davutpasa kampus haritasi.
 * `ambient` arka plan yogunlugunu dusurur (metin ustunde okunurluk icin).
 */
export default function CampusMap({
  className = "",
  ambient = false,
  labels = true,
  contours = 4,
  flows = true,
  marker = null,
  fit = "meet",
}) {
  const svg = svgFor({ labels, contours, flows, marker, fit });

  return (
    <div
      className={`${ambient ? "map-ambient " : ""}${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
