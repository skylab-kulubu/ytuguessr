"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { memo, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useSwipeable } from "react-swipeable";
import CampusLayers, { guessPin, mapOptions } from "./map/CampusLayers";
import ZoomControl from "./map/ZoomControl";
import { CAMPUS_BOUNDS, isOnCampus } from "./map/campus";
import MapOpenButton from "./hud/MapOpenButton";
import { ChevronDown, Close, Collapse, Expand, Pin } from "./Glyph";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";

const FIT = { padding: [14, 14] };

const coord = (v, pos, neg) => `${Math.abs(v).toFixed(5)}° ${v >= 0 ? pos : neg}`;
const formatCoords = ([lat, lng]) => `${coord(lat, "K", "G")}   ${coord(lng, "D", "B")}`;
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function ClickCapture({ onPick }) {
  useMapEvents({
    click: ({ latlng: { lat, lng } }) => {
      if (isOnCampus(lat, lng)) onPick(lat, lng);
    },
  });
  return null;
}

/**
 * Mobil panel tam ekrana gecerken kapsayici CSS gecisiyle buyur. Leaflet'e
 * her karede yeni boyutu bildirir; icerik ortada kalir, gecis sonunda ziplamaz.
 */
function SizeSync() {
  const map = useMap();

  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: true }));
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);

  return null;
}

/* Tum kampusu sigdiran gorunumde binalar cok kucuk kaliyordu; harita bunun
   bir kademe yakinindan acilir. Okumada 1.0x hala tum kampus oldugu icin
   "Tum kampus" dugmesi bastan gorunur. */
const START_ZOOM = 0.75;

function StartZoom() {
  const map = useMap();

  useEffect(() => {
    /* Mutlak hedef: StrictMode efekti iki kez calistirsa da ayni zoom'a gider. */
    const fit = map.getBoundsZoom(CAMPUS_BOUNDS, false, L.point(FIT.padding[0] * 2, FIT.padding[1] * 2));
    map.setView(L.latLngBounds(CAMPUS_BOUNDS).getCenter(), fit + START_ZOOM, { animate: false });
  }, [map]);

  return null;
}

/* memo: hover ve her saniyelik sure guncellemesi haritaya inmesin. */
const GuessCanvas = memo(function GuessCanvas({ marker, onPick, resizable = false }) {
  const [options] = useState(mapOptions);

  return (
    <MapContainer bounds={CAMPUS_BOUNDS} boundsOptions={FIT} {...options} className="h-full w-full">
      <CampusLayers />
      <ClickCapture onPick={onPick} />
      <ZoomControl bounds={CAMPUS_BOUNDS} padding={FIT.padding} />
      <StartZoom />
      {resizable && <SizeSync />}
      {/* key: her yeni isarette pin animasyonu bastan oynasin */}
      {marker && <Marker key={marker.join()} position={marker} icon={guessPin} keyboard={false} />}
    </MapContainer>
  );
});

function ConfirmButton({ marker, status, onConfirm, className = "" }) {
  const pending = status === "pending";
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={!marker || pending}
      className={`btn btn-primary shrink-0 gap-3 rounded-[8px] ${className}`}
    >
      {pending ? "Gönderiliyor" : "Tahmin et"}
      <kbd className="kbd kbd--on-accent max-lg:hidden">Boşluk</kbd>
    </button>
  );
}

function Readout({ marker, status, className = "" }) {
  const error = status === "error";
  const tone = error ? "text-danger" : marker ? "text-muted" : "text-faint";
  return (
    <p aria-live="polite" className={`tnum min-w-0 truncate text-xs ${tone} ${className}`}>
      {error ? "Gönderilemedi. Tekrar dene." : marker ? formatCoords(marker) : "Haritada bir yere tıkla"}
    </p>
  );
}

function DesktopMap({ marker, onPick, onConfirm, status }) {
  const [hovered, setHovered] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [pinned, setPinned] = useState(false);
  const inside = useRef(false);
  const timer = useRef(0);
  const open = hovered || keyboard || pinned;

  useEffect(() => () => clearTimeout(timer.current), []);

  const enter = () => {
    inside.current = true;
    clearTimeout(timer.current);
    setHovered(true);
  };

  /* Harita ile alt cubuk arasinda gecerken kapanip acilmasin. */
  const collapseSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHovered(false), 160);
  };

  const leave = (e) => {
    inside.current = false;
    /* Leaflet surukleme sirasinda imleci belge uzerinden izler; surukleme
       ortasinda kuculmek imlecin altindaki olcegi degistirip haritayi kacirir. */
    if (e.buttons) {
      const release = () => {
        if (!inside.current) collapseSoon();
      };
      window.addEventListener("pointerup", release, { once: true });
      return;
    }
    collapseSoon();
  };

  const hover = { onPointerEnter: enter, onPointerLeave: leave };
  const state = open ? "" : "is-collapsed";

  return (
    <div
      className="guess-dock pointer-events-none fixed right-6 bottom-6 z-30 hidden flex-col items-end lg:flex"
      onFocusCapture={(e) => setKeyboard(e.target.matches(":focus-visible"))}
      onBlurCapture={() => setKeyboard(false)}
    >
      <div className={`guess-plate pointer-events-auto ${state}`} {...hover}>
        <GuessCanvas marker={marker} onPick={onPick} />
        <button
          type="button"
          onClick={() => setPinned((v) => !v)}
          aria-pressed={pinned}
          aria-label={pinned ? "Sabitlemeyi kaldır" : "Haritayı açık tut"}
          title={pinned ? "Sabitlemeyi kaldır" : "Haritayı açık tut"}
          className="plate-btn absolute top-2.5 right-2.5 z-[1000]"
        >
          <Pin />
        </button>
      </div>

      <div className={`guess-bar pointer-events-auto ${state}`} {...hover}>
        <Readout marker={marker} status={status} />
        <ConfirmButton marker={marker} status={status} onConfirm={onConfirm} className="h-9 px-3.5 text-sm" />
      </div>
    </div>
  );
}

function MobileSheet({ open, onClose, marker, onPick, onConfirm, status, secondsLeft }) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!open) setFull(false);
  }, [open]);

  const swipe = useSwipeable({
    onSwipedDown: ({ deltaY }) => {
      if (deltaY <= 50) return;
      if (full) setFull(false);
      else onClose();
    },
    onSwipedUp: ({ deltaY }) => {
      if (deltaY < -50) setFull(true);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 20,
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false },
  });

  const urgent = secondsLeft > 0 && secondsLeft <= 10;

  return (
    /* Kapaliyken de mount kalir: harita her acilista yeniden kurulmaz,
       kullanicinin zoom'u ve isareti korunur. */
    <section
      aria-label="Tahmin haritası"
      inert={!open}
      className={`guess-sheet lg:hidden ${open ? "is-open" : ""} ${full ? "is-full" : ""}`}
    >
      <div
        {...swipe}
        className="flex shrink-0 touch-none items-center justify-between px-2 pb-1 select-none"
        style={{ paddingTop: full ? "max(0.5rem, env(safe-area-inset-top))" : "0.5rem" }}
      >
        <button
          type="button"
          onClick={() => setFull((v) => !v)}
          aria-label={full ? "Küçült" : "Tam ekran"}
          className="sheet-btn"
        >
          {full ? <Collapse /> : <Expand />}
        </button>

        {/* Tam ekranda ust bilgi cubugu ortunuyor; sure buraya tasinir. */}
        {full ? (
          <span className={`tnum text-sm font-semibold ${urgent ? "text-danger" : "text-ink"}`}>
            {clock(secondsLeft)}
          </span>
        ) : (
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-hair" />
        )}

        <button type="button" onClick={onClose} aria-label="Haritayı kapat" className="sheet-btn">
          {full ? <ChevronDown /> : <Close />}
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <GuessCanvas marker={marker} onPick={onPick} resizable />
      </div>

      <div
        className="flex shrink-0 items-center gap-3 border-t border-hair px-4 pt-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Readout marker={marker} status={status} className="flex-1" />
        <ConfirmButton marker={marker} status={status} onConfirm={onConfirm} className="h-11 px-5 text-[0.9375rem]" />
      </div>
    </section>
  );
}

/** Panel kapaliyken alttaki eylemler; bekleyen bir isaret varsa dogrudan onaylatir. */
function MobileDock({ hidden, marker, status, onOpen, onConfirm }) {
  return (
    <div
      inert={hidden}
      className={`mobile-dock lg:hidden ${hidden ? "is-hidden" : ""}`}
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {status === "error" && (
        <p aria-live="polite" className="mobile-dock__error">
          Gönderilemedi. Tekrar dene.
        </p>
      )}
      <div className="flex items-center gap-2">
        {marker ? (
          <>
            <MapOpenButton compact onClick={onOpen} />
            <ConfirmButton marker={marker} status={status} onConfirm={onConfirm} className="h-12 px-6 text-[0.9375rem]" />
          </>
        ) : (
          <MapOpenButton onClick={onOpen} />
        )}
      </div>
    </div>
  );
}

export default function GuessMap({
  marker,
  onPick,
  onConfirm,
  status,
  showMap,
  onToggleMap,
  secondsLeft,
}) {
  const { matches: isDesktop, mounted } = useIsDesktop();

  // Iki Leaflet ornegini ayni anda kurmamak icin sadece biri mount edilir.
  if (!mounted) return null;

  if (isDesktop) {
    return <DesktopMap marker={marker} onPick={onPick} onConfirm={onConfirm} status={status} />;
  }

  return (
    <>
      <MobileDock
        hidden={showMap}
        marker={marker}
        status={status}
        onOpen={onToggleMap}
        onConfirm={onConfirm}
      />
      <MobileSheet
        open={showMap}
        onClose={onToggleMap}
        marker={marker}
        onPick={onPick}
        onConfirm={onConfirm}
        status={status}
        secondsLeft={secondsLeft}
      />
    </>
  );
}
