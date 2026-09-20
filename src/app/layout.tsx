import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SwRegister } from "@/components/sw-register";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Sathi — Offline Trekking Safety for Nepal", template: "%s · Sathi" },
  description: "Offline-first route intelligence, AMS monitoring, data-free SOS & live rescue dashboard.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Sathi", statusBarStyle: "black-translucent" },
};

// Matches --bg in each theme; browser chrome can't read CSS variables.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0B0D" },
    { media: "(prefers-color-scheme: light)", color: "#F4F7F4" },
  ],
  viewportFit: "cover",
};

/**
 * Runs before the first paint: the stored choice wins, otherwise the phone's
 * own setting. Without it a trekker who picked light would still see one dark
 * frame on every load.
 */
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("sathi-theme");var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // The script above sets data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Providers>
          <AppShell>{children}</AppShell>
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
