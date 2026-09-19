import type { Alert, AmsResult } from "@/lib/types";

interface DeriveAlertsInput {
  ams: AmsResult;
  weather?: unknown;
  trekId: string;
  now: Date;
}

export function deriveAlerts({
  ams,
  trekId,
  now,
}: DeriveAlertsInput): Alert[] {
  return ams.alerts.map((alert) => ({
    id: crypto.randomUUID(),
    trekId,
    kind: alert.kind,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    actions: alert.actions,
    createdAt: now.toISOString(),
    acknowledgedAt: null,
    dedupeKey: alert.dedupeKey,
  }));
}
