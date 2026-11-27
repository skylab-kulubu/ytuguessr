import localFont from "next/font/local";
import { Providers } from "../lib/providers";
import "./globals.css";

/* Fontlar depoda: next/font/google build sirasinda Google Fonts'a gidiyordu ve Google ara sira
   uzantisiz /l/font?kit= adresi donunce Next'in yukleyicisi CI'da build'i dusuruyordu
   (vercel/next.js#99114). Dosyalar google/fonts'taki degisken fontlarin Google'in latin +
   latin-ext araliklarina indirgenmis halleri; OFL lisanslari yanlarinda. */
const display = localFont({
  src: "./fonts/space-grotesk.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "YTUGuessr",
  description: "Yıldız Teknik Üniversitesi kampüsünde konum tahmin etme oyunu.",
  applicationName: "YTUGuessr",
  icons: {
    icon: "/marker-red.svg",
    apple: "/marker-red.svg",
    shortcut: "/marker-red.svg",
  },
  openGraph: {
    title: "YTUGuessr",
    description: "Yıldız Teknik Üniversitesi kampüsünde konum tahmin etme oyunu.",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a100d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${display.variable} ${mono.variable}`}>
      <body className="bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
