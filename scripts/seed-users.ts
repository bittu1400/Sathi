/**
 * Demo accounts + agency + background trekkers (SPEC §5.3, DATA §5). Idempotent.
 * Run locally only — it uses the service role key:
 *
 *   SEED_PASSWORD=… pnpm tsx --env-file=.env.local scripts/seed-users.ts
 *
 * Accounts are plus-addresses of NEXT_PUBLIC_DEMO_GMAIL (e.g. yourteam+trekker@gmail.com).
 * Nothing secret is stored in this file.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ebc from "../src/data/routes/ebc.json";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

const [local, domain] = env("NEXT_PUBLIC_DEMO_GMAIL").split("@");
const email = (tag: string) => `${local}+${tag}@${domain}`;
const password = env("SEED_PASSWORD");
const teamPhone = process.env.SEED_EMERGENCY_PHONE ?? null; // E.164, optional
const AGENCY = "Summit Treks (demo)";
const DAY_MS = 86_400_000;

const sb: SupabaseClient = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as T;
}

async function userId(address: string, displayName: string): Promise<string> {
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`list users: ${error.message}`);
    const found = data.users.find((u) => u.email === address);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  const { data, error } = await sb.auth.admin.createUser({
    email: address,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error || !data.user) throw new Error(`create ${address}: ${error?.message}`);
  return data.user.id;
}

async function agencyId(): Promise<string> {
  const existing = must(
    await sb.from("agencies").select("id").eq("name", AGENCY).maybeSingle<{ id: string }>(),
    "find agency",
  );
  if (existing) return existing.id;
  return must(await sb.from("agencies").insert({ name: AGENCY }).select("id").single<{ id: string }>(), "create agency").id;
}

const wp = (id: string) => {
  const w = ebc.waypoints.find((x) => x.id === id);
  if (!w) throw new Error(`waypoint ${id}`);
  return w;
};

interface Background {
  tag: string;
  name: string;
  routeId: string;
  day: number;
  // Only waypoints from the route data files; no invented coordinates.
  at: { lat: number; lng: number; altM: number } | null;
  checkin: { headache: number; gi: number; fatigue: number; dizziness: number; sleepAltM: number | null; sleepWaypointId: string | null };
}

const dingboche = wp("ebc-dingboche");
const BACKGROUND: Background[] = [
  {
    tag: "tom",
    name: "Tom",
    routeId: "ebc",
    day: 5,
    at: { lat: dingboche.lat, lng: dingboche.lng, altM: dingboche.altM },
    checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0, sleepAltM: dingboche.altM, sleepWaypointId: dingboche.id },
  },
  // Annapurna Circuit / Poon Hill route files don't exist yet, so no position until they do.
  { tag: "aiko", name: "Aiko", routeId: "annapurna-circuit", day: 7, at: null, checkin: { headache: 0, gi: 0, fatigue: 1, dizziness: 0, sleepAltM: null, sleepWaypointId: null } },
  { tag: "lukas", name: "Lukas", routeId: "poon-hill", day: 2, at: null, checkin: { headache: 0, gi: 0, fatigue: 0, dizziness: 0, sleepAltM: null, sleepWaypointId: null } },
];

async function main() {
  const agency = await agencyId();

  const accounts = [
    { tag: "trekker", name: "Maya", role: "trekker", agency, contact: teamPhone ? { name: "Team phone", phone: teamPhone } : null },
    { tag: "rescue", name: "HRA Coordination (demo)", role: "coordinator", agency: null, contact: null },
    { tag: "agency", name: "Summit Treks admin", role: "agency_admin", agency, contact: null },
    ...BACKGROUND.map((b) => ({ tag: b.tag, name: b.name, role: "trekker", agency, contact: null })),
  ];

  const ids = new Map<string, string>();
  for (const a of accounts) {
    const id = await userId(email(a.tag), a.name);
    ids.set(a.tag, id);
    must(
      await sb
        .from("profiles")
        .update({
          display_name: a.name,
          role: a.role,
          agency_id: a.agency,
          emergency_contact_name: a.contact?.name ?? null,
          emergency_contact_phone: a.contact?.phone ?? null,
        })
        .eq("id", id),
      `profile ${a.tag}`,
    );
    console.log(`✓ ${email(a.tag)} (${a.role})`);
  }

  for (const b of BACKGROUND) {
    const user = ids.get(b.tag)!;
    const active = must(
      await sb.from("treks").select("id").eq("user_id", user).eq("status", "active").maybeSingle<{ id: string }>(),
      `find trek ${b.tag}`,
    );
    if (active) {
      console.log(`• ${b.name} already on trail`);
      continue;
    }
    const startedAt = new Date(Date.now() - (b.day - 1) * DAY_MS);
    const trek = must(
      await sb
        .from("treks")
        .insert({ user_id: user, route_id: b.routeId, status: "active", started_at: startedAt.toISOString() })
        .select("id")
        .single<{ id: string }>(),
      `trek ${b.tag}`,
    );
    const now = new Date().toISOString();
    if (b.at) {
      must(
        await sb.from("positions").insert({
          id: crypto.randomUUID(),
          trek_id: trek.id,
          lat: b.at.lat,
          lng: b.at.lng,
          alt_m: b.at.altM,
          accuracy_m: 10,
          recorded_at: now,
          source: "demo",
        }),
        `position ${b.tag}`,
      );
    }
    const { sleepAltM, sleepWaypointId, ...scores } = b.checkin;
    must(
      await sb.from("checkins").insert({
        id: crypto.randomUUID(),
        trek_id: trek.id,
        recorded_at: now,
        ...scores,
        red_flags: [],
        sleep_alt_m: sleepAltM,
        sleep_waypoint_id: sleepWaypointId,
      }),
      `checkin ${b.tag}`,
    );
    console.log(`✓ ${b.name} on ${b.routeId}, day ${b.day}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
