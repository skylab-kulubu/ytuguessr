"use client";

import { motion } from "framer-motion";
import { Github, Instagram, Globe } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Github, href: "https://github.com/skylab-kulubu", label: "GitHub" },
        { icon: Instagram, href: "https://www.instagram.com/ytuskylab", label: "Instagram" },
        { icon: Globe, href: "https://yildizskylab.com/", label: "Website" },
    ];

    const quickLinks = [
        { name: "Ana Sayfa", href: "/" },
        { name: "Hakkımızda", href: "https://yildizskylab.com/" },
        { name: "Kullanım Şartları", href: "https://skyl.app/kvkk-metni" },
        { name: "Gizlilik Politikası", href: "https://skyl.app/kvkk-metni" },
    ];

    return (
        <footer className="relative bg-gradient-to-b from-[#1B1740] via-[#1a1635] to-[#151229] text-white">

            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    <motion.div className="lg:col-span-2"
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center justify-center mb-4">
                            <img src="/skylab.png" alt="Skylab Logo" className="h-12 justify-center items-center" />
                            <span className="text-[#EADAFF] mx-3 self-center mb-2 font-bold text-2xl">SKY LAB | WEBLAB</span>

                        </div>
                        <div className="space-y-4 justify-center grid grid-cols-2">
                            <div className="text-sm text-gray-300 flex flex-col items-center">
                                <p className="mb-1">Yıldız Teknik Üniversitesi</p>
                                <p className="text-gray-400 text-[11px]">SKY LAB Kulübü | Web Ekibi</p>
                            </div>

                            {/* Social links */}
                            <div className="flex space-x-4 justify-center">
                                {socialLinks.map((social, index) => (
                                    <a key={index} href={social.href} rel="noopener noreferrer" className="w-10 h-10 bg-white/5 backdrop-blur border border-violet-500/20 rounded-lg flex items-center justify-center text-[#EADAFF] hover:bg-violet-500/20 hover:border-violet-400/50 transition-all duration-200">
                                        <social.icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className="md:col-span-2 lg:col-span-2" 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-lg font-bold mb-4 text-center md:text-start text-violet-300">Hızlı Linkler</h3>

                        <div className="grid grid-cols-2 gap-3 md:flex md:flex-row md:gap-6 px-8 md:px-0">
                            {quickLinks.map((link, index) => (
                                <a key={index} href={link.href} rel="noopener noreferrer" className="text-gray-300 hover:text-violet-400 transition-colors duration-200 text-sm text-center">
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </motion.div>

                </div>

                {/* ---- Yapımcılar ---- */}
                <motion.div className="pt-8 border-t border-violet-500/20"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-sm text-gray-400">
                            © {currentYear} YTUGuessr. Tüm hakları saklıdır.
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <a href="https://www.instagram.com/fatiihnaz" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors duration-200">
                                Fatih Naz
                            </a>
                            <span className="text-gray-400">|</span>
                            <a href="https://www.instagram.com/egehanavcu" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors duration-200">
                                Egehan Avcu
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
