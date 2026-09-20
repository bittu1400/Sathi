"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Mountain, Map, Settings } from "lucide-react";
import { LiveConnectivityPill } from "./live-connectivity";
import { SosButton } from "./sos/SosButton";
import { TopoBackground } from "./ui/topo-background";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide main shell layout on specialized routes
  const isExcludedRoute =
    pathname.startsWith("/rescue") ||
    pathname.startsWith("/agency") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/demo");

  const showSos = pathname === "/trek" || /^\/routes\/[^/]+$/.test(pathname);

  if (isExcludedRoute) {
    return <main className="min-h-screen bg-bg text-text">{children}</main>;
  }

  const navItems = [
    { label: "Routes", href: "/routes", icon: Compass },
    { label: "Trek", href: "/trek", icon: Mountain },
    { label: "Plan", href: "/plan", icon: Map },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text relative selection:bg-accent/20">
      <TopoBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mountain className="w-5 h-5 text-accent" />
            </div>
            <span className="font-bold text-lg tracking-tight text-text">Sathi</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors flex items-center gap-2 py-1 border-b-2 ${
                    isActive
                      ? "border-accent text-accent font-semibold"
                      : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <LiveConnectivityPill />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8 relative z-10">
        {children}
      </main>

      {/* SOS FAB: trek mode and route detail pages (SPEC §9.1) */}
      {showSos && <SosButton />}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-border px-2 py-2 shadow-lg">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isActive
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[11px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
