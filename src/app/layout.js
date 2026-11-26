import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "../lib/providers";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
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
