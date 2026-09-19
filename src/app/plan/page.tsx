import * as React from "react";
import { getRoutes } from "@/lib/data";
import { RouteFinder } from "@/components/plan/RouteFinder";

export default function PlanPage() {
  const routes = getRoutes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Plan Your Trek</h1>
        <p className="text-text-muted text-base mt-1">
          Answer 4 quick preferences to receive personalized route recommendations matching your timeframe and fitness.
        </p>
      </div>

      <RouteFinder routes={routes} />
    </div>
  );
}
