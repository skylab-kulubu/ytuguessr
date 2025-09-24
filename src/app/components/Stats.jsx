"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Play, MapPin, Users } from "lucide-react";
import { CountUp } from "./utils";
import { useStats } from "../../lib/hooks/useStats";

export default function Stats() {
    const [hasEntered, setHasEntered] = useState(false);

    const { data } = useStats();

    const stats = [
        { icon: Users, value: data?.unique_users || 0, label: "FARKLI OYUNCU" },
        { icon: MapPin, value: data?.total_locations || 0, label: "KEŞFEDİLEBİLECEK KONUM" },
        { icon: Play, value: data?.total_games || 0, label: "OYNANAN OYUN" }
    ];

    return (
        <motion.div className="w-full max-w-4xl mx-auto px-4 py-8"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            onViewportEnter={() => setHasEntered(true)}
        >
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
                {stats.map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                        <motion.div key={i} className="rounded-2xl p-4 md:p-6 bg-white/5 backdrop-blur border border-violet-500/20 shadow-lg flex flex-col items-center text-center space-y-2 md:space-y-3"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: i * 0.3 }}
                            viewport={{ once: true }}
                        >
                            <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-violet-400" />
                            <div className="text-xl md:text-3xl font-bold text-white">
                                <CountUp number={stat.value} active={hasEntered} />
                            </div>
                            <div className="text-white/80 text-[10px] md:text-xs font-semibold tracking-wide">
                                {stat.label}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}