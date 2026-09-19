import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Compass, ShieldAlert, Check } from "lucide-react";

export function LandingHero() {
  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-border bg-surface mb-12 shadow-2xl">
      <div className="relative h-[480px] sm:h-[560px] w-full">
        <Image
          src="/images/routes/landing-hero.webp"
          alt="Nepal Trekking Peak"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 max-w-3xl space-y-4">
          <Badge variant="ok" className="self-start text-xs py-1 px-3">
            Offline-First Trekking Safety PWA
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text leading-tight">
            Trek higher. <br />
            <span className="text-accent">Come home safely.</span>
          </h1>

          <p className="text-text-muted text-base sm:text-lg font-normal max-w-xl">
            The offline-first safety companion for Nepal&apos;s trails. Altitude-sickness monitoring, satellite-free SOS, altitude weather, and live rescue tracking.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/routes">
              <Button variant="primary" size="lg">
                <Compass className="w-5 h-5 mr-2" />
                Explore Routes
              </Button>
            </Link>
            <Link href="/trek">
              <Button variant="secondary" size="lg">
                <ShieldAlert className="w-5 h-5 mr-2 text-sos" />
                See How SOS Works
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-2 text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-ok" />
              SOS is Free. Always.
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-ok" />
              Zero Bars Required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
