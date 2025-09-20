"use client";

import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function MapOpenButton({ onClick, title = "Haritayı Aç" }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={title}
            className="fixed bottom-6 right-6 z-10 flex items-center justify-center"
        >
                <span className="relative z-10 flex h-18 w-18 items-center justify-center rounded-full overflow-hidden backdrop-blur-xl
                   bg-violet-400/30 border border-purple-300/20 group-hover:shadow-purple-400/40"
                >
                    <MapPin className="h-6 w-6 text-white/90 drop-shadow-lg" strokeWidth={2.5} />
                </span>
        </motion.button>
    );
}