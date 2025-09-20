"use client";

import React, { useEffect } from "react";
import { useSummary } from "../../lib/hooks/useSummary";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import LoadingScreen from "../components/LoadingScreen";

export default function SummaryPage() {
  const router = useRouter();
  const { isLoading, error, formatted } = useSummary();

  useEffect(() => {
    if (error) {
      if (error.response?.status === 400) {
        router.push("/");
        return;
      }
    }
  }, [error, router]);

  if (isLoading) return <LoadingScreen />;
  
  if (error && error.response?.status === 400) {
    return <LoadingScreen />;
  }
  
  if (error) return (
    <div className="min-h-screen bg-[#1B1740] text-white">
      <Header />
      <div className="p-6 max-w-4xl mx-auto pt-24">
        <motion.p 
          className="text-center text-red-400 text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Hata: {error.message}
        </motion.p>
      </div>
    </div>
  );

  if (!formatted) {
    return <LoadingScreen />;
  }

  const { summary, guesses } = formatted;

  return (
    <div className="min-h-screen bg-[#1B1740] text-white">
      <Header />
      <div className="p-6 max-w-4xl mx-auto space-y-6 pt-24">
        
        {/* Header Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4 italic text-shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          >
            OYUN ÖZETİ
          </motion.h1>
          <motion.p
            className="text-gray-300 font-semibold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Toplam Puan: <span className="text-yellow-400">{summary.totalScore}</span> — Süre: <span className="text-yellow-400">{summary.totalTime}</span>
          </motion.p>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            height: { duration: 0.6 },
            opacity: { duration: 0.4, delay: 0.2 }
          }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <motion.thead
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <tr className="border-b border-gray-600">
                  <th className="w-1/3 px-6 py-4 text-center font-bold text-yellow-400">Toplam Mesafe</th>
                  <th className="w-1/3 px-6 py-4 text-center font-bold text-yellow-400">Toplam Süre</th>
                  <th className="w-1/3 px-6 py-4 text-center font-bold text-yellow-400">Toplam Puan</th>
                </tr>
              </motion.thead>
              <motion.tbody
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
              >
                <motion.tr
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3, ease: "easeOut" }}
                  className="border-b border-gray-700/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                >
                  <td className="px-6 py-4 text-center text-white font-semibold">{summary.totalDistance}</td>
                  <td className="px-6 py-4 text-center text-white font-semibold">{summary.totalTime}</td>
                  <td className="px-6 py-4 text-center text-yellow-400 font-bold text-lg">{summary.totalScore}</td>
                </motion.tr>
              </motion.tbody>
            </table>
          </div>
        </motion.div>

        {/* Tur Detayları */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            height: { duration: 0.6 },
            opacity: { duration: 0.4, delay: 0.6 }
          }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl"
        >
          <motion.div
            className="px-6 py-4 border-b border-gray-600"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-yellow-400 italic">Tur Detayları</h2>
          </motion.div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <motion.thead
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <tr className="border-b border-gray-600">
                  <th className="w-1/12 px-6 py-4 text-left font-bold text-yellow-400">#</th>
                  <th className="w-4/12 px-6 py-4 text-left font-bold text-yellow-400">Mesafe</th>
                  <th className="w-4/12 px-6 py-4 text-left font-bold text-yellow-400">Süre</th>
                  <th className="w-3/12 px-6 py-4 text-right font-bold text-yellow-400">Puan</th>
                </tr>
              </motion.thead>
              <AnimatePresence mode="wait">
                <motion.tbody
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 0.9 }}
                >
                  {guesses.map((g, index) => (
                    <motion.tr
                      key={index}
                      initial={{ height: 0, opacity: 0, y: 20}}
                      animate={{ height: "auto", opacity: 1, y: 0}}
                      transition={{ delay: 1.0 + (index * 0.1), duration: 0.3, ease: "easeOut"}}
                      className="border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <motion.div
                          className="flex items-center"
                          initial={{ x: -30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.1 + (index * 0.1), duration: 0.3, ease: "easeOut"}}
                        >
                          <span className="font-semibold text-gray-300">{index + 1}</span>
                        </motion.div>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          className="text-white font-medium"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.15 + (index * 0.1), duration: 0.3, ease: "easeOut"}}
                        >
                          {g.distance}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          className="text-white font-medium"
                          initial={{ x: -30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.2 + (index * 0.1), duration: 0.3, ease: "easeOut"}}
                        >
                          {g.time}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <motion.span
                          className="font-bold text-lg text-yellow-400"
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.25 + (index * 0.1), duration: 0.3, ease: "easeOut" }}
                        >
                          {g.score}
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </AnimatePresence>
            </table>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex justify-center space-x-4 pt-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
        >
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-indigo-600/80 text-white font-semibold rounded-xl shadow-lg">
            Yeniden Oyna
          </button>
          <button
            onClick={() => router.push("/leaderboard")}
            className="px-6 py-3 bg-yellow-500/80 text-white font-semibold rounded-xl shadow-lg transform">
            Lider Tablosu
          </button>
        </motion.div>
      </div>
    </div>
  );
}
