import * as React from "react";
import Link from "next/link";
import { Mountain } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border pt-12 pb-8 text-xs text-text-muted space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
            <Mountain className="w-4 h-4 text-accent" />
          </div>
          <span className="font-bold text-sm text-text">Sathi</span>
          <span className="text-text-faint">| Trekking Safety PWA</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link href="/routes" className="hover:text-text">
            Routes
          </Link>
          <Link href="/trek" className="hover:text-text">
            Trek Mode
          </Link>
          <Link href="/styleguide" className="hover:text-text">
            Styleguide
          </Link>
          <Link href="/offline" className="hover:text-text">
            Offline Status
          </Link>
        </div>
      </div>

      {/* Standard Disclaimer per SAFETY §1 */}
      <p className="text-text-faint text-[11px] leading-relaxed max-w-3xl border-t border-border/40 pt-4">
        <strong>Medical & Safety Disclaimer:</strong> Sathi provides general safety information and helps you share your location. It does not provide medical diagnosis or guarantee rescue. In an emergency, descend if you can do so safely, and contact local rescue services directly. If in doubt, go down.
      </p>

      <div className="flex items-center justify-between text-[11px] text-text-faint pt-2">
        <span>© {new Date().getFullYear()} Sathi Project. Built for Nepal Hackathon.</span>
        <span>Map data © OpenStreetMap contributors, Protomaps</span>
      </div>
    </footer>
  );
}
