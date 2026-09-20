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

// Matches --bg; browser chrome can't read CSS variables.
export const viewport: Viewport = { themeColor: "#0A0B0D", viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Providers>
          <AppShell>{children}</AppShell>
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
