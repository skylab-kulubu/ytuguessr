"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useMap, useMapEvents } from "react-leaflet";
import { Fit, Minus, Plus } from "../Glyph";

/**
 * Yakinlastirma dugmeleri ve okumasi. Okuma, `bounds`in tamaminin sigdigi
 * gorunume gore buyutmedir: 1.0x tum kampus, 2.0x iki kat yakin.
 *
 * @param {number[][]} bounds Haritanin acilista sigdirildigi sinir.
 * @param {number[]} padding Acilistaki fitBounds ile ayni kenar payi.
 */
export default function ZoomControl({ bounds, padding }) {
  const map = useMap();
  const ref = useRef(null);
  /* fitBounds payi her iki kenara uygular; getBoundsZoom toplamini ister. */
  const fitZoom = () => map.getBoundsZoom(bounds, false, L.point(padding[0] * 2, padding[1] * 2));
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [base, setBase] = useState(fitZoom);

  useEffect(() => {
    /* Dugme harita kapsayicisinin icinde: tiklama haritaya gecip isaret
       koymasin, tekerlek de haritayi yakinlastirmasin. */
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    resize: () => setBase(fitZoom()),
  });

  const factor = 2 ** (zoom - base);
  const zoomed = factor > 1.05;

  return (
    <div ref={ref} className={`map-zoom ${zoomed ? "is-zoomed" : ""}`}>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        disabled={zoom <= map.getMinZoom()}
        aria-label="Uzaklaş"
        title="Uzaklaş"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <output className="tnum" aria-label="Yakınlaştırma oranı">
        {factor.toFixed(1)}×
      </output>
      <button
        type="button"
        onClick={() => map.zoomIn()}
        disabled={zoom >= map.getMaxZoom()}
        aria-label="Yakınlaş"
        title="Yakınlaş"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {zoomed && (
        <button
          type="button"
          onClick={() => map.flyToBounds(bounds, { padding, duration: 0.45 })}
          aria-label="Tüm kampüsü göster"
          title="Tüm kampüs"
          className="map-zoom__fit"
        >
          <Fit className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
