/* Etkinlik lider tablolari: backend GET /game/events ve /game/leaderboard?event=<slug>.
   Durum istemcide saatten hesaplanir; sayfa gece yarisini acik gecirse de dogru kalir. */

const TZ = "Europe/Istanbul";
const DAY = 24 * 60 * 60 * 1000;
/** Bitmis ya da yaklasan etkinlik bu kadar gun sekme olarak gorunur. */
const SHOW_DAYS = 7;

export const GENERAL = "genel";

export const STATUS_LABEL = {
  upcoming: "Başlamadı",
  active: "Sürüyor",
  ended: "Bitti",
};

export function eventStatus(event, now = Date.now()) {
  if (now < Date.parse(event.starts_at)) return "upcoming";
  if (now >= Date.parse(event.ends_at)) return "ended";
  return "active";
}

/** Lider tablosunda sekme olarak gosterilecek etkinlikler: suren, yaklasan ve yeni biten. */
export function boardEvents(events, now = Date.now()) {
  return (events ?? [])
    .filter(
      (e) =>
        Date.parse(e.starts_at) - now < SHOW_DAYS * DAY &&
        now - Date.parse(e.ends_at) < SHOW_DAYS * DAY
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

/** One cikacak etkinlik: suren varsa o, yoksa en yakin yaklasan. */
export function featuredEvent(events, now = Date.now()) {
  const list = boardEvents(events, now);
  return (
    list.find((e) => eventStatus(e, now) === "active") ??
    list.find((e) => eventStatus(e, now) === "upcoming") ??
    null
  );
}

function parts(ms) {
  const out = {};
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date(ms))
    .forEach((p) => (out[p.type] = p.value));
  return out;
}

/** "27 Kasım", "26–29 Kasım" ya da "27 Kasım 11:00–16:30" (Türkiye saati). */
export function formatEventWindow(event) {
  const start = Date.parse(event.starts_at);
  const end = Date.parse(event.ends_at);
  const s = parts(start);
  const e = parts(end);
  const midnight = (p) => p.hour === "00" && p.minute === "00";

  if (midnight(s) && midnight(e)) {
    const last = parts(end - 1);
    if (last.day === s.day && last.month === s.month) return `${s.day} ${s.month}`;
    if (last.month === s.month) return `${s.day}–${last.day} ${s.month}`;
    return `${s.day} ${s.month} – ${last.day} ${last.month}`;
  }
  if (e.day === s.day && e.month === s.month) {
    return `${s.day} ${s.month} ${s.hour}:${s.minute}–${e.hour}:${e.minute}`;
  }
  return `${s.day} ${s.month} ${s.hour}:${s.minute} – ${e.day} ${e.month} ${e.hour}:${e.minute}`;
}

/** "27 Kasım 00:00" (Türkiye saati). */
export function formatEventStart(event) {
  const s = parts(Date.parse(event.starts_at));
  return `${s.day} ${s.month} ${s.hour}:${s.minute}`;
}
