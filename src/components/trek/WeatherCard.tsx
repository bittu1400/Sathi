"use client";

import * as React from "react";
import { CloudSnow } from "lucide-react";
import { SeverityBanner } from "../ui/severity-banner";
import { evaluateWeather, fetchForecast } from "@/lib/weather";
import { deriveAlerts } from "@/lib/alerts";
import { recordAlerts } from "@/lib/trek-log";
import { WEATHER_DISCLAIMER, weatherHeadline } from "@/lib/ams-copy";
import { createLocalStore } from "@/lib/local-store";
import type { Forecast, WeatherVerdict, Waypoint } from "@/lib/types";

/** /demo can inject a storm forecast (C-07); real devices use Open-Meteo. */
export const weatherFixtureStore = createLocalStore<Forecast>("sathiWeatherFixture");

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

  if (state === "loading") return null;
  if (state === "error") {
    return (
      <p className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface p-4 text-sm text-text-muted">
        <CloudSnow className="h-4 w-4" /> No forecast for {waypoint.name} yet. It loads when you have signal.
      </p>
    );
  }

  const { verdict, stale } = state;
  const severity = verdict.verdict === "no_go" ? "warning" : verdict.verdict === "caution" ? "caution" : "info";
  return (
    <SeverityBanner
      severity={severity}
      headline={weatherHeadline(verdict.verdict, waypoint.name)}
      reasons={stale ? [...verdict.reasons, "Forecast is from the last time you had signal."] : verdict.reasons}
      disclaimer={WEATHER_DISCLAIMER}
    />
  );
}
