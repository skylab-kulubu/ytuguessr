"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Trophy, Gamepad2 } from "lucide-react";
import Link from "next/link";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);

    const isLeaderboardPage = pathname === "/leaderboard";

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setIsScrolled(scrollTop > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleButtonClick = () => {
        if (isLeaderboardPage) {
            router.push('/');
        } else {
            router.push('/leaderboard');
        }
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 text-white transition-all duration-400 ease-in-out border-b
            ${isScrolled ? 'bg-gray-900/80 backdrop-blur-md border-gray-700/50' : 'border-transparent'}`}>

            <Link className="flex items-center" href="/">
                <img src="/logo.svg" alt="YTUGuessr Logo" className="h-7" />
            </Link>
            
            <button 
                className="bg-gradient-to-r from-yellow-500/20 to-yellow-400/15 text-yellow-400 italic font-medium text-sm rounded-md px-2 py-2 text-shadow-md/20 text-shadow-gray-800 hover:bg-yellow-600 transition-all duration-200"
                onClick={handleButtonClick}>
                {isLeaderboardPage ? <Gamepad2 size={18} /> : <Trophy size={18} />}
            </button>
        </header>
    );
}