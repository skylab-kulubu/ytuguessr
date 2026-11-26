"use client";

import { memo, useEffect } from "react";
import L from "leaflet";
import { Marker, Polygon, Polyline, useMap } from "react-leaflet";
import { CAMPUS, PAN_BOUNDS, WORLD } from "./campus";

/**
 * MapContainer secenekleri. Renderer bir haritaya baglanir, iki harita ayni
 * ornegi paylasamaz; bu yuzden her harita icin yeniden uretilir.
 */
export const mapOptions = () => ({
  /* Daha uzaktan cevre verisinin bittigi ~800 m'lik cerceve gorunmeye basliyor. */
  minZoom: 14.5,
  maxZoom: 19.5,
  zoomSnap: 0.25,
  zoomDelta: 0.5,
  wheelPxPerZoomLevel: 110,
  maxBounds: PAN_BOUNDS,
  maxBoundsViscosity: 0.9,
  zoomControl: false,
  doubleClickZoom: false,
  /* Kampus kucuk; varsayilan 0.1 dolgu hizli kaydirmada kenarda bos serit birakiyor. */
  renderer: L.svg({ padding: 0.6 }),
});

const pin = (src, className) =>
  L.divIcon({
    className: `cm-pin ${className}`,
    html: `<img src="${src}" alt="" draggable="false">`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

export const guessPin = pin("/marker-red.svg", "cm-pin--guess");
export const actualPin = pin("/marker-green.svg", "cm-pin--actual");

/* Renk ve kalinliklar globals.css'teki .cm-* siniflarinda. CSS ozellikleri
   Leaflet'in yazdigi SVG niteliklerini ezer; burada sadece davranis var. */
const paint = (className, extra) => ({
  interactive: false,
  smoothFactor: 0.4,
  opacity: 1,
  fillOpacity: 1,
  className,
  ...extra,
});

const NO_STROKE = { stroke: false };

/* Katmanlara pathOptions ile degil prop olarak verilir: Leaflet className ve
   interactive'i yalniz SVG yolu ilk cizilirken okur. pathOptions katman
   eklendikten sonra setStyle ile gelir ve sinif eklemez; production'da yollar
   Leaflet'in varsayilan mavisinde kaliyordu (dev'de StrictMode katmani yeniden
   ekledigi icin gorunmuyordu). */
const STYLE = {
  ground: paint("cm-ground", NO_STROKE),
  green: paint("cm-green", NO_STROKE),
  parking: paint("cm-parking", NO_STROKE),
  pitch: paint("cm-pitch"),
  water: paint("cm-water", NO_STROKE),
  building: paint("cm-building"),
  path: paint("cm-path"),
  service: paint("cm-service"),
  road: paint("cm-road"),
  kisla: paint("cm-kisla"),
  court: paint("cm-court"),
  mask: paint("cm-mask", NO_STROKE),
  edge: paint("cm-edge", { fill: false }),
  outer: {
    major: [0, 1, 2].map((b) => paint(`cm-out cm-out--major cm-out--b${b}`)),
    minor: [0, 1, 2].map((b) => paint(`cm-out cm-out--minor cm-out--b${b}`)),
  },
};

const MASK = [WORLD, CAMPUS.boundary];

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const LABEL_ICONS = CAMPUS.labels.map(({ name, tier }) =>
  L.divIcon({ className: `cm-label cm-t${tier}`, html: `<span>${escapeHtml(name)}</span>`, iconSize: null }),
);

/* Etiket kademesi zoom'a gore container'a yazilir; hangi etiketin gizlenecegi
   CSS'te. 70 marker'i her zoom'da yeniden render etmekten ucuz. */
const tierAt = (zoom) => (zoom >= 17.5 ? 3 : zoom >= 16.5 ? 2 : zoom >= 15.5 ? 1 : 0);

const overlaps = (a, b) =>
  a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 2 && a.bottom > b.top - 2;

/**
 * Kademeyi gunceller ve cakisan etiketleri gizler. LABELS oncelik sirasinda
 * (kapilar, sonra buyuk yapilar) geldigi icin DOM sirasi yerlesim sirasidir.
 */
function LabelLayout() {
  const map = useMap();

  useEffect(() => {
    const el = map.getContainer();
    const layout = () => {
      el.dataset.tier = String(tierAt(map.getZoom()));
      const placed = [];
      for (const label of el.querySelectorAll(".cm-label")) {
        label.classList.remove("is-crowded");
        const rect = label.firstElementChild?.getBoundingClientRect();
        if (!rect?.width) continue;
        if (placed.some((p) => overlaps(rect, p))) label.classList.add("is-crowded");
        else placed.push(rect);
      }
    };
    layout();
    map.on("zoomend moveend", layout);
    return () => {
      map.off("zoomend moveend", layout);
    };
  }, [map]);

  return null;
}

function Attribution() {
  const map = useMap();

  useEffect(() => {
    const control = map.attributionControl;
    if (!control) return;
    const text = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
    control.setPrefix(false).addAttribution(text);
    return () => {
      control.removeAttribution(text);
    };
  }, [map]);

  return null;
}

/** Ust bilesen her saniye (sure) render olsa da bu katmanlar hic yeniden render olmaz. */
const CampusLayers = memo(function CampusLayers({ labels = true }) {
  return (
    <>
      <Polygon positions={CAMPUS.boundary} {...STYLE.ground} />
      <Polygon positions={CAMPUS.green} {...STYLE.green} />
      <Polygon positions={CAMPUS.parking} {...STYLE.parking} />
      <Polygon positions={CAMPUS.pitch} {...STYLE.pitch} />
      <Polygon positions={CAMPUS.water} {...STYLE.water} />
      <Polygon positions={CAMPUS.buildings} {...STYLE.building} />
      <Polyline positions={CAMPUS.paths} {...STYLE.path} />
      <Polyline positions={CAMPUS.service} {...STYLE.service} />
      <Polyline positions={CAMPUS.roads} {...STYLE.road} />
      <Polygon positions={CAMPUS.kisla} {...STYLE.kisla} />
      <Polyline positions={CAMPUS.court} {...STYLE.court} />
      <Polygon positions={MASK} {...STYLE.mask} />
      {/* Cevre sokaklari maskenin ustunde: soluk renkleri kendi siniflarinda. */}
      {["minor", "major"].map((cls) =>
        CAMPUS.outer[cls].map((band, i) => (
          <Polyline key={cls + i} positions={band} {...STYLE.outer[cls][i]} />
        )),
      )}
      <Polygon positions={CAMPUS.boundary} {...STYLE.edge} />
      <Attribution />
      {labels &&
        CAMPUS.labels.map((label, i) => (
          <Marker
            key={i}
            position={label.at}
            icon={LABEL_ICONS[i]}
            interactive={false}
            keyboard={false}
          />
        ))}
      {/* Etiketlerden sonra: ilk yerlesim olcumu icin marker'lar DOM'da olmali. */}
      <LabelLayout />
    </>
  );
});

export default CampusLayers;
