"use client";

import Link from "next/link";
import { useEvents } from "../../lib/hooks/useEvents";
import { useNow } from "../../lib/hooks/useNow";
import { featuredEvent } from "../../lib/events";
import SkylabMark from "./SkylabMark";

const CLUB = [
  { label: "Hakkımızda", href: "https://yildizskylab.com/" },
  { label: "Instagram", href: "https://www.instagram.com/ytuskylab" },
  { label: "GitHub", href: "https://github.com/skylab-kulubu" },
];

const DEVELOPERS = [
  { name: "Fatih Naz", href: "https://www.instagram.com/fatiihnaz" },
  { name: "Egehan Avcu", href: "https://www.instagram.com/egehanavcu" },
];

const LINK = "text-[15px] text-muted transition-colors hover:text-ink lg:text-sm";

function Group({ title, className = "", children }) {
  return (
    <div className={`flex flex-col items-center gap-3 lg:items-start ${className}`}>
      <p className="mb-1 font-mono text-xs text-faint">{title}</p>
      {children}
    </div>
  );
}

export default function Footer() {
  const events = useEvents();
  const now = useNow();
  const event = featuredEvent(events.data, now);

  return (
    <footer className="border-t border-hair">
      <div className="mx-auto max-w-350 px-5 pt-12 pb-7 sm:px-8 lg:pt-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 text-center lg:grid-cols-12 lg:gap-8 lg:text-left">
          <div className="col-span-2 flex flex-col items-center gap-4 lg:col-span-4 lg:items-start">
            <img src="/logo.svg" alt="YTUGuessr" className="h-5 lg:h-5.5" />
            <p className="max-w-85 text-sm leading-relaxed text-muted">
              Yıldız Teknik Üniversitesi Davutpaşa Kampüsü&apos;nde fotoğraftan konum tahmin etme oyunu.
            </p>
            <p className="font-mono text-xs text-faint">41.0255° K · 28.8917° D</p>
          </div>

          <Group title="Oyun" className="lg:col-span-2">
            <Link href="/" className={LINK}>Oyna</Link>
            <Link href="/leaderboard" className={LINK}>Lider tablosu</Link>
            {event && (
              <Link href={`/leaderboard?event=${encodeURIComponent(event.slug)}`} className={LINK}>
                {event.name} sıralaması
              </Link>
            )}
          </Group>

          <Group title="Kulüp" className="lg:col-span-2">
            {CLUB.map((link) => (
              <a key={link.href} href={link.href} rel="noopener noreferrer" className={LINK}>
                {link.label} ↗
              </a>
            ))}
          </Group>

          <Group title="Yasal" className="col-span-2 lg:col-span-2">
            <a href="https://skyl.app/kvkk-metni" rel="noopener noreferrer" className={LINK}>
              KVKK metni ↗
            </a>
          </Group>

          <div className="col-span-2 flex items-center justify-center gap-3.5 border-y border-hair py-4 lg:flex-col lg:items-end lg:gap-2.5 lg:border-0 lg:py-0">
            <SkylabMark className="h-8.5 w-auto text-[#175238] lg:h-10.5" />
            <div className="text-left lg:text-right">
              <p className="text-[15px] font-semibold text-ink">SKY LAB</p>
              <p className="mt-0.5 text-[13px] text-muted">WEBLAB Ekibi</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 font-mono text-xs text-faint lg:mt-12 lg:flex-row lg:justify-between lg:gap-6 lg:border-t lg:border-hair lg:pt-5">
          <span>© {new Date().getFullYear()} YTUGuessr</span>
          <span>
            Geliştirenler:{" "}
            {DEVELOPERS.map((dev, i) => (
              <span key={dev.href}>
                {i > 0 && " · "}
                <a href={dev.href} rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  {dev.name}
                </a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
