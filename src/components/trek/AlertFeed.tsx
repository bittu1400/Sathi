import * as React from "react";
import { Check } from "lucide-react";
import type { Alert } from "@/lib/types";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";

export interface AlertFeedProps {
  alerts: Alert[];
  /** Dismissing is reversible: the page wraps this in `runWithUndo`. */
  onDismiss?: (alert: Alert) => void;
  className?: string;
}

export function AlertFeed({ alerts, onDismiss, className }: AlertFeedProps) {
  if (alerts.length === 0) return null;
  const newest = [...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section className={className} aria-label="Safety alerts">
      <h2 className="mb-2 text-label text-text-muted">Alerts · {alerts.length}</h2>
      <div className="space-y-3">
        {newest.map((alert) => (
          <Banner
            key={alert.id}
            severity={alert.severity}
            headline={alert.title}
            reasons={[alert.body, ...alert.actions].filter(Boolean)}
            actions={
              <Button variant="secondary" onClick={() => onDismiss?.(alert)}>
                <Check className="size-4" aria-hidden /> Got it
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
}
