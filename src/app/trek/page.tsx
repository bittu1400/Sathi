"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardCheck, Flag, LogIn, WifiOff } from "lucide-react";
import { getRoute, getRoutes, getResources } from "@/lib/data";
import type { RouteDetail } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { endTrek, startTrek } from "@/lib/db/queries";
import { demoModeStore, refreshSession, sessionStore } from "@/lib/session";
import { acknowledgeAlert, refreshTrekLog, trekLogStore } from "@/lib/trek-log";
import { amsInputFromCheckins, evaluateAms, sleepNights } from "@/lib/ams";
import { haversineKm, nearestWaypoint, nextWaypoint } from "@/lib/geo";
import { isEligible } from "@/lib/weather";
import { useConnectivity } from "@/lib/offline/status";
import { useTrackPosition } from "@/lib/offline/useTrackPosition";
import { StartTrek } from "@/components/trek/StartTrek";
import { TrekHeader } from "@/components/trek/TrekHeader";
import { AltitudeHero } from "@/components/trek/AltitudeHero";
import { NextWaypoint } from "@/components/trek/NextWaypoint";
import { AltitudeLadder } from "@/components/trek/AltitudeLadder";
import { AlertFeed } from "@/components/trek/AlertFeed";
import { CheckinSheet } from "@/components/trek/CheckinSheet";
import { WeatherCard } from "@/components/trek/WeatherCard";
import { ShareLinkCard } from "@/components/sos/ShareLinkCard";
import { Map } from "@/components/map/Map";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

// Short enough that /demo steps show up on the phone within a stage beat.
const REFRESH_MS = 10_000;
const DAY_MS = 86_400_000;
const nepalDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" });
const dayIndex = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

function fullRoute(id: string | undefined): RouteDetail | null {
  const route = id ? getRoute(id) : null;
  return route && "waypoints" in route ? (route as RouteDetail) : null;
}

function TrekContent() {
  const params = useSearchParams();
  const session = sessionStore.useValue();
  const log = trekLogStore.useValue();
  const { online } = useConnectivity();
  const [loaded, setLoaded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkinOpen, setCheckinOpen] = React.useState(false);

  React.useEffect(() => {
    refreshSession()
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [online]);

  const trek = session?.trek ?? null;
  const route = fullRoute(trek?.routeId);

  // Pull server data (incl. /demo changes) while online.
  React.useEffect(() => {
    if (!trek || !online) return;
    const refresh = () => refreshTrekLog(trek.id).catch(() => {});
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [trek, online]);

  const demoMode = demoModeStore.useValue() !== null;
  const { position, state: gps } = useTrackPosition(route, demoMode ? null : (trek?.id ?? null));
  const trekLog = trek && log?.trekId === trek.id ? log : null;
  const checkins = React.useMemo(() => trekLog?.checkins ?? [], [trekLog]);
  const latest = position ?? trekLog?.positions.at(-1) ?? null;

  const ams = React.useMemo(
    () => (route ? evaluateAms(amsInputFromCheckins(route.waypoints[0]?.altM ?? 0, checkins)) : null),
    [route, checkins],
  );

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded && !session) return <Skeleton className="h-[500px] w-full" />;

  if (!session) {
    return online ? (
      <EmptyState
        icon={<LogIn className="h-6 w-6" />}
        title="Sign in to start a trek"
        description="Your trek, check-ins and SOS are linked to your account so coordination can find you."
        action={
          <Link href="/login?next=/trek" className={buttonVariants()}>
            Sign in
          </Link>
        }
      />
    ) : (
      <EmptyState
        icon={<WifiOff className="h-6 w-6" />}
        title="Offline and not signed in"
        description="Sign in once with signal to use trek mode offline. The SOS page still works by SMS."
        action={
          <Link href="/sos" className={buttonVariants({ variant: "sos" })}>
            Open SOS
          </Link>
        }
      />
    );
  }

  if (!trek || !route) {
    return (
      <div className="space-y-4">
        <StartTrek
          routes={getRoutes()}
          initialRouteId={params.get("route") ?? undefined}
          disabled={!online || busy}
          onStart={(routeId) => run(() => startTrek(createClient(), session.userId, routeId))}
        />
        {!online && <p className="text-center text-sm text-caution">Starting a trek needs signal once. Everything after works offline.</p>}
        {error && <p role="alert" className="text-center text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const today = nepalDay.format(new Date());
  const startDay = trek.startedAt ? nepalDay.format(new Date(trek.startedAt)) : today;
  const dayNumber = dayIndex(startDay, today) + 1;
  const nights = sleepNights(checkins);
  const ladder = nights.map((night, i) => ({
    dayNumber: dayIndex(startDay, night.date) + 1,
    placeName: route.waypoints.find((w) => w.id === night.waypointId)?.name ?? "Sleep altitude",
    altitudeM: night.altM,
    gainM: night.altM - (i === 0 ? (route.waypoints[0]?.altM ?? night.altM) : nights[i - 1]!.altM),
  }));
  const next = latest ? nextWaypoint(route, latest) : (route.waypoints[1] ?? null);
  const here = latest ? nearestWaypoint(route, latest) : null;
  const upcoming = route.waypoints.slice(here ? here.index + 1 : 0);
  const weatherWaypoint = upcoming.find(isEligible) ?? null;
  const alerts = (trekLog?.alerts ?? []).filter((a) => !a.acknowledgedAt);

  return (
    <div className="space-y-6 pb-24">
      <TrekHeader routeName={route.name} dayNumber={dayNumber} />
      {demoMode && (
        <p className="rounded-[var(--radius-sm)] border border-info/40 bg-info/10 px-3 py-2 text-xs text-info">
          Demo mode: positions come from the /demo scenario, live GPS is paused.
        </p>
      )}

      <AltitudeHero
        altitudeM={latest?.altM ?? null}
        gainSinceLastNightM={ladder.at(-1)?.gainM}
        severity={ams?.level ?? "ok"}
      />
      <p className="text-xs text-text-muted">Keep Sathi open to record your track.</p>
      {gps === "denied" && (
        <p role="status" className="text-sm text-caution">
          Location is blocked. Allow location for Sathi so SOS and the map can use your position.
        </p>
      )}

      <AlertFeed alerts={alerts} onAcknowledge={(id) => {
        const alert = alerts.find((a) => a.id === id);
        if (alert) acknowledgeAlert(alert).catch(() => {});
      }} />

      {weatherWaypoint && <WeatherCard waypoint={weatherWaypoint} trekId={trek.id} />}

      <section className="space-y-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted">Map</h2>
        <Map route={route} resources={getResources()} position={latest ?? undefined} />
      </section>

      {next && (
        <NextWaypoint
          waypoint={next}
          distanceKm={latest ? haversineKm(latest, next) : null}
          altitudeDeltaM={latest?.altM != null ? next.altM - latest.altM : null}
        />
      )}

      <AltitudeLadder nights={ladder} />

      <Card className="space-y-3 border-accent/40 bg-surface-2/70 p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold">Evening check-in</h2>
        </div>
        <p className="text-sm text-text-muted">Four symptom questions and where you sleep tonight. Works offline.</p>
        <Button variant="primary" className="w-full" onClick={() => setCheckinOpen(true)}>
          Start check-in
        </Button>
      </Card>

      <ShareLinkCard shareToken={trek.shareToken} />

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button
          variant="ghost"
          className="text-text-muted hover:text-danger"
          disabled={!online || busy}
          onClick={() => {
            if (window.confirm("End this trek? Tracking stops and your family link shows it as completed.")) {
              run(() => endTrek(createClient(), trek.id, "completed"));
            }
          }}
        >
          <Flag className="mr-1.5 h-4 w-4" />
          End trek
        </Button>
        {!online && <span className="text-xs text-text-muted">Ending a trek needs signal</span>}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {checkinOpen && (
        <CheckinSheet
          route={route}
          trekId={trek.id}
          defaultSleepWaypointId={(here?.waypoint ?? next ?? route.waypoints[0]!).id}
          onClose={() => setCheckinOpen(false)}
        />
      )}
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
