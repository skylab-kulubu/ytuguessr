// components/GuessMap.jsx
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Rectangle, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import MapOpenButton from "./hud/MapOpenButton";

const guessMarker = L.icon({
  iconUrl: "/marker-red.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const BOUNDS = [
  [41.032344, 28.883054], // kuzey-batı
  [41.020792, 28.899499], // güney-doğu
];

const FitToBounds = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
};

const ClickCapture = ({ onPick }) => {
  useMapEvents({
    click: ({ latlng }) => {
      const { lat, lng } = latlng;
      const [[nLat, wLng], [sLat, eLng]] = BOUNDS;
      const inside = lat <= nLat && lat >= sLat && lng >= wLng && lng <= eLng;
      if (inside) onPick(lat, lng);
    },
  });
  return null;
};

const OuterMask = () => {
  const world = [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ];
  const [[nLat, wLng], [sLat, eLng]] = BOUNDS;
  const inner = [
    [nLat, wLng],
    [nLat, eLng],
    [sLat, eLng],
    [sLat, wLng],
  ];
  return (
    <Polygon
      positions={[world, inner]}
      pathOptions={{
        fillColor: "black",
        fillOpacity: 0.5,
        stroke: false,
        interactive: false,
      }}
    />
  );
};

/* === Ana bileşen === */
export default function GuessMap({
  onPick,
  marker,
  onToggleMap,
  onConfirm,
  guessSelected,
  showMap,
}) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Harita kapandığında tam ekran state'ini sıfırla
  useEffect(() => {
    if (!showMap) {
      setIsFullScreen(false);
    }
  }, [showMap]);

  const swipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      if (eventData.deltaY > 50) {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onToggleMap();
        }
      }
    },
    onSwipedUp: ({ deltaY, absY }) => {
      if (deltaY < -50 && !isFullScreen) {
        setIsFullScreen(true)
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 20,
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false }
  });
  return (
    <>
      {/* --- Haritayı Aç --- */}
      {!showMap && (
        <MapOpenButton
          onClick={onToggleMap}
          title="Haritayı Aç"
        />
      )}

      {/* --- Tahmini Onayla --- */}
      <AnimatePresence>
        {guessSelected && showMap && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={onConfirm}
            className={`fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-xl bg-green-600/60 border border-green-700 px-6 py-3 font-semibold text-white shadow-lg backdrop-blur-md bottom-8`}
          >
            <Check className="size-5" strokeWidth={3} />
            Tahmini Onayla
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- Map Overlay --- */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{
              y: 0,
              height: isFullScreen ? "100vh" : "45vh",
            }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={`absolute inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-zinc-100 backdrop-blur-lg shadow-2xl ${isFullScreen
              ? 'h-screen rounded-none'
              : 'h-[45vh] rounded-t-3xl'
              }`}
          >
            {/* Swipe Handle */}
            <div
              {...swipeHandlers}
              className={`absolute top-0 left-0 right-0 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing z-40 ${isFullScreen ? 'bg-zinc-100/90 backdrop-blur-sm' : ''
                }`}
            >
              <div className="w-12 h-1 bg-gray-400 rounded-full" />
            </div>

            {/* Map */}
            <MapContainer
              center={[41.026428, 28.889555]}
              zoom={17}
              minZoom={16}
              maxZoom={19}
              maxBounds={BOUNDS}
              maxBoundsViscosity={1}
              doubleClickZoom={false}
              scrollWheelZoom
              className={`relative w-full ${isFullScreen
                ? 'h-[calc(100vh-24px)] mt-6 rounded-none'
                : 'h-[calc(100%-24px)] mt-6 rounded-t-3xl'
                }`}
              key={isFullScreen ? 'fullscreen' : 'normal'}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Rectangle
                bounds={BOUNDS}
                pathOptions={{ color: "#FFD500", weight: 2, fill: false }}
              />
              <OuterMask />
              <FitToBounds />
              <ClickCapture onPick={onPick} />
              {marker && <Marker position={marker} icon={guessMarker} />}
            </MapContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
