import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "@/components/ui/sonner";


// 字体配置
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "IP-Search",
  description: "Look up IPv4 and IPv6 locations, providers, and network details",
  keywords: "IP lookup,IPv4,IPv6,geolocation,ISP,ASN,network information",
  authors: [{ name: "dnslin" }],
  creator: "dnslin",
  publisher: "dnslin",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "IP address lookup - Look up IPv4 and IPv6 locations, providers, and network details",
    description: "Look up IPv4 and IPv6 locations, providers, and network details",
    siteName: "IP-Search",
  },
  twitter: {
    card: "summary_large_image",
    title: "IP address lookup - Look up IPv4 and IPv6 locations, providers, and network details",
    description: "Look up IPv4 and IPv6 locations, providers, and network details",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-primary))] transition-colors duration-300">
        <div id="root">
          {children}
        </div>
        <Toaster />
        
      </body>
    </html>
  );
}
