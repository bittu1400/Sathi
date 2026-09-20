import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPin, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCoords, formatNepalTime } from "@/lib/format";
import { getRoute } from "@/lib/data";
import { nearestWaypoint } from "@/lib/geo";
import type { RouteDetail } from "@/lib/types";
import { SOS_DISCLAIMER } from "@/lib/ams-copy";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Panel } from "@/components/ui/panel";
import { Readout } from "@/components/ui/readout";
import { Status } from "@/components/ui/status";
import { Map } from "@/components/map/Map";
import { AutoRefresh, LiveAgo } from "./live";

export const dynamic = "force-dynamic";

// Robots directive to prevent search indexing per SPEC §9.3
export const metadata: Metadata = {
  title: "Live trek share",
  description: "Live, privacy-safe family share tracker for Himalayan trekkers.",
  robots: { index: false, follow: false },
};

interface SharedTrekResult {
  display_name: string;
  route_id: string;
  status: string;
  started_at: string;
  latest_position: {
    lat: number;
    lng: number;
    alt_m: number | null;
    accuracy_m: number | null;
    recorded_at: string;
  } | null;
  latest_sleep_alt_m: number | null;
  open_sos: boolean;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="border-b border-line px-4 md:px-6">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between">
          <Logo />
          <span className="text-label text-text-muted">Live trek share</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">{children}</div>
    </div>
  );
}

export default async function FamilySharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // The privacy-preserving Postgres RPC: rounded position, no symptoms.
  const { data, error } = await supabase.rpc("get_shared_trek", { token });
  const trek: SharedTrekResult | null = data && data.length > 0 ? data[0] : null;

  if (error) {
    return (
      <Shell>
        <AutoRefresh seconds={15} />
        <Panel className="space-y-2">
          <h1 className="text-h1">Couldn&apos;t load this trek</h1>
          <p className="text-text-muted">This is a connection problem, not a bad link. Trying again in a few seconds.</p>
        </Panel>
      </Shell>
    );
  }

  if (!trek) {
    return (
      <Shell>
        <Panel className="space-y-3">
          <Compass className="size-6 text-text-muted" aria-hidden />
          <h1 className="text-h1">This link is invalid or was turned off</h1>
          <p className="text-text-muted">Ask the trekker for their current link.</p>
          <Button asChild variant="secondary">
            <Link href="/">About Sathi</Link>
          </Button>
        </Panel>
      </Shell>
    );
  }

  const pos = trek.latest_position;
  const route = getRoute(trek.route_id);
  const detail = route && "waypoints" in route ? (route as RouteDetail) : null;
  const near = pos && detail ? nearestWaypoint(detail, pos).waypoint.name : null;

  return (
    <Shell>
      <AutoRefresh />

      {trek.open_sos && (
        <Banner
          severity="sos"
          headline="An SOS was sent"
          reasons={["Coordination has received it. Whether they have acknowledged it isn't shown here."]}
          disclaimer={SOS_DISCLAIMER}
        />
      )}

      <Panel>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-h1">{trek.display_name}</h1>
              <p className="text-text-muted">{route?.name ?? trek.route_id}</p>
            </div>
            {trek.open_sos ? (
              <Status tone="sos" icon={<ShieldAlert aria-hidden />}>
                SOS sent
              </Status>
            ) : trek.status === "active" ? (
              <Status tone="ok">On trail</Status>
            ) : (
              <Status>Trek completed</Status>
            )}
          </div>

          <p className="text-body">
            {pos ? (
              <>
                Last seen {near ? `near ${near}, ` : ""}
                <LiveAgo iso={pos.recorded_at} />
                <span className="text-text-muted"> · {formatNepalTime(pos.recorded_at)} NPT</span>
              </>
            ) : (
              <span className="text-text-muted">No position received yet.</span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Readout size="md" label="Altitude" value={pos?.alt_m ? pos.alt_m.toLocaleString("en-US") : "—"} unit={pos?.alt_m ? "m" : undefined} />
            <Readout size="md" label="Last sleep" value={trek.latest_sleep_alt_m ? trek.latest_sleep_alt_m.toLocaleString("en-US") : "—"} unit={trek.latest_sleep_alt_m ? "m" : undefined} />
          </div>

          {pos && (
            <p className="flex items-center gap-2 text-small text-text-muted">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
              <span>
                Approximate position <span className="font-mono text-text">{formatCoords(pos.lat, pos.lng)}</span>, rounded to about 100 m for privacy.
              </span>
            </p>
          )}
        </div>
      </Panel>

      {detail && pos && <Map route={detail} position={pos} />}

      <Panel title="Privacy">
        <div className="grid gap-4 text-body sm:grid-cols-2">
          <div>
            <p className="mb-1 text-label text-text-muted">Family sees</p>
            <ul className="list-inside list-disc space-y-1">
              <li>The route and a rounded position</li>
              <li>Altitude and last sleeping altitude</li>
              <li>Whether an SOS is open</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 text-label text-text-muted">Family never sees</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Symptoms or check-in answers</li>
              <li>Exact coordinates</li>
              <li>Phone numbers or contacts</li>
            </ul>
          </div>
        </div>
      </Panel>
    </Shell>
  );
}
