"use client";

import * as React from "react";
import Link from "next/link";
import { Check, WifiOff } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useConnectivity } from "@/lib/offline/status";

// What works with no data today. Offline maps aren't listed until real basemap packs exist (A-13).
const works = [
  "Send an SOS: it is saved and an SMS opens with your position",
  "Record Lake Louise check-ins: they are sent when you're online",
  "Log your GPS track while Sathi stays open",
];

export default function OfflineFallbackPage() {
  const { online } = useConnectivity();

  return (
    <div className="mx-auto max-w-md space-y-4 py-8">
      <div className="space-y-2">
        <WifiOff className="size-7 text-warning" aria-hidden />
        <h1 className="text-h1">You&apos;re offline</h1>
        <p className="text-text-muted">This page didn&apos;t load because there is no connection. These still work:</p>
      </div>

      {online && (
        <Banner
          severity="ok"
          headline="You're back online"
          actions={
            <Button onClick={() => window.location.reload()}>Retry</Button>
          }
        />
      )}

      <Button asChild variant="sos" size="lg" className="w-full">
        <Link href="/sos">Open SOS</Link>
      </Button>

      <Panel title="Works without data">
        <ul className="space-y-2">
          {works.map((w) => (
            <li key={w} className="flex items-start gap-2 text-body">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> {w}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href="/trek">Open trek mode</Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link href="/routes">Routes</Link>
        </Button>
      </div>
    </div>
  );
}
