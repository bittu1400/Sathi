"use client";

import * as React from "react";
import { CloudSnow } from "lucide-react";
import { Banner } from "../ui/banner";
import { Panel } from "../ui/panel";
import { Skeleton } from "../ui/skeleton";
import { formatAltitude } from "@/lib/format";
import { evaluateWeather, fetchForecast } from "@/lib/weather";
import { deriveAlerts } from "@/lib/alerts";
import { recordAlerts } from "@/lib/trek-log";
import { WEATHER_DISCLAIMER, weatherHeadline } from "@/lib/ams-copy";
import { weatherFixtureStore } from "@/lib/session";
import type { Forecast, WeatherVerdict, Waypoint } from "@/lib/types";

const NO_AMS = { level: "ok" as const, headline: "", actions: [], reasons: [], alerts: [] };

/** Go / caution / no-go for the next pass or high waypoint (SAFETY §4). */
export function WeatherCard({ waypoint, trekId }: { waypoint: Waypoint; trekId: string }) {
  const fixture = weatherFixtureStore.useValue();
  const [state, setState] = React.useState<{ verdict: WeatherVerdict; stale: boolean } | "loading" | "error">(
    "loading",
  );

  React.useEffect(() => {
    let cancelled = false;
    const source: Promise<Forecast> = fixture
      ? Promise.resolve(fixture)
      : fetchForecast({ lat: waypoint.lat, lng: waypoint.lng, elevationM: waypoint.altM });
    source
      .then((forecast) => {
        if (cancelled) return;
        const verdict = evaluateWeather(forecast, waypoint);
        setState({ verdict, stale: forecast.stale === true });
        const alerts = deriveAlerts({ ams: NO_AMS, weather: { verdict, waypoint }, trekId, now: new Date() });
        recordAlerts(trekId, alerts).catch(() => {});
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [fixture, waypoint, trekId]);

  if (state === "loading") return <Skeleton shape="panel" className="h-32" />;
  if (state === "error") {
    return (
      <Panel>
        <p className="flex items-center gap-2 text-text-muted">
          <CloudSnow className="size-4" aria-hidden /> No forecast for {waypoint.name} yet. It loads when you have signal.
        </p>
      </Panel>
    );
  }

  const { verdict, stale } = state;
  const severity = verdict.verdict === "no_go" ? "warning" : verdict.verdict === "caution" ? "caution" : "ok";
  return (
    <Banner
      severity={severity}
      headline={weatherHeadline(verdict.verdict, waypoint.name)}
      reasons={stale ? [...verdict.reasons, "Forecast is from the last time you had signal."] : verdict.reasons}
      disclaimer={WEATHER_DISCLAIMER}
    >
      <p className="text-small text-text-muted">
        Forecast for {waypoint.name} at {formatAltitude(waypoint.altM)}
      </p>
    </Banner>
  );
}
