/**
 * @file YTU Davutpasa kampusunun blueprint harita ureticisi. Geometri
 * campusMapData.js'te (OpenStreetMap, ODbL); burada yalnizca cizilir.
 *
 * Renkler kasten CSS degiskeni olarak birakildi (--map-*), boylece ayni
 * markup hem koyu zeminde hem panel icinde farkli yogunlukla kullanilabilir.
 */
import {
  VIEWBOX, PLACES, BOUNDARY, KISLA, BUILDINGS, ROADS, SERVICE_ROADS, PATHS,
  COURT_PATHS, ROUTES,
} from "./campusMapData";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const num = (v) => String(Math.round(v * 10) / 10);
const pt = (p) => num(p[0]) + "," + num(p[1]);

/**
 * Polyline -> SVG path. Segmentler dumduz kalir, her kose iki kenara da teget
 * olan bir quadratic fillet ile yuvarlanir; kontrol noktasi kosenin kendisi
 * oldugu icin egri kose ucgeninin disina cikamaz. Interpolasyon yapan bir
 * spline'a donulmemeli: Catmull-Rom keskin donuslerde egriyi polyline'in
 * disina tasirip sinirlari balonlastiriyor, 90 derecelik koseleri yaya
 * ceviriyordu.
 *
 * @param {number[][]} pts Ilk ve son nokta ayniysa halka olarak kapatilir.
 * @param {number} radius Kose basina maksimum kesme payi. Segmentin yarisiyla
 *   sinirlanir, boylece komsu iki fillet cakisamaz; Infinity vermek her koseyi
 *   segment ortasina kadar keser ve tam puruzsuz quadratic B-spline uretir.
 * @returns {string}
 */
function linePath(pts, radius) {
  const last = pts[pts.length - 1];
  const closed = pts.length > 3 && pts[0][0] === last[0] && pts[0][1] === last[1];
  if (closed) pts = pts.slice(0, -1);
  const n = pts.length;
  if (n < 2) return "";
  if (n === 2) return "M" + pt(pts[0]) + "L" + pt(pts[1]);

  const at = (i) => pts[((i % n) + n) % n];

  /** @returns {number[][]|null} [giris, cikis] noktalari, kose duzse null. */
  const fillet = (i) => {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1);
    const ax = p0[0] - p1[0], ay = p0[1] - p1[1];
    const bx = p2[0] - p1[0], by = p2[1] - p1[1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (!la || !lb) return null;
    /* Gelen ve giden yonun dot'u; 1'e yakinsa kose yok, vertex oldugu gibi kalsin. */
    if (-(ax * bx + ay * by) / (la * lb) > 0.9998) return null;
    const r = Math.min(radius, la / 2, lb / 2);
    if (r < 0.15) return null;
    return [[p1[0] + (ax / la) * r, p1[1] + (ay / la) * r],
            [p1[0] + (bx / lb) * r, p1[1] + (by / lb) * r]];
  };

  if (!closed) {
    let d = "M" + pt(pts[0]);
    for (let i = 1; i < n - 1; i++) {
      const f = fillet(i);
      d += f ? "L" + pt(f[0]) + "Q" + pt(pts[i]) + " " + pt(f[1]) : "L" + pt(pts[i]);
    }
    return d + "L" + pt(pts[n - 1]);
  }

  const first = fillet(0);
  let d = "M" + pt(first ? first[0] : pts[0]);
  for (let i = 0; i < n; i++) {
    const f = i === 0 ? first : fillet(i);
    if (f) d += (i ? "L" + pt(f[0]) : "") + "Q" + pt(at(i)) + " " + pt(f[1]);
    else if (i) d += "L" + pt(at(i));
  }
  return d + "Z";
}

const ring = (pts, radius) => linePath([...pts, pts[0]], radius);
const trace = (lines, radius) => lines.map((l) => linePath(l, radius)).join("");

const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs) {
  let s = "<" + tag;
  for (const k in attrs) s += " " + k + '="' + attrs[k] + '"';
  return s + "/>";
}

export const CAMPUS_VIEWBOX = VIEWBOX;

/** Ortabahce avlusunun merkezi: marker icin varsayilan cikis noktasi. */
export const ORTABAHCE = PLACES.ortabahce;

/* Hepsi Ortabahce'de biter. Negatif gecikme animasyonu dongunun ortasindan
   baslatir; pozitif olsaydi sayfa acilisinda isiklar saniyelerce dururdu. */
const FLOWS = [
  { route: ROUTES.aKapi, dur: 15, delay: 0, accent: true },
  { route: ROUTES.bKapi, dur: 13, delay: -5, accent: true },
  { route: ROUTES.teknopark, dur: 14, delay: -9, accent: false },
];

/* Etiketler sinirin disindaki bos alanda durur. TEKNOPARK blogun altina
   degil sol ustune konuldu: alt kenar hero'nun alt gradyaninda kayboluyor. */
const LABELS = [
  ["B KAPI", PLACES.bKapi[0] + 18, PLACES.bKapi[1] - 38],
  ["A KAPI", PLACES.aKapi[0] + 14, PLACES.aKapi[1] - 30],
  ["TEKNOPARK", PLACES.teknopark[0] - 166, PLACES.teknopark[1] - 52],
];

/**
 * Harita iki ayri SVG olarak uretilir: `base` hic degismez, `live` akan
 * isiklari ve marker'i tasir. Ayrim performans icin; bkz. CampusMap.jsx.
 *
 * @param {object}   [opts]
 * @param {boolean}  [opts.labels=true]    kapi ve teknopark etiketleri
 * @param {number}   [opts.contours=4]     arka plandaki es yukselti halkalari
 * @param {boolean}  [opts.flows=true]     yollarda akan isik animasyonu
 * @param {number[]} [opts.marker]         [x, y] konumuna atilan pin
 * @param {string}   [opts.fit="meet"]     "slice" kapsayiciyi tamamen kaplar (cover)
 * @returns {{base: string, live: string}} SVG markup; animasyon yoksa live bos.
 */
export function buildCampusMapLayers(opts = {}) {
  const showLabels = opts.labels !== false;
  const showFlows = opts.flows !== false;
  const contours = opts.contours == null ? 4 : opts.contours | 0;
  const { width: W, height: H } = VIEWBOX;
  let g = "";
  let live = "";

  if (contours > 0) {
    const rnd = mulberry32(20240629);
    for (let i = 0; i < contours; i++) {
      /* Periyodik harmonikler: nokta basina beyaz gurultu halkayi tirtikli
         birakiyor ve 0 derecedeki dikiste kapanmiyordu. */
      const waves = [2, 3, 5].map((k) => [k, (rnd() - 0.5) * 0.16, rnd() * Math.PI * 2]);
      const rr = 380 + i * 120, pts = [], steps = 72;
      for (let k = 0; k < steps; k++) {
        const a = (k / steps) * Math.PI * 2;
        let wob = 1;
        for (const [kk, amp, ph] of waves) wob += amp * Math.sin(kk * a + ph);
        pts.push([W / 2 + Math.cos(a) * rr * 0.92 * wob, H / 2 + Math.sin(a) * rr * wob]);
      }
      g += el("path", { d: ring(pts, Infinity), fill: "none",
        stroke: "var(--map-line)", "stroke-width": "1",
        opacity: (0.5 - i * 0.08).toFixed(2) });
    }
  }

  g += el("path", { d: ring(BOUNDARY, 6), fill: "var(--map-fill)",
    stroke: "var(--map-line)", "stroke-width": "1.6", "stroke-linejoin": "round" });

  /* Katman basina tek path: tek <path> icinde ust uste binen stroke'lar
     saydam renkte iki kez boyanmaz, kavsaklar koyulasmaz. Bina koselerine
     fillet yok; 1x'te fark edilmiyor ama katmanin markup'ini ucte bir
     buyutuyordu. */
  g += el("path", { d: BUILDINGS.map((b) => b.map((r) => ring(r, 0)).join("")).join(""),
    fill: "var(--map-building)", "fill-rule": "evenodd",
    stroke: "var(--map-line)", "stroke-width": "0.6", "stroke-linejoin": "round" });

  g += el("path", { d: trace(PATHS, 5), fill: "none", stroke: "var(--map-path)",
    "stroke-width": "0.8", "stroke-linecap": "round", "stroke-linejoin": "round" });

  g += el("path", { d: trace(SERVICE_ROADS, 6), fill: "none", stroke: "var(--map-road)",
    "stroke-width": "1.05", "stroke-linecap": "round", "stroke-linejoin": "round" });

  g += el("path", { d: trace(ROADS, 9), fill: "none", stroke: "var(--map-road)",
    "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round" });

  g += el("path", { d: ring(KISLA, 1.2), fill: "var(--map-building)",
    stroke: "var(--map-highlight)", "stroke-width": "1.3", "stroke-linejoin": "round" });

  g += el("path", { d: trace(COURT_PATHS, 5), fill: "none",
    stroke: "var(--map-highlight)", "stroke-width": "1.2",
    "stroke-linecap": "round", "stroke-linejoin": "round" });

  if (showFlows) {
    for (const f of FLOWS) {
      const d = linePath(f.route, 6);
      const stroke = f.accent ? "var(--map-accent)" : "var(--map-road)";
      g += el("path", { d: d, fill: "none", stroke: stroke,
        "stroke-width": f.accent ? "2" : "1.6", "stroke-linecap": "round",
        "stroke-linejoin": "round", opacity: "0.18" });
      live += '<path d="' + d + '" fill="none" stroke="' + stroke +
        '" stroke-width="' + (f.accent ? "2.4" : "1.8") +
        '" stroke-linecap="round" stroke-linejoin="round" class="road-flow" style="--flow-dur:' +
        f.dur + "s;--flow-delay:" + f.delay + 's"/>';
    }
  }

  if (showLabels) {
    for (const [t, x, y] of LABELS) {
      g += '<text x="' + num(x) + '" y="' + num(y) +
        '" fill="var(--map-label)" font-size="13" ' +
        'font-family="var(--font-mono, ui-monospace, monospace)" letter-spacing="2" ' +
        'text-anchor="middle">' + t + "</text>";
    }
  }

  if (opts.marker) {
    const [mx, my] = opts.marker;
    live += '<circle cx="' + mx + '" cy="' + my +
      '" r="9" fill="var(--map-accent)" class="map-ping"/>';
    live += el("circle", { cx: mx, cy: my, r: "5.5", fill: "var(--map-accent)" });
    live += el("circle", { cx: mx, cy: my, r: "12", fill: "none",
      stroke: "var(--map-accent)", "stroke-width": "1.2", opacity: "0.45" });
  }

  /* overflow gorunur birakilmamali: slice'ta kirpilan kisim ve viewBox'tan
     tasan kontur halkalari kabin disina, ustteki gradyanlarin ortmedigi
     yere cizilip kab kenarinda keskin bir kesik birakiyordu. */
  const svg = (body) => '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="' + NS + '" ' +
    'preserveAspectRatio="xMidYMid ' + (opts.fit === "slice" ? "slice" : "meet") + '" ' +
    'shape-rendering="geometricPrecision" aria-hidden="true" focusable="false" ' +
    'style="width:100%;height:100%;display:block">' + body + "</svg>";

  return { base: svg(g), live: live ? svg(live) : "" };
}
