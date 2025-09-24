"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLeaderboard } from "../../lib/hooks/useLeaderboard";
import { motion } from "framer-motion";
import { Seperator } from "../components/utils";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import Pagination from "./components/Pagination";
import Leaderboard from "./components/Leaderboard";
import Podium from "../components/Podium";

export default function LeaderboardPage() {
    const router = useRouter();
    const params = useSearchParams();
    const page = parseInt(params.get("page") || "1", 10);

    const { isLoading, error, formatted } = useLeaderboard(page);

    if (isLoading) return <LoadingScreen />;
    if (error) return (
        <div className="min-h-screen bg-[#1B1740] text-white">
            <Header />
            <div className="p-6 max-w-4xl mx-auto pt-24">
                <p className="text-center text-red-400 text-md">
                    Hata: {error.message}
                </p>
            </div>
        </div>
    );

    const { page: current, totalPages, totalUsers, userRank, entries } = formatted;

    const goTo = (p) => router.push(`/leaderboard?page=${p}`);

    return (
        <div className="min-h-screen text-white">

            <Header />
            
            <div className="p-6 max-w-4xl mx-auto space-y-6 pt-24 min-h-screen">
                <motion.div className="text-center mb-8"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h1 className="text-4xl md:text-5xl mb-2 font-bold tracking-tight text-shadow-lg">
                        LİDER TABLOSU
                    </h1>
                    <motion.p className="text-gray-300 font-semibold"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {userRank ? <><span>Şu anda</span> <span className="text-violet-400">{userRank}.</span> <span>sıradasınız.</span></>
                            : <span>Henüz bir sıralamanız yok.</span>}
                    </motion.p>
                </motion.div>

                <Seperator />

                {current === 1 ? (
                    <div className="-mt-6">
                        <Podium />
                        {entries.length > 3 && (
                            <motion.div className="mt-2 z-50"
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                            >
                                <Leaderboard entries={entries.slice(3)} current={current} />
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <Leaderboard entries={entries} current={current} />
                )}
            </div>

            <Pagination current={current} totalPages={totalPages} totalUsers={totalUsers} onPageChange={goTo} entriesLength={entries.length} />

            <Footer />
        </div>
    );
}