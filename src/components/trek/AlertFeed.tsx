import * as React from "react";
import { Alert } from "@/lib/types";
import { SeverityBanner } from "../ui/severity-banner";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import { cn } from "cn";

export interface AlertFeedProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  className?: string;
}

export function AlertFeed({ alerts, onAcknowledge, className }: AlertFeedProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
        Active Safety Alerts ({alerts.length})
      </h3>
      {alerts.map((alert) => (
        <SeverityBanner
          key={alert.id}
          severity={alert.severity}
          headline={alert.title}
          reasons={[alert.body]}
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAcknowledge?.(alert.id)}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Acknowledge
            </Button>
          }
        />
      ))}
    </div>
  );
}
