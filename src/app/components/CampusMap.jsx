import { buildCampusMapLayers } from "@/lib/campusMap";

/* Katman basina tek path uretiliyor; ayni opts icin tekrar hesaplamayalim. */
const cache = new Map();

function layersFor(opts) {
  const key = JSON.stringify(opts);
  let layers = cache.get(key);
  if (!layers) {
    layers = buildCampusMapLayers(opts);
    cache.set(key, layers);
  }
  return layers;
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
  const { base, live } = layersFor({ labels, contours, flows, marker, fit });

  return (
    <div className={`${ambient ? "map-ambient " : ""}${className}`}>
      <div className="relative h-full w-full">
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: base }} />
        {/* Akan isiklar kendi compositor katmaninda: stroke-dashoffset her
            karede repaint ister, ayni katmanda kalsa binalar ve yuzlerce yol
            da her karede yeniden rasterize edilirdi. */}
        {live && (
          <div
            className="absolute inset-0 will-change-transform"
            dangerouslySetInnerHTML={{ __html: live }}
          />
        )}
      </div>
    </div>
  );
}
