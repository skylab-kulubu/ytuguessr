"use client";

import { useLeaderboard } from "../../lib/hooks/useLeaderboard";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CountUp } from "./utils";
import { formatNameForPodium } from "../../lib/utils";
import { ArrowRight } from "lucide-react";

export default function Podium() {
    let { topThree } = useLeaderboard(1);
    const [hasEntered, setHasEntered] = useState(false);
    const pathname = usePathname();

    const isHome = pathname === '/';

    if (!topThree || topThree.length < 3) {
        topThree = [{ name: "-", score: 0 }, { name: "-", score: 0 }, { name: "-", score: 0 }];
    }

    return (
        <motion.div className={`w-full max-w-md mx-auto pt-12 ${isHome ? "p-6" : ""}`}
            viewport={{ once: true, amount: 0.3 }}
            onViewportEnter={() => setHasEntered(true)}
        >
            <div className="grid grid-cols-16 items-end w-full h-60">
                {/* 2 */}
                <motion.div className="relative flex-1 col-span-5"
                    initial={{ y: 200, opacity: 0 }}
                    animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                    transition={{ duration: 1.2, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <motion.div className="absolute -top-12 left-2 right-0 text-center -z-10"
                        initial={{ y: -20, opacity: 0 }}
                        animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                        transition={{ duration: 0.6, delay: 1.4 }}
                    >
                        <span className="inline-block max-w-[130px] truncate text-sm font-medium text-[#d0d1d8] bg-[#d0d1d8]/20 px-2 py-1 rounded border border-[#d0d1d8]/30">
                            {formatNameForPodium(topThree[1]?.name)}
                        </span>
                    </motion.div>
                    <motion.div className={`absolute -top-3 left-0 right-0 h-3 bg-gradient-to-br ${isHome ? "from-[#3b327f] to-[#504696]" : "from-[#565187] to-[#696696]"}`}
                        style={{ clipPath: "polygon(10% 0%, 110% 0%, 100% 100%, 0% 100%)", originY: 1 }}
                        initial={{ scaleY: 0 }}
                        animate={hasEntered ? { scaleY: 1 } : undefined}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    />
                    <motion.div className={`h-36 bg-gradient-to-b shadow-lg ${isHome ? "from-[#2f2868] to-[#1f1a47]" : "from-[#36315c] to-[#262249]"}`}
                        initial={{ scaleY: 0 }}
                        animate={hasEntered ? { scaleY: 1 } : undefined}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        style={{ originY: 1 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span className="text-5xl font-bold mb-6 text-white/20"
                            initial={{ scale: 0 }}
                            animate={hasEntered ? { scale: 1 } : undefined}
                            transition={{ duration: 0.5, delay: 1.2 }}
                        >
                            2
                        </motion.span>
                        <motion.span className="absolute bottom-2 font-semibold text-white/70"
                            initial={{ y: 20, opacity: 0 }}
                            animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                            transition={{ duration: 0.5, delay: 1.6 }}
                        >
                            <CountUp number={topThree[1]?.score || 0} active={hasEntered} />
                        </motion.span>
                    </div>
                </motion.div>

                {/* 1 */}
                <motion.div className="relative flex-1 col-span-6"
                    initial={{ y: 250, opacity: 0 }}
                    animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                    transition={{ duration: 1.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <motion.div className="absolute -top-12 -left-1 right-0 text-center"
                        initial={{ y: -20, opacity: 0 }}
                        animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                        transition={{ duration: 0.6, delay: 1.2 }}
                    >
                        <span className="inline-block max-w-[180px] truncate text-sm font-medium text-[#ebb912] bg-[#ebb912]/20 px-2 py-1 rounded border border-[#ebb912]/30">
                            {formatNameForPodium(topThree[0]?.name)}
                        </span>
                    </motion.div>
                    <motion.div className={`absolute -top-3 left-0 right-0 h-3 bg-gradient-to-b ${isHome ? "from-[#4e4497] to-[#5d53a9]" : "from-[#696696] to-[#7d7aab]"}`}
                        style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)", originY: 1 }}
                        initial={{ scaleY: 0 }}
                        animate={hasEntered ? { scaleY: 1 } : undefined}
                        transition={{ duration: 1.0, delay: 0.4 }}
                    />
                    <motion.div className={`h-48 bg-gradient-to-b shadow-xl ${isHome ? "from-[#3a327a] to-[#1f1a47]" : "from-[#4d467a] to-[#262249] border-[#3F3A69]/80"}`}
                        initial={{ scaleY: 0 }}
                        animate={hasEntered ? { scaleY: 1 } : undefined}
                        transition={{ duration: 1.0, delay: 0.4 }}
                        style={{ originY: 1 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span className="text-6xl font-bold mb-6 text-white/20"
                            initial={{ scale: 0 }}
                            animate={hasEntered ? { scale: 1 } : undefined}
                            transition={{ duration: 0.6, delay: 1.0 }}
                        >
                            1
                        </motion.span>
                        <motion.span className="absolute bottom-2 text-lg font-semibold text-white/70"
                            initial={{ y: 20, opacity: 0 }}
                            animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                            transition={{ duration: 0.5, delay: 1.4 }}
                        >
                            <CountUp number={topThree[0]?.score || 0} active={hasEntered} />
                        </motion.span>
                    </div>
                </motion.div>

                {/* 3 */}
                <motion.div className="relative flex-1 col-span-5"
                    initial={{ y: 150, opacity: 0 }}
                    animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                    transition={{ duration: 1.0, delay: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <motion.div className="absolute -top-12 -left-2 right-0 text-center -z-10"
                        initial={{ y: -20, opacity: 0 }}
                        animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                        transition={{ duration: 0.6, delay: 1.8 }}
                    >
                        <span className="inline-block max-w-[130px] truncate text-sm font-medium text-[#e8882e] bg-[#e8882e]/20 px-2 py-1 rounded border border-[#e8882e]/30">
                            {formatNameForPodium(topThree[2]?.name)}
                        </span>
                    </motion.div>
                    <motion.div className={`absolute -top-3 left-0 right-0 h-3 bg-gradient-to-bl ${isHome ? "from-[#3b327f] to-[#504696]" : "from-[#565187] to-[#696696]"}`}
                        style={{ clipPath: "polygon(0% 0%, 90% 0%, 100% 100%, 0% 100%)", originY: 1 }}
                        initial={{ scaleY: 0 }}
                        animate={hasEntered ? { scaleY: 1 } : undefined}
                        transition={{ duration: 0.6, delay: 1.2 }}
                    />
                    <motion.div className={`h-28 bg-gradient-to-b shadow-lg ${isHome ? "from-[#2f2868] to-[#1f1a47]" : "from-[#36315c] to-[#262249]"}`}
                        initial={{ scaleY: 0 }}
                        animate={hasEntered ? { scaleY: 1 } : undefined}
                        transition={{ duration: 0.6, delay: 1.2 }}
                        style={{ originY: 1 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span className="text-5xl font-bold mb-6 text-white/20"
                            initial={{ scale: 0 }}
                            animate={hasEntered ? { scale: 1 } : undefined}
                            transition={{ duration: 0.5, delay: 1.6 }}
                        >
                            3
                        </motion.span>
                        <motion.span className="absolute bottom-2 text-sm font-semibold text-white/70"
                            initial={{ y: 20, opacity: 0 }}
                            animate={hasEntered ? { y: 0, opacity: 1 } : undefined}
                            transition={{ duration: 0.5, delay: 2.0 }}
                        >
                            <CountUp number={topThree[2]?.score || 0} active={hasEntered} />
                        </motion.span>
                    </div>
                </motion.div>
            </div>

            {isHome && (
                <motion.div className="mt-8 w-full mx-auto max-w-md"
                    initial={{ opacity: 0 }}
                    animate={hasEntered ? { opacity: 1 } : undefined}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 4.0 }}
                >
                    <a href="/leaderboard" className="mx-8 rounded-2xl p-3 bg-white/5 backdrop-blur border border-violet-500/20 shadow-lg flex items-center justify-center gap-3 text-white font-semibold hover:bg-white/10 transition-all duration-200 group">
                        Lider Tablosunu İncele
                        <ArrowRight className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                    </a>
                </motion.div>
            )}
        </motion.div>
    );
}