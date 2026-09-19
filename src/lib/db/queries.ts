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

// RLS turns a forbidden update into "0 rows, no error"; treat that as a failure.
function updatedOne(result: { data: unknown[] | null; error: { message: string } | null }) {
  if (must(result)?.length !== 1) throw new Error("Not allowed, or the SOS no longer exists.");
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
  updatedOne(
    await sb
      .from("sos_events")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString(), acknowledged_by: coordinatorId })
      .eq("id", sosId)
      .select("id"),
  );
}

/** Coordinator resolution, or a trekker marking their own SOS safe. */
export async function resolveSos(sb: SupabaseClient, sosId: string, note: string | null): Promise<void> {
  updatedOne(
    await sb
      .from("sos_events")
      .update({ status: "resolved", resolved_at: new Date().toISOString(), resolution_note: note })
      .eq("id", sosId)
      .select("id"),
  );
}

/** Alerts created in the last `hours` across every trek the caller can see. */
export async function countRecentAlerts(sb: SupabaseClient, hours = 24): Promise<number> {
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { count, error } = await sb
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export interface FleetTrekker extends ActiveTrekLocation {
  lastCheckin: Checkin | null;
  openAlerts: number;
  emergencyContact: { name: string; phone: string } | null;
}

/**
 * Active treks the caller may see (RLS: an agency admin sees their agency's trekkers)
 * with last check-in, unacknowledged alert count and emergency contact. 4 queries, no N+1.
 */
export async function listFleet(sb: SupabaseClient): Promise<FleetTrekker[]> {
  const treks = await listActiveTreksWithLatestPosition(sb);
  if (treks.length === 0) return [];
  const trekIds = treks.map((t) => t.trekId);
  const [checkins, alerts, profiles] = await Promise.all([
    sb.from("checkins").select("*").in("trek_id", trekIds).order("recorded_at", { ascending: false }).limit(500).returns<CheckinRow[]>(),
    sb.from("alerts").select("trek_id").in("trek_id", trekIds).is("acknowledged_at", null).returns<{ trek_id: string }[]>(),
    sb
      .from("profiles")
      .select("id, emergency_contact_name, emergency_contact_phone")
      .in("id", treks.map((t) => t.userId))
      .returns<Pick<ProfileRow, "id" | "emergency_contact_name" | "emergency_contact_phone">[]>(),
  ]);
  const lastCheckin = new Map<string, Checkin>();
  for (const row of must(checkins)) if (!lastCheckin.has(row.trek_id)) lastCheckin.set(row.trek_id, toCheckin(row));
  const alertCount = new Map<string, number>();
  for (const a of must(alerts)) alertCount.set(a.trek_id, (alertCount.get(a.trek_id) ?? 0) + 1);
  const contact = new Map(must(profiles).map((p) => [p.id, p]));
  return treks.map((t) => {
    const p = contact.get(t.userId);
    return {
      ...t,
      lastCheckin: lastCheckin.get(t.trekId) ?? null,
      openAlerts: alertCount.get(t.trekId) ?? 0,
      emergencyContact: p?.emergency_contact_phone
        ? { name: p.emergency_contact_name ?? "", phone: p.emergency_contact_phone }
        : null,
    };
  });
}

export async function getAgencyName(sb: SupabaseClient, agencyId: string): Promise<string | null> {
  const row = must(await sb.from("agencies").select("name").eq("id", agencyId).maybeSingle<{ name: string }>());
  return row?.name ?? null;
}
