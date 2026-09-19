import * as React from "react";
import type { Metadata } from "next";
import { getRoutes } from "@/lib/data";
import { RouteBrowserClient } from "@/components/trek/RouteBrowserClient";

export const metadata: Metadata = { title: "Routes" };

export default function RoutesPage() {
  const routes = getRoutes();
  const full = routes.filter((r) => r.hasFullData).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h1">Trekking routes</h1>
        <p className="text-text-muted">
          {full} of {routes.length} routes have full stage data today. The rest are previews.
        </p>
      </div>
      {/* useSearchParams needs a Suspense boundary. */}
      <React.Suspense fallback={null}>
        <RouteBrowserClient routes={routes} />
      </React.Suspense>
    </div>
  );
}
