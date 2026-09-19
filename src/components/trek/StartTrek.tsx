"use client";

import * as React from "react";
import { RouteSummary } from "@/lib/types";
import { Button } from "../ui/button";
import { Card, CardHeader, CardBody } from "../ui/card";
import { Badge } from "../ui/badge";
import { Mountain, ArrowRight, ShieldCheck } from "lucide-react";

export interface StartTrekProps {
  routes: RouteSummary[];
  initialRouteId?: string;
  disabled?: boolean;
  onStart: (routeId: string) => void;
}

export function StartTrek({ routes, initialRouteId, disabled, onStart }: StartTrekProps) {
  const startable = routes.filter((r) => r.hasFullData);
  const [selectedRouteId, setSelectedRouteId] = React.useState<string>(
    startable.find((r) => r.id === initialRouteId)?.id ?? startable[0]?.id ?? ""
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto">
          <Mountain className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Start New Trek Session</h1>
        <p className="text-sm text-text-muted">
          Select a route to activate offline position logging, altitude monitor, and emergency SOS tracking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-sm">1. Select Trekking Route</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {startable.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={`w-full p-3.5 rounded-[var(--radius-sm)] border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedRouteId === route.id
                    ? "bg-accent/15 border-accent text-text shadow-sm"
                    : "bg-surface-2 border-border text-text-muted hover:bg-surface-3 hover:text-text"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-sm text-text">{route.name}</h4>
                  <p className="text-xs text-text-muted">
                    {route.region} · {route.days[0]}–{route.days[1]} Days · Max {route.maxAltitudeM.toLocaleString()} m
                  </p>
                </div>
                <Badge variant="ok">Full Offline Data</Badge>
              </button>
            ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ok" />
            2. Safety & Emergency Contact Verification
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-text-muted leading-relaxed">
            In case of emergency SOS triggering, SMS notifications and GPS coordinates will be queued for transmission to rescue dispatchers and your registered emergency contact.
          </p>
        </CardBody>
      </Card>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={disabled || !selectedRouteId}
        onClick={() => onStart(selectedRouteId)}
      >
        Start Active Trek
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
