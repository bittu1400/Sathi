import * as React from "react";
import type { Metadata } from "next";
import { getRoutes } from "@/lib/data";
import { RouteFinder } from "@/components/plan/RouteFinder";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  const routes = getRoutes();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h1">Plan your trek</h1>
        <p className="text-text-muted">Four preferences, and the routes that fit best come first.</p>
      </div>
      {/* useSearchParams needs a Suspense boundary. */}
      <React.Suspense fallback={null}>
        <RouteFinder routes={routes} />
      </React.Suspense>
    </div>
  );
}
