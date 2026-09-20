import Link from "next/link";
import { STANDARD_DISCLAIMER } from "@/lib/ams-copy";
import { Button } from "../button";
import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";

/** Public landing chrome: no tab bar, no trekker controls. */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-line bg-bg px-4 md:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6">
        <Link href="/" aria-label="Sathi home">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="ml-2 hidden items-center gap-5 text-body text-text-muted md:flex">
          <a href="#capabilities" className="hover:text-text">
            What it does
          </a>
          <a href="#sos" className="hover:text-text">
            How SOS works
          </a>
          <a href="#pricing" className="hover:text-text">
            Pricing
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="size-10" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/">Plan a route</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl space-y-4 border-t border-line px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-body text-text-muted">
          <Link href="/" className="hover:text-text">
            Plan a route
          </Link>
          <Link href="/routes" className="hover:text-text">
            Routes
          </Link>
          <Link href="/community" className="hover:text-text">
            Community
          </Link>
          <Link href="/sos" className="hover:text-text">
            SOS
          </Link>
          <Link href="/offline" className="hover:text-text">
            Offline
          </Link>
        </nav>
      </div>
      <p className="max-w-3xl text-small text-text-muted">{STANDARD_DISCLAIMER}</p>
      <p className="text-small text-text-muted">Map data © OpenStreetMap contributors, Protomaps</p>
    </footer>
  );
}
