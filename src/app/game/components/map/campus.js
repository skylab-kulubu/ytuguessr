/**
 * @file Oyun ici harita icin kampus geometrisi: campusMapData birimlerini
 * Leaflet'in [lat, lng] dizilerine modul yuklenirken bir kez cevirir.
 */
import {
  PROJECTION, BOUNDARY, KISLA, BUILDINGS, ROADS, SERVICE_ROADS, PATHS, COURT_PATHS,
} from "@/lib/campusMapData";
import { AREAS, LABELS, SURROUNDINGS } from "@/lib/campusMapDetails";

const { lat0, lon0, kx, ky, cx, cy } = PROJECTION;
const UNITS_PER_METRE = ky / ((Math.PI / 180) * 6378137);

/* Veri yerel esdikdortgen projeksiyonda; kampus olceginde (1.5 km) Web
   Mercator'dan farki metrenin altinda kaliyor. */
const toLatLng = ([x, y]) => [lat0 - (y - cy) / ky, lon0 + (x - cx) / kx];
const toUnits = (lat, lng) => [cx + (lng - lon0) * kx, cy + (lat0 - lat) * ky];

const line = (pts) => pts.map(toLatLng);
const polygons = (list) => list.map((rings) => rings.map(line));

/** Duz [x0, y0, x1, y1, ...] zinciri. */
function flatLine(flat) {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) out.push(toLatLng([flat[i], flat[i + 1]]));
  return out;
}
const bands = (list) => list.map((band) => band.map(flatLine));

export const CAMPUS = {
  boundary: line(BOUNDARY),
  kisla: line(KISLA),
  buildings: polygons(BUILDINGS),
  green: polygons(AREAS.green),
  pitch: polygons(AREAS.pitch),
  parking: polygons(AREAS.parking),
  water: polygons(AREAS.water),
  roads: ROADS.map(line),
  service: SERVICE_ROADS.map(line),
  paths: PATHS.map(line),
  court: COURT_PATHS.map(line),
  labels: LABELS.map(([name, x, y, tier]) => ({ name, at: toLatLng([x, y]), tier })),
  /** Kampus disi sokaklar, [yakin, orta, uzak] kusaklari. */
  outer: { major: bands(SURROUNDINGS.major), minor: bands(SURROUNDINGS.minor) },
};

const lats = CAMPUS.boundary.map((p) => p[0]);
const lngs = CAMPUS.boundary.map((p) => p[1]);

export const CAMPUS_BOUNDS = [
  [Math.min(...lats), Math.min(...lngs)],
  [Math.max(...lats), Math.max(...lngs)],
];

/* Kaydirma siniri kampusten ~300 m genis: kenardaki bir noktayi isaretlerken
   harita sinira yapisip imlecin altindan kaymasin. */
const PAD = 0.003;
export const PAN_BOUNDS = [
  [CAMPUS_BOUNDS[0][0] - PAD, CAMPUS_BOUNDS[0][1] - PAD],
  [CAMPUS_BOUNDS[1][0] + PAD, CAMPUS_BOUNDS[1][1] + PAD],
];

/** Kampus disini karartan maskenin dis halkasi. */
export const WORLD = [[85, -180], [85, 180], [-85, 180], [-85, -180]];

function inside([x, y], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function edgeDistance([x, y], poly) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}

/* Bazi cekim noktalari sinira cok yakin; sinirdan tam kesmek dogru tahmini
   engelleyebilecegi icin 25 m pay birakiliyor. */
const SLACK = 25 * UNITS_PER_METRE;

export function isOnCampus(lat, lng) {
  const p = toUnits(lat, lng);
  return inside(p, BOUNDARY) || edgeDistance(p, BOUNDARY) < SLACK;
}
