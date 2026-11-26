"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline } from "react-leaflet";
import CampusLayers, { actualPin, guessPin, mapOptions } from "../map/CampusLayers";

const isCoord = (c) => Array.isArray(c) && c.length === 2 && c.every(Number.isFinite);

/* Masaustunde sonuc paneli haritanin sol altini ortuyor; noktalar altinda kalmasin. */
function fitOptions() {
  const wide = window.matchMedia("(min-width: 1024px)").matches;
  return wide
    ? { paddingTopLeft: [470, 90], paddingBottomRight: [90, 90], maxZoom: 18.5 }
    : { padding: [44, 44], maxZoom: 18.5 };
}

function MeasureLine({ from, to }) {
  const ref = useRef(null);

  useEffect(() => {
    const path = ref.current?.getElement();
    if (!path) return;
    /* pathLength=1: cizim animasyonu cizginin ekrandaki uzunlugundan bagimsiz.
       Sinif ancak bundan sonra eklenir; once eklenirse kisa kesikli gorunur. */
    path.setAttribute("pathLength", "1");
    path.classList.add("is-drawn");
  }, []);

  return (
    <Polyline
      ref={ref}
      positions={[from, to]}
      pathOptions={{ interactive: false, className: "cm-result-line", opacity: 1 }}
    />
  );
}

export default function ResultMap({ guess = null, actual = null, distance = null }) {
  const [options] = useState(mapOptions);
  const [fit] = useState(fitOptions);
  const g = isCoord(guess) ? guess : null;
  const a = isCoord(actual) ? actual : null;
  const both = Boolean(g && a);

  const tag = useMemo(
    () => distance && L.divIcon({ className: "cm-distance", html: `<span>${distance}</span>`, iconSize: null }),
    [distance],
  );

  if (!a) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-canvas-2 text-sm text-faint">
        Konum bilgisi bulunamadı
      </div>
    );
  }

  const view = both ? { bounds: [g, a], boundsOptions: fit } : { center: a, zoom: 17.5 };

  return (
    <MapContainer {...options} {...view} className={`h-full w-full ${both ? "cm-reveal" : ""}`}>
      <CampusLayers />
      {both && <MeasureLine from={g} to={a} />}
      {both && tag && (
        <Marker
          position={[(g[0] + a[0]) / 2, (g[1] + a[1]) / 2]}
          icon={tag}
          interactive={false}
          keyboard={false}
        />
      )}
      {g && <Marker position={g} icon={guessPin} interactive={false} keyboard={false} />}
      <Marker position={a} icon={actualPin} interactive={false} keyboard={false} />
    </MapContainer>
  );
}
