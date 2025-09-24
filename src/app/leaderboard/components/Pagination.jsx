"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Pagination({ current, totalPages, totalUsers, onPageChange, entriesLength = 0 }) {
    const goTo = (page) => {
        onPageChange(page);
    };

    return (
        <>
            <motion.div className="flex justify-center items-center gap-3 pt-6"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + (entriesLength * 0.05), duration: 0.4, ease: "easeOut" }}
            >

                {/* ---- Önceki Butonu ---- */}
                <button onClick={() => goTo(current - 1)}
                    disabled={current <= 1}
                    className={`flex items-center gap-2 p-3 rounded-xl font-semibold backdrop-blur border transition-all duration-200
                    ${current <= 1 
                        ? 'bg-white/5 border-gray-600/30 text-gray-500 cursor-not-allowed opacity-50' 
                        : 'bg-white/5 border-violet-500/20 text-white hover:bg-violet-500/20 hover:border-violet-400/50 shadow-lg'}`}
                >
                    <ArrowLeft size={16} />
                </button>

                {/* ---- Sayfa Numaraları ---- */}
                <div className="flex items-center gap-1 px-2 py-2 rounded-xl bg-white/5 backdrop-blur border border-violet-500/20 shadow-lg">
                    {(() => { const pageNumbers = [];
                        if (totalPages <= 5) { // Hepsini göster
                            for (let i = 1; i <= totalPages; i++) {
                                pageNumbers.push(i);
                            }
                        } else {
                            if (current <= 3) { // Başta ise: 1, 2, 3, 4, ..., son
                                pageNumbers.push(1, 2, 3, 4);
                                if (totalPages > 5) {
                                    pageNumbers.push('ellipsis1');
                                    pageNumbers.push(totalPages);
                                }
                            } else if (current >= totalPages - 2) { // Sonda ise: 1, ..., son-3, son-2, son-1, son
                                pageNumbers.push(1);
                                if (totalPages > 5) {
                                    pageNumbers.push('ellipsis1');
                                }
                                for (let i = totalPages - 3; i <= totalPages; i++) {
                                    if (i > 1) pageNumbers.push(i);
                                }
                            } else { // Ortada ise: 1, ..., sayfa-1, sayfa, sayfa+1, ..., son
                                pageNumbers.push(1);
                                pageNumbers.push('ellipsis1');
                                pageNumbers.push(current - 1, current, current + 1);
                                pageNumbers.push('ellipsis2');
                                pageNumbers.push(totalPages);
                            }
                        }

                        return pageNumbers.map((pageNum) => {
                            if (typeof pageNum === 'string') {
                                return (
                                    <span key={pageNum} className="text-gray-400 px-1 text-sm">
                                        …
                                    </span>
                                );
                            }

                            const isCurrentPage = pageNum === current;
                            
                            return (
                                <motion.button key={pageNum} onClick={() => goTo(pageNum)}
                                    className={`w-8 h-8 rounded-lg font-semibold transition-all duration-200 text-sm
                                    ${isCurrentPage 
                                        ? 'bg-violet-400/20 text-violet-400 border border-violet-400/30' 
                                        : 'bg-transparent hover:bg-violet-500/20 text-white/80 hover:text-white'}`}
                                    initial={isCurrentPage ? { scale: 1.05 } : { scale: 1 }}
                                    animate={isCurrentPage ? { scale: [1.05, 1.1, 1.05] } : { scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {pageNum}
                                </motion.button>
                            );
                        });
                    })()}
                </div>

                {/* ---- Sonraki Butonu ---- */}
                <button onClick={() => goTo(current + 1)}
                    disabled={current >= totalPages}
                    className={`flex items-center gap-2 p-3 rounded-xl font-semibold backdrop-blur border transition-all duration-200
                    ${current >= totalPages 
                        ? 'bg-white/5 border-gray-600/30 text-gray-500 cursor-not-allowed opacity-50' 
                        : 'bg-white/5 border-violet-500/20 text-white hover:bg-violet-500/20 hover:border-violet-400/50 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_40px_-15px_rgba(0,0,0,.6)]'}`}
                >
                    <span className="hidden sm:inline">Sonraki</span>
                    <ArrowRight size={16} />
                </button>
            </motion.div>

            {/* ---- Sayfa Bilgisi ---- */}
            <motion.div className="text-center text-gray-400 text-sm mt-3 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + (entriesLength * 0.05), duration: 0.3 }}
            >
                Sayfa {current} / {totalPages} • Toplam {totalUsers} oyuncu
            </motion.div>
        </>
    );
}