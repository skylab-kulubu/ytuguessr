"use client";

import { motion } from "framer-motion";
import { Seperator } from "./utils";
import CampusMap from "./CampusMap";
import StartGame from "./StartGame";
import Stats from "./Stats";
import Podium from "./Podium";
import { ORTABAHCE } from "@/lib/campusMap";

export default function Hero() {

  return (
    <div className="relative w-full overflow-hidden bg-canvas text-white">

      <section className="relative min-h-[100dvh] flex items-center">

        {/* ---- Kampüs Haritası: masaüstünde ekranın sağ yarısı, mobilde metnin arkası ---- */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 lg:left-1/2"
        >
          {/* fit="slice" kapsayiciyi tamamen kaplar; sag yarim ~1:1 oldugu icin
              haritanin neredeyse tamami gorunur, kenarlardan az kirpilir. Dar
              ekranda yanlar kirpildigi icin kenardaki etiketler yarim kaliyor;
              orada etiketler gizli. */}
          <CampusMap
            fit="slice"
            marker={ORTABAHCE}
            className="absolute inset-0 h-full w-full max-lg:[&_text]:hidden"
          />

          {/* Mobilde metin haritanin ustunde durdugu icin her yeri karart. */}
          <div className="absolute inset-0 bg-canvas/45 lg:hidden" />
          {/* Masaustunde sadece sol kenari zemine bagla. */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-canvas via-transparent to-transparent lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-canvas" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-lg lg:text-left">
            <motion.h1 className="text-4xl md:text-6xl font-extrabold italic tracking-tight"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
            >
              YILDIZI KEŞFET!
            </motion.h1>

            <motion.p className="mt-3 text-muted font-medium"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            >
              Orta bahçeden kulüp odalarına, kampüsün her köşesinde yeni bir macera seni bekliyor.
            </motion.p>

            <motion.div className="mt-6 h-[2px] w-24 mx-auto rounded-full bg-white/20 lg:mx-0"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
            />

            <motion.div className="mt-8 w-full mx-auto max-w-md lg:mx-0"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              <StartGame />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center">

        <div className="w-full flex flex-col items-center justify-center min-h-[80vh] py-12">
          <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight px-4"
            initial={{ y: 18, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
            viewport={{ once: true }}
          >
            PARLAYAN YILDIZLAR
          </motion.h2>
          <motion.p className="mt-2 mb-6 text-muted font-medium max-w-md mx-auto"
            initial={{ y: 18, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            viewport={{ once: true }}
          >
            En yüksek skorlara sahip 3 oyuncu
          </motion.p>

          <Seperator />

          <Podium />

        </div>

        <Stats />
      </div>
    </div>
  );
}
