import * as React from "react";
import { LiveConnectivityPill } from "../live-connectivity";
import { Badge } from "../ui/badge";

export interface TrekHeaderProps {
  routeName: string;
  dayNumber: number;
  status?: string;
}

export function TrekHeader({ routeName, dayNumber, status = "active" }: TrekHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-text">{routeName}</h2>
          <Badge variant="ok">{status.toUpperCase()}</Badge>
        </div>
        <p className="text-xs font-mono text-accent font-semibold">
          Day {dayNumber}
        </p>
      </div>

      <LiveConnectivityPill />
    </div>
  );
}
