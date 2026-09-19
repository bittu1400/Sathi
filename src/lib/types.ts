// ---------- Static data (src/data, bundled) ----------
<<<<<<< HEAD
export type Terrain = 'river_valley' | 'forest' | 'alpine' | 'ridge' | 'glacier' | 'cultural';
export type Difficulty = 'easy' | 'moderate' | 'strenuous' | 'extreme';
export type Season = 'spring' | 'monsoon' | 'autumn' | 'winter';

export interface RouteSummary {
  id: string;                 // 'ebc' | 'annapurna-circuit' | 'poon-hill' | 'langtang' | 'manaslu' | 'gokyo'
  name: string;
  region: string;             // 'Khumbu', 'Annapurna', …
  summary: string;            // 1–2 sentences
  difficulty: Difficulty;
  days: [min: number, max: number];
  maxAltitudeM: number;
  startPoint: string;         // 'Lukla'
  terrain: Terrain[];
  permits: string[];          // ['Sagarmatha National Park', 'Khumbu Pasang Lhamu Rural Municipality']
  bestSeasons: Season[];
  heroImage: string;          // '/images/routes/ebc.webp'
  hasFullData: boolean;       // true → RouteDetail + tiles exist
}

export type WaypointKind = 'trailhead' | 'village' | 'pass' | 'viewpoint' | 'basecamp';
export type Signal = 'none' | 'weak' | 'good' | 'unknown';

export interface Waypoint {
  id: string;                 // 'ebc-lobuche'
  name: string;
  lat: number; lng: number;
=======
export type Terrain =
  | "river_valley"
  | "forest"
  | "alpine"
  | "ridge"
  | "glacier"
  | "cultural";
export type Difficulty = "easy" | "moderate" | "strenuous" | "extreme";
export type Season = "spring" | "monsoon" | "autumn" | "winter";

export interface RouteSummary {
  id: string;
  name: string;
  region: string;
  summary: string;
  difficulty: Difficulty;
  days: [min: number, max: number];
  maxAltitudeM: number;
  startPoint: string;
  terrain: Terrain[];
  permits: string[];
  bestSeasons: Season[];
  heroImage: string;
  hasFullData: boolean;
}

export type WaypointKind =
  | "trailhead"
  | "village"
  | "pass"
  | "viewpoint"
  | "basecamp";
export type Signal = "none" | "weak" | "good" | "unknown";

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
>>>>>>> 41ce28c (feat(types): import B-01 shared types contract and database schema)
  altM: number;
  kind: WaypointKind;
  hasTeahouse: boolean;
  signal: Signal;
  notes?: string;
}

export interface Stage {
<<<<<<< HEAD
  day: number;                // 1-based
  fromId: string; toId: string;   // Waypoint ids
  distanceKm: number;
  ascentM: number; descentM: number;
=======
  day: number;
  fromId: string;
  toId: string;
  distanceKm: number;
  ascentM: number;
  descentM: number;
>>>>>>> 41ce28c (feat(types): import B-01 shared types contract and database schema)
  hours: number;
  sleepAltM: number;
  isAcclimatization: boolean;
}

export interface RouteDetail extends RouteSummary {
  bbox: [west: number, south: number, east: number, north: number];
<<<<<<< HEAD
  line: GeoJSON.LineString;   // [lng, lat] pairs, 50–300 points
  waypoints: Waypoint[];      // ordered along the trail
  stages: Stage[];
  hazards: string[];
  tilesUrl: string;           // Supabase Storage public URL of the .pmtiles
=======
  line: GeoJSON.LineString;
  waypoints: Waypoint[];
  stages: Stage[];
  hazards: string[];
  tilesUrl: string;
>>>>>>> 41ce28c (feat(types): import B-01 shared types contract and database schema)
  tilesBytes: number;
}

export type ResourceKind =
<<<<<<< HEAD
  | 'hra_post' | 'hospital' | 'health_post' | 'heli_operator'
  | 'helipad' | 'police' | 'embassy' | 'rescue_org';
=======
  | "hra_post"
  | "hospital"
  | "health_post"
  | "heli_operator"
  | "helipad"
  | "police"
  | "embassy"
  | "rescue_org";
>>>>>>> 41ce28c (feat(types): import B-01 shared types contract and database schema)

export interface Resource {
  id: string;
  name: string;
  kind: ResourceKind;
<<<<<<< HEAD
  lat: number; lng: number;
  altM?: number;
  phone?: string;             // E.164, e.g. '+97714xxxxxx'. Omit if unverified.
  region: string;
  seasonal?: string;          // 'Open Mar–May, Sep–Nov'
  notes?: string;
  verified: { source: string; date: string } | null;   // null → show "unverified" badge
}

// ---------- Dynamic data (Supabase) ----------
export type Role = 'trekker' | 'coordinator' | 'agency_admin';
export type TrekStatus = 'planned' | 'active' | 'completed' | 'aborted';
export type Severity = 'info' | 'caution' | 'warning' | 'danger';
export type AlertKind =
  | 'ams_gain' | 'ams_rest_day' | 'ams_symptoms' | 'ams_red_flag'
  | 'weather_warn' | 'weather_nogo';
export type SosStatus = 'open' | 'acknowledged' | 'resolved';
export type SosCategory = 'altitude_illness' | 'injury' | 'lost' | 'weather' | 'other';
export type SosChannel = 'online' | 'queued' | 'sms';
export type PassTier = 'pass7' | 'pass14' | 'pass30' | 'annual';
export type PassStatus = 'pending' | 'purchased' | 'active' | 'expired';

export interface Profile {
  id: string; displayName: string; role: Role; agencyId: string | null;
  emergencyContactName: string | null; emergencyContactPhone: string | null;
  fitness: 'low' | 'medium' | 'high' | null;
  preferences: { terrain: Terrain[]; maxDays?: number; maxAltitudeM?: number } | null;
}

export interface Trek {
  id: string; userId: string; routeId: string; status: TrekStatus;
  startedAt: string | null; endedAt: string | null;
  shareToken: string;                          // 32-char random, created with the trek
}

export interface Position {
  id: string; trekId: string;
  lat: number; lng: number; altM: number | null; accuracyM: number | null;
  recordedAt: string; source: 'gps' | 'demo';
}

export type RedFlag = 'confusion' | 'ataxia' | 'breathless_at_rest' | 'wet_cough' | 'severe_headache_unrelieved';

export interface Checkin {
  id: string; trekId: string; recordedAt: string;
  headache: 0 | 1 | 2 | 3; gi: 0 | 1 | 2 | 3; fatigue: 0 | 1 | 2 | 3; dizziness: 0 | 1 | 2 | 3;
  redFlags: RedFlag[];
  sleepWaypointId: string | null;            // "tonight I sleep at"
  sleepAltM: number | null;
  lls: number;                               // computed = headache+gi+fatigue+dizziness
}

export interface Alert {
  id: string; trekId: string; kind: AlertKind; severity: Severity;
  title: string; body: string; actions: string[];
  createdAt: string; acknowledgedAt: string | null;
  dedupeKey: string;                          // e.g. 'ams_gain:2026-10-12' – one alert per key
}

export interface SosEvent {
  id: string;                                 // client-generated UUID (idempotency key)
  trekId: string | null; userId: string;
  lat: number | null; lng: number | null; altM: number | null; accuracyM: number | null;
  category: SosCategory; note: string | null;
  lastCheckinLls: number | null;
  createdAt: string;                          // device time of the tap
  receivedAt: string | null;                  // server time (default now())
  channel: SosChannel;
  status: SosStatus;
  acknowledgedBy: string | null; acknowledgedAt: string | null;
  resolvedAt: string | null; resolutionNotes: string | null;
=======
  lat: number;
  lng: number;
  altM?: number;
  phone?: string;
  region: string;
  seasonal?: string;
  notes?: string;
  verified: { source: string; date: string } | null;
}

// ---------- Dynamic data (Supabase) ----------
export type Role = "trekker" | "coordinator" | "agency_admin";
export type TrekStatus = "planned" | "active" | "completed" | "aborted";
export type Severity = "info" | "caution" | "warning" | "danger";
export type AlertKind =
  | "ams_gain"
  | "ams_rest_day"
  | "ams_symptoms"
  | "ams_red_flag"
  | "weather_warn"
  | "weather_nogo";
export type SosStatus = "open" | "acknowledged" | "resolved";
export type SosCategory =
  | "altitude_illness"
  | "injury"
  | "lost"
  | "weather"
  | "other";
export type SosChannel = "online" | "queued" | "sms";
export type PassTier = "pass7" | "pass14" | "pass30" | "annual";
export type PassStatus = "pending" | "purchased" | "active" | "expired";

export interface Profile {
  id: string;
  displayName: string;
  role: Role;
  agencyId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  fitness: "low" | "medium" | "high" | null;
  preferences: {
    terrain: Terrain[];
    maxDays?: number;
    maxAltitudeM?: number;
  } | null;
}

export interface Trek {
  id: string;
  userId: string;
  routeId: string;
  status: TrekStatus;
  startedAt: string | null;
  endedAt: string | null;
  shareToken: string;
}

export interface Position {
  id: string;
  trekId: string;
  lat: number;
  lng: number;
  altM: number | null;
  accuracyM: number | null;
  recordedAt: string;
  source: "gps" | "demo";
}

export type RedFlag =
  | "confusion"
  | "ataxia"
  | "breathless_at_rest"
  | "wet_cough"
  | "severe_headache_unrelieved";

export interface Checkin {
  id: string;
  trekId: string;
  recordedAt: string;
  headache: 0 | 1 | 2 | 3;
  gi: 0 | 1 | 2 | 3;
  fatigue: 0 | 1 | 2 | 3;
  dizziness: 0 | 1 | 2 | 3;
  redFlags: RedFlag[];
  sleepWaypointId: string | null;
  sleepAltM: number | null;
  lls: number;
}

export interface Alert {
  id: string;
  trekId: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  body: string;
  actions: string[];
  createdAt: string;
  acknowledgedAt: string | null;
  dedupeKey: string;
}

export interface SosEvent {
  id: string;
  trekId: string | null;
  userId: string;
  lat: number | null;
  lng: number | null;
  altM: number | null;
  accuracyM: number | null;
  category: SosCategory;
  note: string | null;
  lastCheckinLls: number | null;
  createdAt: string;
  receivedAt: string | null;
  channel: SosChannel;
  status: SosStatus;
  acknowledgedBy: string | null;
}

export interface Pass {
  id: string;
  userId: string;
  tier: PassTier;
  status: PassStatus;
  days: number;
  provider: "esewa" | "mock";
  paymentRef: string;
  amountNpr: number;
  activatedAt: string | null;
  expiresAt: string | null;
}

// ---------- Engine I/O (pure lib) ----------
export interface AmsInput {
  sleepAltitudes: { date: string; altM: number }[];
  latest: Pick<
    Checkin,
    "headache" | "gi" | "fatigue" | "dizziness" | "redFlags" | "recordedAt"
  > | null;
  previous: AmsInput["latest"];
}

export interface AmsResult {
  level: "ok" | Severity;
  headline: string;
  actions: string[];
  reasons: string[];
  alerts: Omit<
    Alert,
    "id" | "trekId" | "createdAt" | "acknowledgedAt"
  >[];
>>>>>>> 41ce28c (feat(types): import B-01 shared types contract and database schema)
}
