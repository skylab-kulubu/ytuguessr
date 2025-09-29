import { Providers } from "../lib/providers";
import ScreenGuard from "../lib/ScreenGuard";
import "./globals.css"; 

export const metadata = {
  title: 'YTUGuessr',
  description: 'Yıldız Teknik Üniversitesi kampüsünde konum tahmin etme oyunu.',
  applicationName: 'YTUGuessr',
  icons: {
    icon: '/marker-red.svg',
    apple: '/marker-red.svg',
    shortcut: '/marker-red.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1B1740',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="bg-[#1B1740]">
        <Providers>
          <ScreenGuard>
            {children}
          </ScreenGuard>
        </Providers>
      </body>
    </html>
  )
}
