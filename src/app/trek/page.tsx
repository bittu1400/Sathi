"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { getRoute, getRoutes, getResources } from "@/lib/data";
import { RouteDetail } from "@/lib/types";
import { StartTrek } from "@/components/trek/StartTrek";
import { TrekHeader } from "@/components/trek/TrekHeader";
import { AltitudeHero } from "@/components/trek/AltitudeHero";
import { NextWaypoint } from "@/components/trek/NextWaypoint";
import { AltitudeLadder } from "@/components/trek/AltitudeLadder";
import { AlertFeed } from "@/components/trek/AlertFeed";
import { CheckinSheet } from "@/components/trek/CheckinSheet";
import { Map } from "@/components/map/Map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackPosition } from "@/lib/offline/useTrackPosition";
import { ClipboardCheck, Square, ShieldAlert } from "lucide-react";

function TrekContent() {
  const searchParams = useSearchParams();
  const routeParam = searchParams.get("route");
  const [activeRouteId, setActiveRouteId] = React.useState<string | null>(
    routeParam || "ebc"
  );
  const [isTrekActive, setIsTrekActive] = React.useState<boolean>(true);
  const [isCheckinOpen, setIsCheckinOpen] = React.useState<boolean>(false);

  const routeData = activeRouteId ? getRoute(activeRouteId) : null;
  const isFullRoute = routeData && "waypoints" in routeData;
  const fullRoute = isFullRoute ? (routeData as RouteDetail) : null;

  const currentPos = useTrackPosition(fullRoute);
  const resources = getResources();

  const sampleNights = [
    { dayNumber: 4, placeName: "Tengboche", altitudeM: 3860, gainM: 420 },
    { dayNumber: 5, placeName: "Dingboche", altitudeM: 4410, gainM: 550 },
    { dayNumber: 6, placeName: "Dingboche (Rest)", altitudeM: 4410, gainM: 0 },
    { dayNumber: 7, placeName: "Lobuche", altitudeM: 4940, gainM: 530 },
  ];

  const nextWp = fullRoute?.waypoints[5] || {
    id: "ebc-lobuche",
    name: "Lobuche",
    lat: 27.948,
    lng: 86.8108,
    altM: 4940,
    kind: "village" as const,
    hasTeahouse: true,
    signal: "weak" as const,
  };

  if (!isTrekActive || !fullRoute) {
    return (
      <StartTrek
        routes={getRoutes()}
        onStart={(rId) => {
          setActiveRouteId(rId);
          setIsTrekActive(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Trek Header */}
      <TrekHeader routeName={fullRoute.name} dayNumber={7} status="active" />

      {/* Altitude Hero Component */}
      <AltitudeHero
        altitudeM={currentPos?.altM || 4940}
        gainSinceLastNightM={530}
        severity="caution"
      />

      {/* Active Alerts */}
      <AlertFeed
        alerts={[
          {
            id: "alt-r6-caution",
            trekId: "active-trek",
            kind: "ams_gain",
            severity: "caution",
            title: "Sleeping Altitude Gain Caution (+530 m)",
            body: "Sleeping gain between Dingboche (4,410 m) and Lobuche (4,940 m) exceeds the 500 m recommended nightly limit above 3,000 m.",
            actions: ["View Guidance"],
            createdAt: new Date().toISOString(),
            acknowledgedAt: null,
            dedupeKey: "ams_gain:2026-09-19",
          },
        ]}
      />

      {/* Compact Interactive Map View */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
          Trail Map & Position
        </h3>
        {fullRoute && (
          <Map
            route={fullRoute}
            resources={resources}
            position={currentPos || undefined}
          />
        )}
      </div>

      {/* Next Waypoint Info */}
      <NextWaypoint
        waypoint={nextWp}
        distanceKm={4.2}
        altitudeDeltaM={530}
      />

      {/* Sleeping Altitude History Ladder */}
      <AltitudeLadder nights={sampleNights} />

      {/* Evening Check-in CTA Card */}
      <Card className="bg-surface-2/70 border-accent/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-accent" />
            <h4 className="font-semibold text-base">Evening AMS Check-in</h4>
          </div>
          <span className="text-xs font-mono text-caution">Required Daily</span>
        </div>
        <p className="text-xs text-text-muted">
          Record your 4 Lake Louise symptoms and sleeping location to update your safety status.
        </p>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setIsCheckinOpen(true)}
        >
          Open Lake Louise Check-in Sheet
        </Button>
      </Card>

      {/* CheckinSheet Modal */}
      {fullRoute && (
        <CheckinSheet
          isOpen={isCheckinOpen}
          onClose={() => setIsCheckinOpen(false)}
          waypoints={fullRoute.waypoints}
        />
      )}

      {/* Emergency SOS FAB Placeholder & End Trek Menu */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-muted hover:text-danger"
          onClick={() => setIsTrekActive(false)}
        >
          <Square className="w-4 h-4 mr-1.5" />
          End Trek Session
        </Button>

        <Button variant="sos" size="sm" className="px-4 text-xs">
          <ShieldAlert className="w-4 h-4 mr-1" />
          SOS
        </Button>
      </div>
    </div>
  );
}

export default function TrekPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <TrekContent />
    </React.Suspense>
  );
}
