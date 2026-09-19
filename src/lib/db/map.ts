import type {
  Alert,
  AlertKind,
  Checkin,
  Position,
  Profile,
  RedFlag,
  Role,
  Severity,
  SosCategory,
  SosChannel,
  SosEvent,
  SosStatus,
  Trek,
  TrekStatus,
} from "@/lib/types";

// Row shapes as stored in Postgres (snake_case). Only src/lib/db sees these.
export interface ProfileRow {
  id: string;
  display_name: string;
  role: Role;
  agency_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  fitness: Profile["fitness"];
  preferences: Profile["preferences"];
}

export interface TrekRow {
  id: string;
  user_id: string;
  route_id: string;
  status: TrekStatus;
  started_at: string | null;
  ended_at: string | null;
  share_token: string;
}

export interface PositionRow {
  id: string;
  trek_id: string;
  lat: number;
  lng: number;
  alt_m: number | null;
  accuracy_m: number | null;
  recorded_at: string;
  source: Position["source"];
}

export interface CheckinRow {
  id: string;
  trek_id: string;
  recorded_at: string;
  headache: Checkin["headache"];
  gi: Checkin["gi"];
  fatigue: Checkin["fatigue"];
  dizziness: Checkin["dizziness"];
  red_flags: RedFlag[] | null;
  sleep_waypoint_id: string | null;
  sleep_alt_m: number | null;
  lls: number;
}

export interface AlertRow {
  id: string;
  trek_id: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  body: string;
  actions: string[] | null;
  dedupe_key: string;
  created_at: string;
  acknowledged_at: string | null;
}

export interface SosRow {
  id: string;
  trek_id: string | null;
  user_id: string;
  lat: number | null;
  lng: number | null;
  alt_m: number | null;
  accuracy_m: number | null;
  category: SosCategory;
  note: string | null;
  last_checkin_lls: number | null;
  created_at: string;
  received_at: string | null;
  channel: SosChannel;
  status: SosStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  displayName: r.display_name,
  role: r.role,
  agencyId: r.agency_id,
  emergencyContactName: r.emergency_contact_name,
  emergencyContactPhone: r.emergency_contact_phone,
  fitness: r.fitness,
  preferences: r.preferences,
});

export const toTrek = (r: TrekRow): Trek => ({
  id: r.id,
  userId: r.user_id,
  routeId: r.route_id,
  status: r.status,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  shareToken: r.share_token,
});

export const toPosition = (r: PositionRow): Position => ({
  id: r.id,
  trekId: r.trek_id,
  lat: r.lat,
  lng: r.lng,
  altM: r.alt_m,
  accuracyM: r.accuracy_m,
  recordedAt: r.recorded_at,
  source: r.source,
});

export const toCheckin = (r: CheckinRow): Checkin => ({
  id: r.id,
  trekId: r.trek_id,
  recordedAt: r.recorded_at,
  headache: r.headache,
  gi: r.gi,
  fatigue: r.fatigue,
  dizziness: r.dizziness,
  redFlags: r.red_flags ?? [],
  sleepWaypointId: r.sleep_waypoint_id,
  sleepAltM: r.sleep_alt_m,
  lls: r.lls,
});

export const toAlert = (r: AlertRow): Alert => ({
  id: r.id,
  trekId: r.trek_id,
  kind: r.kind,
  severity: r.severity,
  title: r.title,
  body: r.body,
  actions: r.actions ?? [],
  createdAt: r.created_at,
  acknowledgedAt: r.acknowledged_at,
  dedupeKey: r.dedupe_key,
});

export const toSos = (r: SosRow): SosEvent => ({
  id: r.id,
  trekId: r.trek_id,
  userId: r.user_id,
  lat: r.lat,
  lng: r.lng,
  altM: r.alt_m,
  accuracyM: r.accuracy_m,
  category: r.category,
  note: r.note,
  lastCheckinLls: r.last_checkin_lls,
  createdAt: r.created_at,
  receivedAt: r.received_at,
  channel: r.channel,
  status: r.status,
  acknowledgedBy: r.acknowledged_by,
  acknowledgedAt: r.acknowledged_at,
  resolvedAt: r.resolved_at,
  resolutionNotes: r.resolution_note,
});

// Outbox rows (insert shape). The outbox is the only writer for these tables.
export const positionToRow = (p: Position): PositionRow => ({
  id: p.id,
  trek_id: p.trekId,
  lat: p.lat,
  lng: p.lng,
  alt_m: p.altM,
  accuracy_m: p.accuracyM,
  recorded_at: p.recordedAt,
  source: p.source,
});

// lls is a generated column: sending it makes the insert fail.
export const checkinToRow = (c: Checkin): Omit<CheckinRow, "lls"> => ({
  id: c.id,
  trek_id: c.trekId,
  recorded_at: c.recordedAt,
  headache: c.headache,
  gi: c.gi,
  fatigue: c.fatigue,
  dizziness: c.dizziness,
  red_flags: c.redFlags,
  sleep_waypoint_id: c.sleepWaypointId,
  sleep_alt_m: c.sleepAltM,
});

export const alertToRow = (a: Alert): AlertRow => ({
  id: a.id,
  trek_id: a.trekId,
  kind: a.kind,
  severity: a.severity,
  title: a.title,
  body: a.body,
  actions: a.actions,
  dedupe_key: a.dedupeKey,
  created_at: a.createdAt,
  acknowledged_at: a.acknowledgedAt,
});

// Server fills received_at; coordinator fields are never sent on insert.
export const sosToRow = (s: SosEvent) => ({
  id: s.id,
  trek_id: s.trekId,
  user_id: s.userId,
  lat: s.lat,
  lng: s.lng,
  alt_m: s.altM,
  accuracy_m: s.accuracyM,
  category: s.category,
  note: s.note,
  last_checkin_lls: s.lastCheckinLls,
  created_at: s.createdAt,
  channel: s.channel,
  status: s.status,
  resolved_at: s.resolvedAt,
  resolution_note: s.resolutionNotes,
});
