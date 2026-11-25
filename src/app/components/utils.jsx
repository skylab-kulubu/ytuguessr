"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";

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
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/25"></div>
            <div className="mx-3 flex space-x-1">
              <div className="w-1 h-1 rounded-full bg-white/50"></div>
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
              <div className="w-1 h-1 rounded-full bg-white/50"></div>
            </div>
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/25"></div>
          </motion.div>
    );
}

{/* ---- Görünüme Girince Beliren Blok (lider tablosu ve özet sayfaları) ---- */}
export function Reveal({ children, delay = 0, y = 20, className = "" }) {
    const reduce = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}