"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SosButton } from "./sos/SosButton";
import { AppHeader } from "./ui/shell/app-header";
import { MarketingFooter, MarketingHeader } from "./ui/shell/marketing";
import { SkipLink } from "./ui/shell/skip-link";
import { TabBar } from "./ui/shell/tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The planner at "/" is a full-screen map with its own floating controls,
  // like a maps app: no header, no tab bar, nothing overlapping it.
  if (pathname === "/") {
    return (
      <>
        <SkipLink />
        <main id="main" className="bg-bg text-text">
          {children}
        </main>
      </>
    );
  }

  // Consoles, the public family page, sign-in and the demo driver bring their own chrome.
  const isExcludedRoute =
    pathname.startsWith("/rescue") ||
    pathname.startsWith("/agency") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/demo");

  if (isExcludedRoute) {
    return (
      <>
        <SkipLink />
        <main id="main" className="min-h-dvh bg-bg text-text">
          {children}
        </main>
      </>
    );
  }

  // The public marketing page has its own header and footer, and no tab bar.
  if (pathname === "/about") {
    return (
      <div className="flex min-h-dvh flex-col bg-bg text-text">
        <SkipLink />
        <MarketingHeader />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 md:px-6">
          {children}
        </main>
        <MarketingFooter />
      </div>
    );
  }

  // SOS FAB: trek mode and route detail pages (SPEC §9.1). HeaderSos covers the rest (Q3).
  const showFab = pathname === "/trek" || /^\/routes\/[^/]+$/.test(pathname);
  const showHeaderSos = pathname !== "/sos";

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <SkipLink />
      <AppHeader showSos={showHeaderSos} />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] md:px-6 md:py-6 lg:pb-8"
      >
        {children}
      </main>
      {showFab && <SosButton />}
      <TabBar />
    </div>
  );
}
