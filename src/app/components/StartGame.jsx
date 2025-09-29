"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStartGame } from "../../lib/hooks/useGame";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, ChevronUp, TriangleAlert } from "lucide-react";

function isValidMail(v) {
  if (!v) return false;
  const mail = v.trim().toLowerCase();
  return /@(?:yildiz\.edu\.tr|std\.yildiz\.edu\.tr)$/.test(mail);
}

export default function StartGame() {
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSchoolMail, setIsSchoolMail] = useState(false);
  const router = useRouter();
  const startMut = useStartGame();

  useEffect(() => {
    setIsSchoolMail(isValidMail(mail));
  }, [mail]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await startMut.mutateAsync({
        school_mail: mail,
        show_name: true,
        again: false,
      });
      router.push("/game");
    } catch (error) {
      const msg = error?.response?.data?.detail || "Oyun başlatılamadı.";
      setError(msg);
      setLoading(false);
      setTimeout(() => setError(null), 2000);
    }
  }

  return (
    <div className="mx-4 rounded-2xl p-5 sm:p-6 bg-white/5 backdrop-blur border border-violet-500/20 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_40px_-15px_rgba(0,0,0,.6)]">
      <div className="text-center space-y-1 mb-4">
        <h3 className="text-lg font-extrabold text-white">OYUNA BAŞLA</h3>
      </div>

      <form onSubmit={(error || !isSchoolMail || loading) ? (e) => e.preventDefault() : handleSubmit} className="space-y-4">
        <div>
          <div className="block text-xs font-semibold text-start ml-2 text-white/80 mb-2">
            YTÜ E-posta adresi
          </div>

          <div className={`relative rounded-xl bg-[#2a2353]/80 border ${error ? "border-red-500/60" : "border-[#3b3163]"} focus-within:ring-2 focus-within:ring-violet-400/70`}>
            <input placeholder="ogrenci@std.yildiz.edu.tr" value={mail}
              onChange={(e) => setMail(e.target.value)}
              className=" w-full bg-transparent text-white placeholder-white/40 pl-4 pr-12 py-3 rounded-xl outline-none"
            />

            <button type="submit" className={`absolute right-1 top-1/2 -translate-y-1/2 text-white p-3 rounded-lg ${error ? "bg-red-500/70 disabled" : loading ? "bg-indigo-400 disabled" : isSchoolMail ? "bg-indigo-500" : "bg-white/10 disabled"}`}> 
              <AnimatePresence mode="wait">
                <motion.div key={loading ? "loading" : error ? "error" : "default"}
                initial={{ y: 20, opacity:0}}
                animate={{ y: 0, opacity:1}}
                exit={{ y: -20, opacity:0}}
                transition={{ duration: 0.2 }}
                >
                 {loading ? (
                  <Loader2 size={18} className="animate-spin"/>
                 ) : error ? (
                  <X size={18}/>
                 ) :(
                  <ChevronUp size={18} />
                 )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>

          {error && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-300">
              <TriangleAlert size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-white/50 leading-relaxed">
          Oyunu oynadığınızda <a href="https://skyl.app/kvkk-metni" rel="noopener noreferrer" target="_blank" className="opacity-60">KVKK koşullarını</a> kabul etmiş olursunuz.
        </p>
        
      </form>
    </div>
  );
}
