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
  // SEO-1: metadataBase required for OG image URLs
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sathi.vercel.app"
  ),
  title: {
    default: "Sathi — Offline Trekking Safety for Nepal",
    template: "%s · Sathi",
  },
  description:
    "Offline-first route intelligence, AMS monitoring, data-free SOS & live rescue dashboard. Safety is free.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Sathi", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: "Sathi",
    title: "Sathi — Offline Trekking Safety for Nepal",
    description:
      "One-tap SOS that works without data. AMS check-ins, live rescue dashboard, offline maps. Safety is free.",
  },
};

// Matches --bg of the default (dark) theme; browser chrome can't read CSS variables.
export const viewport: Viewport = { themeColor: "#0A0E13", viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      // The inline script below swaps data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sathi-theme');if(t){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        {/* FND-5: skip link must be the very first focusable element in the DOM */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <AppShell>{children}</AppShell>
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
