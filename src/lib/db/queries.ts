import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Alert,
  Checkin,
  Position,
  Profile,
  SosEvent,
  Trek,
  TrekStatus,
} from "@/lib/types";
import {
  toAlert,
  toCheckin,
  toPosition,
  toProfile,
  toSos,
  toTrek,
  type AlertRow,
  type CheckinRow,
  type PositionRow,
  type ProfileRow,
  type SosRow,
  type TrekRow,
} from "./map";

// Every query throws the Supabase error instead of returning empty data.
function must<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getProfile(sb: SupabaseClient, userId: string): Promise<Profile | null> {
  const row = must(await sb.from("profiles").select("*").eq("id", userId).maybeSingle<ProfileRow>());
  return row ? toProfile(row) : null;
}

export async function getActiveTrek(sb: SupabaseClient, userId: string): Promise<Trek | null> {
  const row = must(
    await sb
      .from("treks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle<TrekRow>(),
  );
  return row ? toTrek(row) : null;
}

export async function startTrek(sb: SupabaseClient, userId: string, routeId: string): Promise<Trek> {
  const row = must(
    await sb
      .from("treks")
      .insert({ user_id: userId, route_id: routeId, status: "active", started_at: new Date().toISOString() })
      .select("*")
      .single<TrekRow>(),
  );
  return toTrek(row);
}

export async function endTrek(
  sb: SupabaseClient,
  trekId: string,
  status: Extract<TrekStatus, "completed" | "aborted">,
): Promise<void> {
  must(await sb.from("treks").update({ status, ended_at: new Date().toISOString() }).eq("id", trekId));
}

export async function listPositions(sb: SupabaseClient, trekId: string, limit = 500): Promise<Position[]> {
  const rows = must(
    await sb
      .from("positions")
      .select("*")
      .eq("trek_id", trekId)
      .order("recorded_at", { ascending: true })
      .limit(limit)
      .returns<PositionRow[]>(),
  );
  return rows.map(toPosition);
}

export async function listCheckins(sb: SupabaseClient, trekId: string): Promise<Checkin[]> {
  const rows = must(
    await sb
      .from("checkins")
      .select("*")
      .eq("trek_id", trekId)
      .order("recorded_at", { ascending: true })
      .returns<CheckinRow[]>(),
  );
  return rows.map(toCheckin);
}

export async function listAlerts(sb: SupabaseClient, trekId: string): Promise<Alert[]> {
  const rows = must(
    await sb
      .from("alerts")
      .select("*")
      .eq("trek_id", trekId)
      .order("created_at", { ascending: false })
      .returns<AlertRow[]>(),
  );
  return rows.map(toAlert);
}

export interface SosWithContext extends SosEvent {
  trekkerName: string;
  routeId: string | null;
  emergencyContact: { name: string; phone: string } | null;
}

type SosJoinRow = SosRow & {
  trek: { route_id: string } | null;
  profile: {
    display_name: string;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  } | null;
};

export async function listSos(
  sb: SupabaseClient,
  opts: { unresolvedOnly?: boolean } = {},
): Promise<SosWithContext[]> {
  let query = sb
    .from("sos_events")
    .select(
      "*, trek:treks!sos_events_trek_id_fkey(route_id), profile:profiles!sos_events_user_id_fkey(display_name, emergency_contact_name, emergency_contact_phone)",
    )
    .order("received_at", { ascending: false })
    .limit(200);
  if (opts.unresolvedOnly) query = query.neq("status", "resolved");
  const rows = must(await query.returns<SosJoinRow[]>());
  return rows.map((r) => ({
    ...toSos(r),
    trekkerName: r.profile?.display_name ?? "Trekker",
    routeId: r.trek?.route_id ?? null,
    emergencyContact: r.profile?.emergency_contact_phone
      ? { name: r.profile.emergency_contact_name ?? "", phone: r.profile.emergency_contact_phone }
      : null,
  }));
}

export interface ActiveTrekLocation {
  trekId: string;
  userId: string;
  routeId: string;
  trekkerName: string;
  startedAt: string | null;
  position: Position | null;
}

export async function listActiveTreksWithLatestPosition(sb: SupabaseClient): Promise<ActiveTrekLocation[]> {
  const treks = must(
    await sb
      .from("treks")
      .select("id, user_id, route_id, started_at, profile:profiles(display_name)")
      .eq("status", "active")
      .returns<(Pick<TrekRow, "id" | "user_id" | "route_id" | "started_at"> & { profile: { display_name: string } | null })[]>(),
  );
  if (treks.length === 0) return [];
  const positions = must(
    await sb
      .from("latest_positions")
      .select("*")
      .in("trek_id", treks.map((t) => t.id))
      .returns<PositionRow[]>(),
  );
  const byTrek = new Map(positions.map((p) => [p.trek_id, toPosition(p)]));
  return treks.map((t) => ({
    trekId: t.id,
    userId: t.user_id,
    routeId: t.route_id,
    trekkerName: t.profile?.display_name ?? "Trekker",
    startedAt: t.started_at,
    position: byTrek.get(t.id) ?? null,
  }));
}

export async function ackSos(sb: SupabaseClient, sosId: string, coordinatorId: string): Promise<void> {
  must(
    await sb
      .from("sos_events")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString(), acknowledged_by: coordinatorId })
      .eq("id", sosId),
  );
}

/** Coordinator resolution, or a trekker marking their own SOS safe. */
export async function resolveSos(sb: SupabaseClient, sosId: string, note: string | null): Promise<void> {
  must(
    await sb
      .from("sos_events")
      .update({ status: "resolved", resolved_at: new Date().toISOString(), resolution_note: note })
      .eq("id", sosId),
  );
}
