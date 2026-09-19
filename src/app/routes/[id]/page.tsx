import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoute, getResources } from "@/lib/data";
import { RouteDetail } from "@/lib/types";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Map } from "@/components/map/Map";
import { ElevationProfile } from "@/components/trek/ElevationProfile";
import { StagesTable } from "@/components/trek/StagesTable";
import { ResourceList } from "@/components/trek/ResourceList";
import { Mountain, AlertTriangle, ShieldCheck, Download, ArrowRight } from "lucide-react";

export function generateStaticParams() {
  return [
    { id: "ebc" },
    { id: "annapurna-circuit" },
    { id: "poon-hill" },
    { id: "langtang" },
    { id: "manaslu" },
    { id: "gokyo" },
  ];
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const route = getRoute(id);

  if (!route) {
    notFound();
  }

  const isFullDetail = route.hasFullData && "waypoints" in route;
  const fullRoute = isFullDetail ? (route as RouteDetail) : null;
  const resources = getResources().filter((r) => r.region.toLowerCase().includes(route.region.toLowerCase()));

  // Profile follows the stages in walking order; distance is the stages' own trail distance.
  // Acclimatization days (from = to) are side hikes and don't move you along the trail.
  const elevationWaypoints = fullRoute
    ? fullRoute.stages
        .filter((s) => s.fromId !== s.toId)
        .reduce<{ id: string; name: string; altitudeM: number; distanceKm: number }[]>((ticks, stage) => {
          const byId = (id: string) => fullRoute.waypoints.find((w) => w.id === id);
          if (ticks.length === 0) {
            const from = byId(stage.fromId);
            if (from) ticks.push({ id: from.id, name: from.name, altitudeM: from.altM, distanceKm: 0 });
          }
          const to = byId(stage.toId);
          const last = ticks.at(-1)?.distanceKm ?? 0;
          if (to) ticks.push({ id: to.id, name: to.name, altitudeM: to.altM, distanceKm: last + stage.distanceKm });
          return ticks;
        }, [])
    : undefined;

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Header */}
      <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-border bg-surface shadow-lg">
        <div className="relative h-64 sm:h-80 w-full">
          <Image
            src={route.heroImage}
            alt={route.name}
            fill
            className="object-cover brightness-75"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">{route.region}</Badge>
              <Badge variant={route.difficulty === "easy" ? "ok" : "warning"}>
                {route.difficulty.toUpperCase()}
              </Badge>
              {route.hasFullData ? (
                <Badge variant="ok">Offline Pack Available</Badge>
              ) : (
                <Badge variant="unverified">Summary Only</Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-text tracking-tight">
              {route.name}
            </h1>
            <p className="text-text-muted text-base max-w-2xl">
              {route.summary}
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-t border-border bg-surface-2/60">
          <Stat label="Duration" value={`${route.days[0]}–${route.days[1]}`} unit="days" />
          <Stat label="Max Altitude" value={route.maxAltitudeM.toLocaleString()} unit="m" />
          <Stat label="Start Point" value={route.startPoint} />
          <Stat label="Difficulty" value={route.difficulty} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-8">
        {/* Map & Elevation Section */}
        {fullRoute ? (
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mountain className="w-5 h-5 text-accent" />
              Route Map & Elevation Profile
            </h2>
            <Map route={fullRoute} resources={resources} />
            <ElevationProfile waypoints={elevationWaypoints} />
          </section>
        ) : (
          <Card className="bg-surface-2/40 border-dashed">
            <div className="p-6 text-center space-y-2">
              <Mountain className="w-10 h-10 text-accent mx-auto" />
              <h3 className="font-semibold text-lg">Detailed Offline Data Coming Soon</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                Full waypoints, offline PMTiles basemaps, and daily stage elevations for {route.name} are currently in preparation.
              </p>
            </div>
          </Card>
        )}

        {/* Itinerary Stages Table */}
        {fullRoute && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Standard Itinerary & Altitude Gain</h2>
            <StagesTable stages={fullRoute.stages} waypoints={fullRoute.waypoints} />
          </section>
        )}

        {/* Permits & Safety Guidelines */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-ok" />
                Required Permits & Regulations
              </h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
                {route.permits.map((permit, idx) => (
                  <li key={idx} className="text-text font-medium">{permit}</li>
                ))}
              </ul>
              <p className="text-xs text-text-faint italic border-t border-border/40 pt-2">
                Note: Since April 2023, Nepal requires foreign trekkers in national parks to trek with a licensed guide. Check current rules with the Nepal Tourism Board or your agency before departing.
              </p>
            </CardBody>
          </Card>

          {/* Hazards & Safety Warnings */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-base flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Trail Hazards & Altitude Risks
              </h3>
            </CardHeader>
            <CardBody>
              {fullRoute && fullRoute.hazards ? (
                <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
                  {fullRoute.hazards.map((hazard, idx) => (
                    <li key={idx}>{hazard}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">
                  High altitude AMS precautions apply above 3,000m. Always monitor symptoms daily.
                </p>
              )}
            </CardBody>
          </Card>
        </section>

        {/* Emergency Resources Directory */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Emergency & Rescue Directory</h2>
          <ResourceList resources={resources} />
        </section>
      </div>

      {/* Sticky Bottom CTA Bar */}
      <div className="fixed bottom-16 md:bottom-4 left-4 right-4 max-w-4xl mx-auto z-30 bg-surface/95 backdrop-blur-md p-4 rounded-[var(--radius)] border border-border shadow-2xl flex items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="font-semibold text-sm">{route.name}</p>
          <p className="text-xs text-text-muted">{route.days[0]}–{route.days[1]} Days · {route.maxAltitudeM.toLocaleString()} m</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="secondary" className="flex-1 sm:flex-initial" disabled>
            <Download className="w-4 h-4 mr-2" />
            Offline Pack (34 MB)
          </Button>
          <Link href={`/trek?route=${route.id}`} className="flex-1 sm:flex-initial">
            <Button variant="primary" className="w-full">
              Start Trek
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
