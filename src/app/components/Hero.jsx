"use client";

import { motion } from "framer-motion";
import { Seperator } from "./utils";
import Lottie from "lottie-react";
import Background from "../../../public/lottie/background.json";
import StartGame from "./StartGame";
import Stats from "./Stats";
import Podium from "./Podium";

export default function Hero() {

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1B1740] text-white flex items-center justify-center">

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center">

        <div className="relative h-[90vh] overflow-hidden">
          <Lottie animationData={Background}
            loop
            autoplay
            rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ width: "100%", height: "100%" }}
          />

          <div className="flex flex-col justify-center px-4 h-[90vh]">
            <motion.h1 className="text-4xl md:text-6xl font-extrabold italic tracking-tight"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
            >
              YILDIZI KEŞFET!
            </motion.h1>

            <motion.p className="mt-3 max-w-xl text-gray-300 font-medium"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            >
              Orta bahçeden kulüp odalarına, kampüsün her köşesinde yeni bir macera seni bekliyor.
            </motion.p>

            <motion.div className="mt-6 h-[2px] w-24 mx-auto rounded-full bg-white/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
            />

            <motion.div className="mt-8 w-full mx-auto max-w-md"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              <StartGame />
            </motion.div>
          </div>
        </div>

        <div className="w-full -mt-1 h-20 bg-gradient-to-b from-[#897fa6] via-[#897fa6] to-[#1B1740]" />

        <div className="w-full flex flex-col items-center justify-center min-h-[80vh] py-12">
          <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight px-4"
            initial={{ y: 18, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
            viewport={{ once: true }}
          >
            PARLAYAN YILDIZLAR
          </motion.h2>
          <motion.p className="mt-2 mb-6 text-gray-300 font-medium max-w-md mx-auto"
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