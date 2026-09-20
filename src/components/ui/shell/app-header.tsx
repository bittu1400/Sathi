"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OPEN_PALETTE_EVENT } from "../command-palette";
import { Kbd } from "../kbd";
import { LiveConnectivityPill } from "@/components/live-connectivity";
import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";
import { AccountMenu } from "./account-menu";
import { HeaderSos } from "./header-sos";
import { navItems } from "./nav";

/** 56 px. Nav is inline from 1024 px; below that the TabBar carries it. */
export function AppHeader({ showSos }: { showSos: boolean }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-line bg-bg px-4 md:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4">
        <Link href="/" aria-label="Sathi home">
          <Logo compact />
        </Link>
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          {navItems.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center rounded-[var(--radius)] px-3 text-body transition-colors duration-[var(--dur-fast)]",
                  active ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {/* Desktop only: trekker screens are touch-first, so no mobile trigger. */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
            className="hidden min-h-10 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-line-strong px-3 text-small text-text-muted hover:bg-surface-2 hover:text-text lg:flex"
          >
            Search <Kbd>⌘K</Kbd>
          </button>
          <LiveConnectivityPill />
          <ThemeToggle className="size-10" />
          {showSos && <HeaderSos />}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
