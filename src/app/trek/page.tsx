"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn, WifiOff } from "lucide-react";
import { getRoute, getRoutes, getResources } from "@/lib/data";
import type { Alert, RouteDetail } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { runWithUndo } from "@/components/ui/use-undo";
import { TodayPanel } from "@/components/trek/TodayPanel";
import { isCheckinDue } from "@/components/trek/checkin-due";

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
  const [endOpen, setEndOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState<Set<string>>(new Set());

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
  // A phone showing a /demo trek (scripted positions) joins demo mode too: no venue GPS in the track or the SOS.
  const lastSource = log?.positions.at(-1)?.source;
  React.useEffect(() => {
    if (lastSource === "demo" && demoModeStore.get() === null) demoModeStore.set(1);
  }, [lastSource]);
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
        icon={<LogIn className="size-6 text-text-muted" />}
        title="Sign in to start a trek"
        description="Your trek, check-ins and SOS are linked to your account so coordination can find you."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/login?next=/trek">Sign in</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/routes">Browse routes</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/sos">SOS</Link>
            </Button>
          </div>
        }
      />
    ) : (
      <EmptyState
        icon={<WifiOff className="size-6 text-text-muted" />}
        title="Offline and not signed in"
        description="Sign in once with signal to use trek mode offline. The SOS page still works by SMS."
        action={
          <Button asChild variant="sos">
            <Link href="/sos">Open SOS</Link>
          </Button>
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
          disabledReason={!online ? "Starting a trek needs signal once. Everything after works offline." : undefined}
          contactName={session.emergencyContactName}
          contactPhone={session.emergencyContactPhone}
          onStart={(routeId) => run(() => startTrek(createClient(), session.userId, routeId))}
        />
        {error && (
          <p role="alert" className="text-center text-body text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  const nowDate = new Date();
  const today = nepalDay.format(nowDate);
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
  const alerts = (trekLog?.alerts ?? []).filter((a) => !a.acknowledgedAt && !hidden.has(a.id));
  const lastCheckinAt = checkins.at(-1)?.recordedAt ?? null;
  const due = isCheckinDue(checkins.map((c) => c.recordedAt), nowDate);

  // Dismiss hides the alert at once and syncs the acknowledgement after 8 s unless undone.
  const dismiss = (alert: Alert) =>
    runWithUndo({
      apply: () => setHidden((h) => new Set(h).add(alert.id)),
      revert: () =>
        setHidden((h) => {
          const next = new Set(h);
          next.delete(alert.id);
          return next;
        }),
      commit: () => acknowledgeAlert(alert).catch(() => toast.error("Couldn't sync. It will retry when you're online.")),
      message: "Alert dismissed",
    });

  return (
    <div className="space-y-6 pb-16">
      <TrekHeader
        routeName={route.name}
        dayNumber={dayNumber}
        onEnd={() => setEndOpen(true)}
        endDisabled={!online || busy}
        endHint={!online ? "Ending a trek needs signal." : undefined}
      />
      {demoMode && (
        <p className="rounded-[var(--radius)] border border-accent/40 bg-accent-bg px-3 py-2 text-small text-accent">
          Demo mode: positions come from the /demo scenario, live GPS is paused.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TodayPanel ams={ams} lastCheckinAt={lastCheckinAt} due={due} onCheckin={() => setCheckinOpen(true)} />
          <AltitudeHero
            altitudeM={latest?.altM ?? null}
            gainSinceLastNightM={ladder.at(-1)?.gainM}
            updatedAt={latest?.recordedAt}
            accuracyM={latest?.accuracyM}
          />
          {gps === "denied" && (
            <p role="status" className="text-body text-caution">
              Location is blocked. Allow location for Sathi so SOS and the map can use your position.
            </p>
          )}
          <p className="text-small text-text-muted">Keep Sathi open to record your track.</p>
          {next && (
            <NextWaypoint
              waypoint={next}
              distanceKm={latest ? haversineKm(latest, next) : null}
              altitudeDeltaM={latest?.altM != null ? next.altM - latest.altM : null}
            />
          )}
          <AlertFeed alerts={alerts} onDismiss={dismiss} />
          {weatherWaypoint && <WeatherCard waypoint={weatherWaypoint} trekId={trek.id} />}
        </div>

        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-label text-text-muted">Map</h2>
            <Map route={route} resources={getResources()} position={latest ?? undefined} />
          </section>
          <AltitudeLadder nights={ladder} />
          <ShareLinkCard shareToken={trek.shareToken} />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      )}

      {/* Evening check-in due: sticky above the tab bar, right 88 px left free for the SOS button. */}
      {due && !checkinOpen && (
        <div className="fixed bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] left-4 right-[88px] z-[var(--z-sticky)] lg:hidden">
          <Button size="lg" className="w-full" onClick={() => setCheckinOpen(true)}>
            Evening check-in due
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        title="End this trek?"
        body="Tracking stops and your family link shows the trek as completed."
        confirmLabel="End trek"
        tone="danger"
        onConfirm={() => run(() => endTrek(createClient(), trek.id, "completed"))}
      />

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
