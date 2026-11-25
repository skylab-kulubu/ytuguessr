#!/usr/bin/env node
/**
 * @file src/lib/campusMapData.js ve campusMapDetails.js ureticisi: YTU
 * Davutpasa kampusunu ve cevresini OpenStreetMap'ten indirir, SVG
 * koordinatlarina cevirip sadelestirir.
 *
 * Kullanim: node scripts/build-campus-map.mjs [--cache klasor]
 * --cache verilirse indirilen parcalar orada saklanir ve tekrar indirilmez.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/lib/campusMapData.js");
/* Yalnizca oyun haritasinin kullandigi katmanlar ayri dosyada: hero'nun
   bundle'ina girmesinler. */
const OUT_DETAILS = path.join(ROOT, "src/lib/campusMapDetails.js");

const cacheAt = process.argv.indexOf("--cache");
const CACHE = cacheAt > 0 ? process.argv[cacheAt + 1] : null;

/** minLon, minLat, maxLon, maxLat: kampus ve ~800 m cevresi. */
const AREA = [28.8743, 41.0112, 28.9091, 41.0398];

const VIEW = { width: 1000, height: 980 };
const UNITS_PER_METRE = 0.56;

/* Sadelestirme toleranslari (SVG birimi, hero'da ~1-1.3px). Ana yollar en
   belirgin katman oldugu icin en siki onlar tutuluyor; cevre soluk bir
   arka plan oldugu icin en gevsek. */
const TOL = { road: 0.3, service: 0.45, path: 0.5, court: 0.4, shape: 0.45, area: 0.6, outer: 1.2 };
const MIN_BUILDING_M2 = 100;
const MIN_AREA_M2 = { green: 150, pitch: 100, parking: 150, water: 40 };

/* API tek istekte 50.000 dugumle sinirli; bu yogunlukta alan 2x2 parcaya
   bolunmezse istek reddediliyor. */
function tiles([x0, y0, x1, y1]) {
  const xm = +((x0 + x1) / 2).toFixed(4), ym = +((y0 + y1) / 2).toFixed(4);
  return [[x0, y0, xm, ym], [xm, y0, x1, ym], [x0, ym, xm, y1], [xm, ym, x1, y1]];
}

async function loadTile(bbox) {
  const file = CACHE && path.join(CACHE, `tile-${bbox.join("_")}.osm`);
  if (file && fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const url = "https://api.openstreetmap.org/api/0.6/map?bbox=" + bbox.join(",");
  const res = await fetch(url, { headers: { "User-Agent": "campus-map-builder/1.0" } });
  if (!res.ok) throw new Error(`OSM API ${res.status}: ${await res.text()}`);
  const xml = await res.text();
  if (file) {
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, xml);
  }
  return xml;
}

/** Parcalari ayni haritalara toplar; komsu parcalarda tekrar eden ogeler ayni id ile ezilir. */
function parseOsm(xml, { nodes, ways, rels }) {
  const attr = (s, k) => (s.match(new RegExp("\\b" + k + '="([^"]*)"')) || [])[1];
  const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const re = /<(node|way|relation)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  for (const [, kind, head, body = ""] of xml.matchAll(re)) {
    const id = attr(head, "id");
    const tags = {};
    for (const t of body.matchAll(/<tag k="([^"]*)" v="([^"]*)"\s*\/>/g)) tags[unesc(t[1])] = unesc(t[2]);
    if (kind === "node") nodes.set(id, { lon: +attr(head, "lon"), lat: +attr(head, "lat"), tags });
    else if (kind === "way") ways.set(id, { refs: [...body.matchAll(/<nd ref="(\d+)"/g)].map((m) => m[1]), tags });
    else rels.set(id, { tags, members: [...body.matchAll(/<member type="(\w+)" ref="(\d+)" role="([^"]*)"/g)]
      .map((m) => ({ type: m[1], ref: m[2], role: m[3] })) });
  }
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

const edgeDist = (p, poly) => Math.min(...poly.map((a, i) => segDist(p, a, poly[(i + 1) % poly.length])));

function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function area(poly) {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return s / 2;
}

function centroid(poly) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    a += f; cx += (poly[j][0] + poly[i][0]) * f; cy += (poly[j][1] + poly[i][1]) * f;
  }
  return [cx / (3 * a), cy / (3 * a)];
}

/** a-b segmentinin poligon kenarlarini kestigi parametreler, (0,1) araliginda. */
function crossings(a, b, poly) {
  const ts = [];
  const rx = b[0] - a[0], ry = b[1] - a[1];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = poly[j], d = poly[i];
    const sx = d[0] - c[0], sy = d[1] - c[1];
    const den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
    const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
    if (t > 1e-9 && t < 1 - 1e-9 && u >= 0 && u <= 1) ts.push(t);
  }
  return ts.sort((x, y) => x - y);
}

/**
 * {p, id} vertex'lerinden olusan polyline'i `poly`nin icinde (keepInside
 * false ise disinda) kalan parcalara boler. Kesim noktalari "x" ile baslayan
 * sentetik id alir, boylece gercek bir OSM dugumuyle birlesmez.
 */
function clip(line, poly, keepInside = true) {
  const runs = [];
  let run = null;
  const push = (v) => {
    if (!run) { run = [v]; runs.push(run); return; }
    if (run[run.length - 1].id !== v.id) run.push(v);
  };
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1];
    const ts = [0, ...crossings(a.p, b.p, poly), 1];
    for (let k = 0; k + 1 < ts.length; k++) {
      const t0 = ts[k], t1 = ts[k + 1];
      const tm = (t0 + t1) / 2;
      const mid = [a.p[0] + (b.p[0] - a.p[0]) * tm, a.p[1] + (b.p[1] - a.p[1]) * tm];
      const at = (t) => t === 0 ? a : t === 1 ? b
        : { p: [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t], id: "x" + a.id + "-" + b.id + "-" + t.toFixed(6) };
      if (inside(mid, poly) === keepInside) { push(at(t0)); push(at(t1)); }
      else run = null;
    }
  }
  return runs.filter((r) => r.length > 1 && r.reduce((s, v, i) => s + (i ? dist(v.p, r[i - 1].p) : 0), 0) > 0.5);
}

/** Douglas-Peucker; `pinned(i)` true olan vertex'ler asla atilmaz. */
function simplify(pts, tol, pinned = () => false) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  for (let i = 1; i < pts.length - 1; i++) if (pinned(i)) keep[i] = 1;
  const stack = [];
  for (let i = 1, prev = 0; i < pts.length; i++) if (keep[i]) { stack.push([prev, i]); prev = i; }
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = segDist(pts[i], pts[a], pts[b]);
      if (d > max) { max = d; at = i; }
    }
    if (max > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function simplifyRing(ring, tol) {
  /* Halkanin dikisi rastgele bir noktada; en uzak noktadan ikiye bolmek
     dikis vertex'inin sirf baslangic oldugu icin korunmasini engeller. */
  let far = 0, best = -1;
  for (let i = 1; i < ring.length; i++) { const d = dist(ring[0], ring[i]); if (d > best) { best = d; far = i; } }
  const a = simplify(ring.slice(0, far + 1), tol);
  const b = simplify([...ring.slice(far), ring[0]], tol);
  return [...a, ...b.slice(1, -1)];
}

/** Multipolygon uye yollarini uc uca ekleyip kapali halkalar kurar. */
function assembleRings(lines) {
  const open = lines.map((l) => l.slice());
  const rings = [];
  while (open.length) {
    let ring = open.pop();
    let guard = 0;
    while (ring[0] !== ring[ring.length - 1] && guard++ < 1000) {
      const end = ring[ring.length - 1];
      const i = open.findIndex((l) => l[0] === end || l[l.length - 1] === end);
      if (i < 0) break;
      const next = open.splice(i, 1)[0];
      ring = ring.concat((next[0] === end ? next : next.reverse()).slice(1));
    }
    if (ring[0] === ring[ring.length - 1]) rings.push(ring);
  }
  return rings;
}

const osm = { nodes: new Map(), ways: new Map(), rels: new Map() };
for (const bbox of tiles(AREA)) parseOsm(await loadTile(bbox), osm);
/* Parcalarin birlesme sirasi cikti sirasini degistirmesin: API'nin tek parcada
   verdigi gibi id sirasina dizilir, ayni veri hep ayni dosyayi uretir. */
const byId = (map) => new Map([...map].sort((a, b) => Number(a[0]) - Number(b[0])));
const { nodes } = osm;
const ways = byId(osm.ways);
const rels = byId(osm.rels);

const findWay = (pred, what) => {
  for (const [id, w] of ways) if (pred(w.tags)) return { id, ...w };
  throw new Error(what + " bulunamadi");
};
const findNode = (pred, what) => {
  for (const [id, n] of nodes) if (pred(n.tags)) return { id, ...n };
  throw new Error(what + " bulunamadi");
};

const campusWay = findWay((t) => t.amenity === "university" && /Davutpa/.test(t.name || ""), "Kampus siniri");
const kislaWay = findWay((t) => t.wikidata === "Q6095594", "Davutpasa Kislasi");
const courtWay = findWay((t) => t.name === "Ortabahçe", "Ortabahce");
const teknoparkWay = findWay((t) => t.name === "Yıldız Teknopark" && t.landuse, "Teknopark");
const gateA = findNode((t) => /Ana Giriş Kapısı/.test(t.name || ""), "A Kapi");
const gateB = findNode((t) => t.name === "Fakülte B Kapısı", "B Kapi duragi");

const lls = (refs) => refs.map((r) => nodes.get(r)).filter(Boolean);
const campusLL = lls(campusWay.refs);
const lat0 = (Math.min(...campusLL.map((n) => n.lat)) + Math.max(...campusLL.map((n) => n.lat))) / 2;
const lon0 = (Math.min(...campusLL.map((n) => n.lon)) + Math.max(...campusLL.map((n) => n.lon))) / 2;
const M_PER_DEG = (Math.PI / 180) * 6378137;
const kx = M_PER_DEG * Math.cos((lat0 * Math.PI) / 180) * UNITS_PER_METRE;
const ky = M_PER_DEG * UNITS_PER_METRE;
const project = (n) => [VIEW.width / 2 + (n.lon - lon0) * kx, VIEW.height / 2 + (lat0 - n.lat) * ky];
const ring = (refs) => { const r = lls(refs).map(project); return dist(r[0], r[r.length - 1]) < 1e-6 ? r.slice(0, -1) : r; };

const BOUNDARY = ring(campusWay.refs);
const COURT = ring(courtWay.refs);

const CLASS = {
  road: new Set(["primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "pedestrian", "road"]),
  service: new Set(["service", "track"]),
  path: new Set(["footway", "path", "cycleway", "steps", "bridleway"]),
};
const classify = (t) => {
  if (t.area === "yes" || t.indoor === "yes" || t.tunnel === "yes" || +t.layer < 0) return null;
  /* Kaldirimlar yolun hemen yanina ikinci cizgi, gecitler kisa capraz cizik
     birakiyor; ikisi de haritayi kalabaliklastiriyor. */
  if (t.footway === "sidewalk" || t.footway === "crossing") return null;
  for (const k in CLASS) if (CLASS[k].has(t.highway)) return k;
  return null;
};

const runsByClass = { road: [], service: [], path: [], court: [] };
/** Arac yollarinin kampus sinirini kestigi noktalar: kapilar. */
const gates = [];
for (const [, w] of ways) {
  const cls = w.tags.highway && classify(w.tags);
  if (!cls) continue;
  const line = w.refs.filter((r) => nodes.has(r)).map((r) => ({ id: r, p: project(nodes.get(r)) }));
  if (line.length < 2) continue;
  for (const run of clip(line, BOUNDARY)) {
    if (cls === "road" || cls === "service") {
      for (const v of [run[0], run[run.length - 1]]) if (v.id.startsWith("x")) gates.push(v);
    }
    if (cls !== "path") { runsByClass[cls].push(run); continue; }
    runsByClass.court.push(...clip(run, COURT, true));
    runsByClass.path.push(...clip(run, COURT, false));
  }
}

const pos = new Map();
const degree = new Map();
const edgeKey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
const edgesByClass = {};
for (const cls in runsByClass) {
  const seen = new Set();
  const edges = [];
  for (const run of runsByClass[cls]) {
    for (const v of run) pos.set(v.id, v.p);
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i].id, b = run[i + 1].id;
      if (a === b || seen.has(edgeKey(a, b))) continue;
      seen.add(edgeKey(a, b));
      edges.push({ a, b });
      degree.set(a, (degree.get(a) || 0) + 1);
      degree.set(b, (degree.get(b) || 0) + 1);
    }
  }
  edgesByClass[cls] = edges;
}

/* Kavsak dugumleri sabit: sadelestirme birini kaydirirsa o kavsaga baglanan
   diger zincirin ucu cizginin yanina duser. */
const isJunction = (id) => (degree.get(id) || 0) > 2;

/**
 * Kenarlari uzun zincirlere baglar. Kavsakta en duz devam eden iki kenar
 * eslenir; boylece yol T kavsaktan tek polyline olarak gecer ve kose
 * yumusatmasi kavsakta kirilmaz.
 */
function strokes(edges) {
  const inc = new Map();
  edges.forEach((e, i) => {
    for (const n of [e.a, e.b]) { if (!inc.has(n)) inc.set(n, []); inc.get(n).push(i); }
  });
  const other = (i, n) => (edges[i].a === n ? edges[i].b : edges[i].a);
  const pair = new Map();
  for (const [n, list] of inc) {
    if (list.length < 2) continue;
    const c = pos.get(n);
    const dir = (i) => { const o = pos.get(other(i, n)); const l = dist(o, c) || 1; return [(o[0] - c[0]) / l, (o[1] - c[1]) / l]; };
    const cand = [];
    for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
      const u = dir(list[x]), v = dir(list[y]);
      /* -dot: 1 dumduz devam, 0 dik donus. */
      cand.push([-(u[0] * v[0] + u[1] * v[1]), list[x], list[y]]);
    }
    cand.sort((p, q) => q[0] - p[0]);
    const done = new Set();
    for (const [straight, i, j] of cand) {
      if (done.has(i) || done.has(j)) continue;
      if (list.length > 2 && straight < 0.5) break;
      pair.set(n + "#" + i, j); pair.set(n + "#" + j, i);
      done.add(i); done.add(j);
    }
  }
  const used = new Uint8Array(edges.length);
  const out = [];
  /** @returns {boolean} zincir baslangic dugumune donup halka olduysa true */
  const walk = (start, n, ids) => {
    let e = start;
    for (;;) {
      const next = pair.get(n + "#" + e);
      if (next === undefined || used[next]) return false;
      used[next] = 1;
      n = other(next, n);
      ids.push(n);
      e = next;
      if (n === ids[0]) return true;
    }
  };
  for (let s = 0; s < edges.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const ids = [edges[s].a, edges[s].b];
    if (!walk(s, edges[s].b, ids)) {
      const back = [edges[s].b];
      walk(s, edges[s].a, back);
      ids.splice(0, 1, ...back.slice(1).reverse(), edges[s].a);
    }
    out.push(ids);
  }
  return out;
}

const round = (v) => Math.round(v * 10) / 10;
const rp = (p) => [round(p[0]), round(p[1])];

function chainsFor(cls) {
  return strokes(edgesByClass[cls]).map((ids) => {
    const pts = ids.map((id) => pos.get(id));
    return simplify(pts, TOL[cls], (i) => isJunction(ids[i])).map(rp);
  }).filter((c) => c.length > 1);
}

const ROADS = chainsFor("road");
const SERVICE_ROADS = chainsFor("service");
const PATHS = chainsFor("path");
const COURT_PATHS = chainsFor("court");

/** Kapali yollari ve multipolygon iliskilerini [dis, ...delikler] olarak gezer. */
function eachPolygon(fn) {
  for (const [id, w] of ways) {
    if (w.refs.length > 3 && w.refs[0] === w.refs[w.refs.length - 1]) fn(w.tags, ring(w.refs), [], id);
  }
  for (const [, r] of rels) {
    if (r.tags.type !== "multipolygon") continue;
    const get = (role) => assembleRings(r.members
      .filter((m) => m.type === "way" && m.role === role && ways.has(m.ref))
      .map((m) => ways.get(m.ref).refs)).map(ring);
    const inners = get("inner");
    for (const o of get("outer")) fn(r.tags, o, inners.filter((h) => inside(h[0], o)), null);
  }
}

const areaM2 = (poly) => Math.abs(area(poly)) / UNITS_PER_METRE ** 2;
const mostlyInside = (poly) => poly.filter((p) => inside(p, BOUNDARY)).length >= poly.length / 2;
const shape = (rings, tol) => rings.map((r) => simplifyRing(r, tol).map(rp));

function areaKind(t) {
  if (t.natural === "water") return "water";
  if (t.leisure === "pitch" || t.leisure === "track") return "pitch";
  if (t.amenity === "parking") return t.parking === "underground" || +t.layer < 0 ? null : "parking";
  if (["grass", "meadow", "forest", "village_green", "recreation_ground"].includes(t.landuse) ||
      ["park", "garden"].includes(t.leisure) || ["wood", "scrub", "grassland"].includes(t.natural)) return "green";
  return null;
}

/* Bazi OSM adlari tamamen buyuk harf ("BUYUK EV"); etikette digerleriyle
   ayni yazimda dursun. Kisaltmalar oldugu gibi kalir. */
const ACRONYMS = new Set(["YTÜ", "TM"]);
const tidyName = (s) => s === s.toLocaleUpperCase("tr") && /\p{Lu}{3}/u.test(s)
  ? s.split(" ").map((w) => ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLocaleLowerCase("tr")).join(" ")
  : s;

/** Poligonun icinde, kenarlara en uzak noktaya yakin bir etiket konumu. */
function labelPoint(rings) {
  const outer = rings[0];
  const xs = outer.map((p) => p[0]), ys = outer.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const step = Math.max(x1 - x0, y1 - y0) / 24;
  const ringDist = (p) => Math.min(...rings.map((r) => edgeDist(p, r)));
  let best = centroid(outer), bestD = -1;
  for (let x = x0 + step / 2; x < x1; x += step) {
    for (let y = y0 + step / 2; y < y1; y += step) {
      const p = [x, y];
      if (!inside(p, outer) || rings.slice(1).some((h) => inside(p, h))) continue;
      const d = ringDist(p);
      if (d > bestD) { bestD = d; best = p; }
    }
  }
  return best;
}

/* Etiket kademesi: buyuk yapilar uzaktan, kucukler yakinlasinca gorunur.
   1-3 giderek daha yakin zoom ister; genel gorunumde hic etiket yok (bkz. CampusLayers). */
const tierFor = (m2) => (m2 >= 3000 ? 1 : m2 >= 900 ? 2 : 3);

const BUILDINGS = [];
const AREAS = { green: [], pitch: [], parking: [], water: [] };
const LABELS = [];
eachPolygon((t, outer, holes, id) => {
  if (!mostlyInside(outer)) return;
  const m2 = areaM2(outer);
  const name = t["name:tr"] || t.name;
  const kind = areaKind(t);
  if (t.building && id !== kislaWay.id && m2 >= MIN_BUILDING_M2) {
    BUILDINGS.push(shape([outer, ...holes], TOL.shape));
  } else if (kind && m2 >= MIN_AREA_M2[kind]) {
    AREAS[kind].push(shape([outer, ...holes], TOL.area));
  }
  /* Kisla etiketsiz: merkezi Ortabahce'ye duser ve onun etiketiyle cakisir. */
  const labelled = t.building ? t.building !== "transformer" && id !== kislaWay.id
    : kind || ["residential", "commercial"].includes(t.landuse);
  if (name && labelled && m2 >= 60) LABELS.push([tidyName(name), ...rp(labelPoint([outer, ...holes])), tierFor(m2), m2]);
});

/* Rotalar yuruyus agi uzerinde en kisa yol; maliyet katsayilari isigi
   mumkun oldugunca ana yolda tutar, yaya yollarina sadece kisaltirsa sapar. */
const COST = { road: 1, service: 1.15, path: 1.5, court: 1.5 };
const adj = new Map();
for (const cls in edgesByClass) for (const { a, b } of edgesByClass[cls]) {
  const w = dist(pos.get(a), pos.get(b)) * COST[cls];
  for (const [x, y] of [[a, b], [b, a]]) { if (!adj.has(x)) adj.set(x, []); adj.get(x).push([y, w]); }
}

function route(from, to) {
  const d = new Map([[from, 0]]), prev = new Map(), done = new Set();
  for (;;) {
    let u = null, best = Infinity;
    for (const [k, v] of d) if (!done.has(k) && v < best) { best = v; u = k; }
    if (u === null) throw new Error("rota bulunamadi");
    if (u === to) break;
    done.add(u);
    for (const [v, w] of adj.get(u)) if (best + w < (d.get(v) ?? Infinity)) { d.set(v, best + w); prev.set(v, u); }
  }
  const ids = [to];
  while (ids[0] !== from) ids.unshift(prev.get(ids[0]));
  return simplify(ids.map((id) => pos.get(id)), TOL.road, (i) => isJunction(ids[i])).map(rp);
}

const nearest = (list, p) => list.reduce((b, x) => (dist(x.p, p) < dist(b.p, p) ? x : b));
const courtCenter = centroid(COURT);
const teknoparkCenter = centroid(ring(teknoparkWay.refs));
const A = nearest(gates, project(gateA));
const B = nearest(gates, project(gateB));
const T = nearest(gates, teknoparkCenter);
const hub = nearest([...adj.keys()].map((id) => ({ id, p: pos.get(id) })), courtCenter).id;

const PLACES = {
  ortabahce: rp(courtCenter),
  aKapi: rp(A.p),
  bKapi: rp(B.p),
  teknopark: rp(teknoparkCenter),
};
const ROUTES = {
  aKapi: route(A.id, hub),
  bKapi: route(B.id, hub),
  teknopark: route(T.id, hub),
};

/* ---- Cevre: kampus disindaki sokaklar (oyun haritasinin arka plani) ---- */
const OUTER_CLASS = {
  major: new Set(["motorway", "trunk", "primary", "secondary", "motorway_link", "trunk_link", "primary_link", "secondary_link"]),
  minor: new Set(["tertiary", "tertiary_link", "unclassified", "residential", "living_street", "pedestrian"]),
};
const outerClass = (t) => {
  if (t.area === "yes" || t.tunnel === "yes" || +t.layer < 0) return null;
  for (const k in OUTER_CLASS) if (OUTER_CLASS[k].has(t.highway)) return k;
  return null;
};

const MARGIN = 800 * UNITS_PER_METRE;
const bx = BOUNDARY.map((p) => p[0]), by = BOUNDARY.map((p) => p[1]);
const [fx0, fy0, fx1, fy1] = [Math.min(...bx) - MARGIN, Math.min(...by) - MARGIN, Math.max(...bx) + MARGIN, Math.max(...by) + MARGIN];
const FRAME = [[fx0, fy0], [fx1, fy0], [fx1, fy1], [fx0, fy1]];

/* Kampusten uzaklastikca sonuklesen uc kusak (300 m, 550 m, otesi). Tek renk
   cizilseydi verinin bittigi cerceve haritada keskin bir kenar olarak gorunurdu.
   En dis kusakta yalniz ana caddeler kalir: hem kenar daha da yumusar hem
   verinin yarisindan fazlasini tutan ara sokaklar dosyaya girmez. */
const BAND_LIMITS = [300, 550].map((m) => m * UNITS_PER_METRE);
const FAR = 2;
const bandOf = (p) => {
  const d = edgeDist(p, BOUNDARY);
  return d < BAND_LIMITS[0] ? 0 : d < BAND_LIMITS[1] ? 1 : 2;
};

/* Soluk arka plan icin 1 birim (~1.8 m) hassasiyet yeterli; dosyayi kucuk tutar. */
const ri = (p) => [Math.round(p[0]), Math.round(p[1])];

const SURROUNDINGS = { major: [[], [], []], minor: [[], [], []] };
for (const [, w] of ways) {
  const cls = w.tags.highway && outerClass(w.tags);
  if (!cls) continue;
  const line = w.refs.filter((r) => nodes.has(r)).map((r) => ({ id: r, p: project(nodes.get(r)) }));
  if (line.length < 2) continue;
  for (const outside of clip(line, BOUNDARY, false)) {
    for (const run of clip(outside, FRAME, true)) {
      const pts = simplify(run.map((v) => v.p), TOL.outer);
      let band = -1, chain = null;
      for (let i = 0; i + 1 < pts.length; i++) {
        const b = bandOf([(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]);
        if (b === FAR && cls === "minor") {
          band = -1;
          continue;
        }
        if (b !== band) {
          chain = [ri(pts[i])];
          SURROUNDINGS[cls][b].push(chain);
          band = b;
        }
        const p = ri(pts[i + 1]);
        const last = chain[chain.length - 1];
        if (p[0] !== last[0] || p[1] !== last[1]) chain.push(p);
      }
    }
  }
}
/* Duz dizi [x0, y0, x1, y1, ...]: ic ice ciftlere gore ~%20 daha kisa. */
for (const cls in SURROUNDINGS) {
  SURROUNDINGS[cls] = SURROUNDINGS[cls].map((band) => band.filter((c) => c.length > 1).map((c) => c.flat()));
}

const fmt = (v) => JSON.stringify(v);
const list = (arr) => "[\n" + arr.map((x) => "  " + fmt(x)).join(",\n") + "\n]";
const count = (a) => a.reduce((s, c) => s + c.length, 0);

const src = `/* scripts/build-campus-map.mjs ile uretildi; elle duzenlemeyin.
   Kaynak: OpenStreetMap katkicilari (ODbL), ${new Date().toISOString().slice(0, 10)}.
   ${VIEW.width}x${VIEW.height} SVG birimi, kuzey yukari, ${UNITS_PER_METRE} birim/metre.
   Kapali zincirlerin ilk ve son noktasi aynidir. */

export const VIEWBOX = ${fmt(VIEW)};

/** Birimden enlem/boylama: lat = lat0 - (y - cy) / ky, lng = lon0 + (x - cx) / kx. */
export const PROJECTION = ${fmt({ lat0, lon0, kx, ky, cx: VIEW.width / 2, cy: VIEW.height / 2 })};

/** aKapi ve bKapi, yolun kampus sinirini kestigi noktalardir. */
export const PLACES = ${fmt(PLACES)};

export const BOUNDARY = ${fmt(simplifyRing(BOUNDARY, TOL.shape).map(rp))};

/** Davutpasa Kislasi: kuzeybatisi acik, C bicimli bina. */
export const KISLA = ${fmt(simplifyRing(ring(kislaWay.refs), TOL.shape).map(rp))};

/** Her bina [dis, ...avlular] halkalarindan olusur. */
export const BUILDINGS = ${list(BUILDINGS)};

export const ROADS = ${list(ROADS)};

export const SERVICE_ROADS = ${list(SERVICE_ROADS)};

export const PATHS = ${list(PATHS)};

/** Ortabahce avlusunun icindeki yuruyus yollari. */
export const COURT_PATHS = ${list(COURT_PATHS)};

/** Kapilardan Ortabahce'ye en kisa rotalar. */
export const ROUTES = {
${Object.entries(ROUTES).map(([k, v]) => "  " + k + ": " + fmt(v)).join(",\n")}
};
`;
fs.writeFileSync(OUT, src);

/* Sira = yerlesim onceligi: cakisan etiketlerden once gelen kalir (bkz. CampusLayers). */
LABELS.sort((a, b) => a[3] - b[3] || b[4] - a[4]);
LABELS.forEach((l) => l.pop());

const details = `/* scripts/build-campus-map.mjs ile uretildi; elle duzenlemeyin.
   Kaynak: OpenStreetMap katkicilari (ODbL). Koordinatlar campusMapData.js ile ayni.
   Yalnizca oyun ici harita kullanir. */

/** Her alan [dis, ...delikler] halkalarindan olusur. */
export const AREAS = {
${Object.entries(AREAS).map(([k, v]) => "  " + k + ": " + list(v).replace(/\n/g, "\n  ")).join(",\n")}
};

/** [ad, x, y, kademe]; kademe buyudukce daha yakin zoom ister. Sira oncelik sirasidir. */
export const LABELS = ${list(LABELS)};

/** Kampus disindaki sokaklar; her sinif [yakin, orta, uzak] kusaklarina ayrik,
    her zincir duz [x0, y0, x1, y1, ...] dizisi. Uzak kusakta yalniz ana caddeler var. */
export const SURROUNDINGS = {
${Object.entries(SURROUNDINGS).map(([k, bands]) => "  " + k + ": [\n" +
  bands.map((band) => "    " + list(band).replace(/\n/g, "\n    ")).join(",\n") + "\n  ]").join(",\n")}
};
`;
fs.writeFileSync(OUT_DETAILS, details);

console.log(path.relative(ROOT, OUT), (src.length / 1024).toFixed(1) + "KB |",
  path.relative(ROOT, OUT_DETAILS), (details.length / 1024).toFixed(1) + "KB");
console.log("alan", Object.fromEntries(Object.entries(AREAS).map(([k, v]) => [k, v.length])), "| etiket", LABELS.length,
  "| cevre noktasi", Object.values(SURROUNDINGS).flat(2).reduce((s, c) => s + c.length / 2, 0));
console.log("yollar", count(ROADS), "| servis", count(SERVICE_ROADS), "| patika", count(PATHS),
  "| avlu", count(COURT_PATHS), "| bina", BUILDINGS.length, "| nokta",
  count(ROADS) + count(SERVICE_ROADS) + count(PATHS) + count(COURT_PATHS) + BUILDINGS.reduce((s, b) => s + count(b), 0));
