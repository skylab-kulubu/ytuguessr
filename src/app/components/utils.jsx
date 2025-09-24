"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

{/* ---- Sayı Artma Animasyonu ---- */}
export function CountUp({ number, active }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        if (!active) {
            count.set(0);
            return;
        }
        const controls = animate(count, number, { duration: 4, ease: [0.1, 1, 0.1, 1] });
        return controls.stop;
    }, [active, number, count]);

    return <motion.span>{rounded}</motion.span>;
}

{/* ---- Ayıraç ---- */}
export function Seperator() {
    return (
        <motion.div className="flex items-center justify-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
            viewport={{ once: true }}
          >
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-violet-400/40"></div>
            <div className="mx-3 flex space-x-1">
              <div className="w-1 h-1 rounded-full bg-violet-400"></div>
              <div className="w-1 h-1 rounded-full bg-violet-300"></div>
              <div className="w-1 h-1 rounded-full bg-violet-400"></div>
            </div>
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-violet-400/40"></div>
          </motion.div>
    );
}