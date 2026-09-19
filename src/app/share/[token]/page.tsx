import React from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatAltitude, formatNepalTime } from "@/lib/format";
import { getRoute } from "@/lib/data";
import { TopoBackground } from "@/components/ui/topo-background";
import {
  Shield,
  MapPin,
  Clock,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Compass,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Robots directive to prevent search indexing per SPEC §9.3
export const metadata: Metadata = {
  title: "Sathi · Family Trek Tracker",
  description: "Live, privacy-safe family share tracker for Himalayan trekkers.",
  robots: {
    index: false,
    follow: false,
  },
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

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export default async function FamilySharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Call the privacy-preserving Postgres RPC
  const { data, error } = await supabase.rpc("get_shared_trek", {
    token,
  });

  const trek: SharedTrekResult | null =
    data && data.length > 0 ? data[0] : null;

  if (error || !trek) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-surface shadow-xl space-y-4">
          <div className="h-12 w-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto">
            <Compass className="h-6 w-6 text-text-muted" />
          </div>
          <h1 className="text-xl font-bold text-text">
            Share Link Not Found
          </h1>
          <p className="text-sm text-text-muted">
            This tracking link may have expired or is invalid. Please confirm with your trekker for the latest live link.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-accent text-accent-ink text-xs font-semibold"
          >
            Return to Sathi Home
          </Link>
        </div>
      </main>
    );
  }

  const pos = trek.latest_position;
  const isEmergency = trek.open_sos;

  return (
    <main className="min-h-screen bg-bg text-text flex flex-col">
      {/* 60 s auto-refresh; React hoists this <meta> into <head>. */}
      <meta httpEquiv="refresh" content="60" />

      {/* Top Header */}
      <header className="h-14 border-b border-border bg-surface/60 backdrop-blur px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <span className="font-bold text-sm tracking-tight text-text">
            Sathi
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-text-muted font-mono">
            Family Share
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>Auto-refreshes every 60s</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Emergency Alert Banner if open SOS */}
        {isEmergency && (
          <div className="p-4 rounded-xl bg-sos/15 border-2 border-sos/60 text-sos space-y-1.5 animate-pulse motion-reduce:animate-none">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <AlertTriangle className="h-5 w-5 text-sos" />
              <span>EMERGENCY SOS ACTIVE</span>
            </div>
            <p className="text-xs text-sos">
              An emergency distress signal was initiated. Himalayan Rescue Association coordination and rescue authorities have been alerted with coordinates.
            </p>
          </div>
        )}

        {/* Trekker Status Hero Card */}
        <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-xl overflow-hidden">
          <TopoBackground className="text-accent/15" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Himalayan Expedition Track
                </span>
                <h1 className="text-2xl font-bold text-text">
                  {trek.display_name}
                </h1>
                <p className="text-xs text-text-muted capitalize">
                  Route: {getRoute(trek.route_id)?.name ?? trek.route_id}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {isEmergency ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sos/20 text-sos border border-sos/40">
                    <span className="h-2 w-2 rounded-full bg-sos animate-ping motion-reduce:animate-none" />
                    SOS Active
                  </span>
                ) : trek.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-ok/20 text-ok border border-ok/30">
                    <span className="h-2 w-2 rounded-full bg-ok" />
                    On Trail
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-2 text-text-muted">
                    Trek Completed
                  </span>
                )}
              </div>
            </div>

            {/* Telemetry Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-surface-2/30 border border-border">
                <span className="text-[10px] uppercase font-mono text-text-muted block">
                  Current Altitude
                </span>
                <span className="text-xl font-bold font-mono text-text">
                  {pos?.alt_m ? formatAltitude(pos.alt_m) : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-2/30 border border-border">
                <span className="text-[10px] uppercase font-mono text-text-muted block">
                  Last Sleep Camp
                </span>
                <span className="text-xl font-bold font-mono text-text">
                  {trek.latest_sleep_alt_m
                    ? formatAltitude(trek.latest_sleep_alt_m)
                    : "—"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-surface-2/30 border border-border">
                <span className="text-[10px] uppercase font-mono text-text-muted block">
                  Last Signal Recorded
                </span>
                <span className="text-sm font-semibold font-mono text-text flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  {pos?.recorded_at ? timeAgo(pos.recorded_at) : "Pending"}
                </span>
                {pos?.recorded_at && (
                  <span className="text-[10px] font-mono text-text-muted block mt-0.5">
                    {formatNepalTime(pos.recorded_at)} NPT
                  </span>
                )}
              </div>
            </div>

            {/* Approximate Coordinate Location Notice */}
            {pos && (
              <div className="p-3 rounded-xl bg-surface-2/20 border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-text-muted">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>
                    Approximate Location:{" "}
                    <span className="font-mono text-text font-medium">
                      {pos.lat.toFixed(3)}°N, {pos.lng.toFixed(3)}°E
                    </span>
                  </span>
                </div>
                <span className="text-[10px] text-text-muted/80 italic hidden sm:inline">
                  (Rounded to ~100m for privacy)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Safety & Peace of Mind Explainer Card */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <HeartHandshake className="h-4 w-4 text-accent" />
            <h3>How Sathi Protects Your Loved One</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs text-text-muted">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-ok shrink-0 mt-0.5" />
              <span>
                <strong>Offline-First Monitoring:</strong> Altitude gain and medical symptoms are analyzed directly on the device even when there is zero cellular signal.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-ok shrink-0 mt-0.5" />
              <span>
                <strong>Dual-Path SOS:</strong> If emergency help is needed, distress messages transmit both via online sync and automatic SMS fallback with exact GPS coordinates.
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
