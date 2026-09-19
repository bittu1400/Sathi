import * as React from "react";
import { getRoutes } from "@/lib/data";
import { RouteBrowserClient } from "@/components/trek/RouteBrowserClient";

export default function RoutesPage() {
  const routes = getRoutes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Trekking Routes</h1>
        <p className="text-text-muted text-base mt-1">
          Explore high-altitude trails in Nepal with offline map packs, AMS guidance, and safety intelligence.
        </p>
      </div>

      <RouteBrowserClient routes={routes} />
    </div>
  );
}
