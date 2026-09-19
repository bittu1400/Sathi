import type { Alert, AmsResult, Waypoint, WeatherVerdict } from "@/lib/types";
import { WEATHER_NOGO_BODY, weatherHeadline } from "@/lib/ams-copy";

interface DeriveAlertsInput {
  ams: AmsResult;
  weather?: { verdict: WeatherVerdict; waypoint: Pick<Waypoint, "id" | "name"> };
  trekId: string;
  now: Date;
}

const nepalDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" });

export function deriveAlerts({
  ams,
  weather,
  trekId,
  now,
}: DeriveAlertsInput): Alert[] {
  const base = { trekId, createdAt: now.toISOString(), acknowledgedAt: null };
  const alerts: Alert[] = ams.alerts.map((alert) => ({
    id: crypto.randomUUID(),
    ...base,
    kind: alert.kind,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    actions: alert.actions,
    dedupeKey: alert.dedupeKey,
  }));

  if (weather && weather.verdict.verdict !== "go") {
    const noGo = weather.verdict.verdict === "no_go";
    const kind = noGo ? "weather_nogo" : "weather_warn";
    alerts.push({
      id: crypto.randomUUID(),
      ...base,
      kind,
      severity: noGo ? "warning" : "caution",
      title: weatherHeadline(weather.verdict.verdict, weather.waypoint.name),
      body: noGo ? WEATHER_NOGO_BODY : "",
      actions: weather.verdict.reasons,
      dedupeKey: `${kind}:${weather.waypoint.id}:${nepalDay.format(now)}`,
    });
  }

  return alerts;
}
