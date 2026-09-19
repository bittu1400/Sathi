import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { getRoute, getResources } from "@/lib/data";
import type { RouteDetail } from "@/lib/types";
import { formatAltitude, formatKm } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Fact, FactList } from "@/components/ui/fact";
import { Panel } from "@/components/ui/panel";
import { Readout } from "@/components/ui/readout";
import { Map } from "@/components/map/Map";
import { PackButton } from "@/components/trek/PackButton";
import { ElevationProfile } from "@/components/trek/ElevationProfile";
import { profileTicks } from "@/components/trek/profile-ticks";
import { StagesTable } from "@/components/trek/StagesTable";
import { ResourceList } from "@/components/trek/ResourceList";
import { DataStatus, DifficultyStatus } from "@/components/trek/RouteCard";

export function generateStaticParams() {
  return ["ebc", "annapurna-circuit", "poon-hill", "langtang", "manaslu", "gokyo"].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const route = getRoute((await params).id);
  return { title: route?.name ?? "Route" };
}

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const route = getRoute(id);
  if (!route) notFound();

  const full = route.hasFullData && "waypoints" in route ? (route as RouteDetail) : null;
  // Nation-wide entries (region names "Nepal") belong on every route.
  const resources = getResources().filter((r) => /nepal/i.test(r.region) || r.region.toLowerCase().includes(route.region.toLowerCase()));
  const ticks = full ? profileTicks(full) : [];
  const peak = ticks.reduce<(typeof ticks)[number] | undefined>((a, b) => (!a || b.altitudeM > a.altitudeM ? b : a), undefined);
  const endNote = peak && peak.altitudeM < route.maxAltitudeM ? `This profile tops out at ${peak.name}, ${formatAltitude(peak.altitudeM)}. The route reaches ${formatAltitude(route.maxAltitudeM)}.` : undefined;
  const totalKm = full?.stages.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalGain = full?.stages.reduce((sum, s) => sum + s.ascentM, 0);

  const start = full && (
    <Button asChild size="lg" className="w-full">
      <Link href={`/trek?route=${route.id}`}>
        Start trek <ArrowRight className="size-5" aria-hidden />
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <header className="space-y-3">
        <p className="text-label text-text-muted">{route.region}</p>
        <h1 className="text-h1">{route.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyStatus difficulty={route.difficulty} />
          <DataStatus full={route.hasFullData} />
        </div>
        <p className="max-w-2xl text-text-muted">{route.summary}</p>
      </header>

      <Panel>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Readout label="Max altitude" value={route.maxAltitudeM.toLocaleString("en-US")} unit="m" />
          <Readout label="Days" value={`${route.days[0]}–${route.days[1]}`} />
          {totalKm !== undefined && <Readout label="Distance" value={totalKm.toFixed(1)} unit="km" />}
          {totalGain !== undefined && <Readout label="Total ascent" value={totalGain.toLocaleString("en-US")} unit="m" />}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {full ? (
            <>
              <section className="space-y-3">
                <h2 className="text-h2">Elevation profile</h2>
                <ElevationProfile waypoints={ticks} note={endNote} />
              </section>
              <section className="space-y-3">
                <h2 className="text-h2">Map</h2>
                <Map route={full} resources={resources} />
              </section>
              <section className="space-y-3">
                <h2 className="text-h2">Itinerary</h2>
                <StagesTable stages={full.stages} waypoints={full.waypoints} />
              </section>
            </>
          ) : (
            <Panel title="Preview route">
              <div className="space-y-3">
                <p className="text-text-muted">
                  Stages, waypoints, the elevation profile and offline packs for {route.name} aren&apos;t ready yet. The summary, permits and emergency directory below are available.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="secondary">
                    <Link href="/routes">Routes with full data</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <a href="#directory">Emergency directory</a>
                  </Button>
                </div>
              </div>
            </Panel>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <Panel title="Permits">
              <ul className="list-inside list-disc space-y-1 text-body">
                {route.permits.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-small text-text-muted">
                Since April 2023, Nepal requires foreign trekkers in national parks to trek with a licensed guide. Check current rules with the Nepal Tourism Board or your agency before departing.
              </p>
            </Panel>
            <Panel title="Hazards" actions={<TriangleAlert className="size-5 text-warning" aria-hidden />}>
              {full ? (
                <ul className="list-inside list-disc space-y-1 text-body text-text-muted">
                  {full.hazards.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-muted">Altitude-sickness precautions apply above 3,000 m. Check in daily.</p>
              )}
            </Panel>
          </section>

          <section id="directory" className="scroll-mt-20 space-y-3">
            <h2 className="text-h2">Emergency directory</h2>
            <ResourceList resources={resources} />
          </section>
        </div>

        {/* Desktop: sticky right column. Mobile: the bar below. */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {start}
            {full && <PackButton routeId={full.id} tilesUrl={full.tilesUrl} tilesBytes={full.tilesBytes} />}
            <Panel title="At a glance">
              <FactList>
                <Fact label="Start point">{route.startPoint}</Fact>
                <Fact label="Best seasons">{route.bestSeasons.join(", ")}</Fact>
                {full && <Fact label="Distance">{formatKm(totalKm ?? 0)}</Fact>}
              </FactList>
            </Panel>
          </div>
        </aside>
      </div>

      {full && (
        <div className="space-y-4 lg:hidden">
          <PackButton routeId={full.id} tilesUrl={full.tilesUrl} tilesBytes={full.tilesBytes} />
          {/* Sticky Start trek, above the tab bar; the right 88 px are kept free for the SOS button. */}
          <div className="fixed bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] left-4 right-[88px] z-[var(--z-sticky)]">{start}</div>
        </div>
      )}
    </div>
  );
}
