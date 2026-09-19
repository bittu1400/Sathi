/**
 * End-to-end check of lib/db + RLS against a local Supabase (never production).
 * Setup (outside the repo; see docs WORKFLOW §7): `npx supabase init`, copy supabase/migrations,
 * `npx supabase start`, put its URL/anon/service keys + NEXT_PUBLIC_DEMO_GMAIL + SEED_PASSWORD in .env.local, then:
 *   pnpm tsx --env-file=.env.local scripts/seed-users.ts
 *   pnpm tsx --env-file=.env.local scripts/e2e-local.mts
 * Uses the seeded demo accounts; creates and resolves test SOS events.
 */
import { createClient } from "@supabase/supabase-js";
import * as q from "../src/lib/db/queries";
import { sosToRow, checkinToRow, positionToRow, alertToRow } from "../src/lib/db/map";
import { buildSos } from "../src/lib/sos";
import { evaluateAms, amsInputFromCheckins } from "../src/lib/ams";
import { deriveAlerts } from "../src/lib/alerts";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const pw = process.env.SEED_PASSWORD!;
const [l, d] = process.env.NEXT_PUBLIC_DEMO_GMAIL!.split("@");
let failures = 0;
const ok = (name: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`); if (!cond) failures++; };
async function as(tag: string) {
  const sb = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: `${l}+${tag}@${d}`, password: pw });
  if (error) throw new Error(`${tag}: ${error.message}`);
  return { sb, uid: data.user!.id };
}

const maya = await as("trekker");
const old = await q.getActiveTrek(maya.sb, maya.uid);
if (old) await q.endTrek(maya.sb, old.id, "aborted");
const trek = await q.startTrek(maya.sb, maya.uid, "ebc");
ok("trekker starts trek; share token 32 chars", trek.shareToken.length === 32);
let dup = false; try { await q.startTrek(maya.sb, maya.uid, "ebc"); } catch { dup = true; }
ok("second active trek rejected", dup);

const pos = { id: crypto.randomUUID(), trekId: trek.id, lat: 27.948, lng: 86.8108, altM: 4940, accuracyM: 10, recordedAt: new Date().toISOString(), source: "gps" as const };
ok("position upsert (outbox shape)", !(await maya.sb.from("positions").upsert(positionToRow(pos), { onConflict: "id", ignoreDuplicates: true })).error);
ok("position replay is idempotent", !(await maya.sb.from("positions").upsert(positionToRow(pos), { onConflict: "id", ignoreDuplicates: true })).error);
const checkin = { id: crypto.randomUUID(), trekId: trek.id, recordedAt: new Date().toISOString(), headache: 2 as const, gi: 2 as const, fatigue: 2 as const, dizziness: 1 as const, redFlags: [], sleepWaypointId: "ebc-lobuche", sleepAltM: 4940, lls: 7 };
const ci = await maya.sb.from("checkins").upsert(checkinToRow(checkin), { onConflict: "id", ignoreDuplicates: true });
ok("check-in upsert without generated lls", !ci.error, ci.error?.message);
const ams = evaluateAms(amsInputFromCheckins(2860, [checkin]));
for (const a of deriveAlerts({ ams, trekId: trek.id, now: new Date() })) {
  const r = await maya.sb.from("alerts").upsert(alertToRow(a), { onConflict: "trek_id,dedupe_key", ignoreDuplicates: true });
  ok(`alert ${a.dedupeKey} stored`, !r.error, r.error?.message);
}
const lls = (await q.listCheckins(maya.sb, trek.id)).at(-1)?.lls;
ok("server computes lls = 7", lls === 7);

const sos = buildSos({ userId: maya.uid, trekId: trek.id, lat: 27.948, lng: 86.8108, altM: 4940, category: "altitude_illness", lastCheckinLls: 7 });
const s1 = await maya.sb.from("sos_events").upsert(sosToRow(sos), { onConflict: "id", ignoreDuplicates: true });
ok("SOS insert with real uid + trek", !s1.error, s1.error?.message);
const bad = buildSos({ userId: maya.uid, trekId: (await (await as("tom")).sb.from("treks").select("id").eq("status","active").single()).data!.id, category: "injury" });
ok("SOS on someone else's trek rejected", !!(await maya.sb.from("sos_events").insert(sosToRow(bad))).error);
let trekkerAck = false; try { await q.ackSos(maya.sb, sos.id, maya.uid); trekkerAck = true; } catch {}
ok("trekker cannot acknowledge", !trekkerAck);

const rescue = await as("rescue");
const list = await q.listSos(rescue.sb);
const mine = list.find((s) => s.id === sos.id);
ok("coordinator sees SOS with name + route", mine?.trekkerName === "Maya" && mine?.routeId === "ebc");
const fleet = await q.listActiveTreksWithLatestPosition(rescue.sb);
ok("coordinator sees all active treks with latest position", fleet.length >= 4 && fleet.find((t) => t.trekId === trek.id)?.position?.altM === 4940, `n=${fleet.length}`);
ok("alerts KPI counts", (await q.countRecentAlerts(rescue.sb)) >= 1);
await q.ackSos(rescue.sb, sos.id, rescue.uid);
await q.resolveSos(rescue.sb, sos.id, "Escorted to Pheriche HRA post");
const after = (await q.listSos(rescue.sb)).find((s) => s.id === sos.id);
ok("coordinator ack + resolve with note", after?.status === "resolved" && after.resolutionNotes === "Escorted to Pheriche HRA post" && !!after.acknowledgedAt);

const sos2 = buildSos({ userId: maya.uid, trekId: trek.id, category: "lost" });
await maya.sb.from("sos_events").insert(sosToRow(sos2));
await q.resolveSos(maya.sb, sos2.id, "Found the trail");
ok("trekker resolves own SOS (I'm safe)", (await maya.sb.from("sos_events").select("status").eq("id", sos2.id).single()).data?.status === "resolved");

const agency = await as("agency");
const af = await q.listFleet(agency.sb);
ok("agency sees its 4 trekkers only", af.length === 4, af.map((t) => t.trekkerName).join(","));
ok("agency fleet has last check-in + alerts", af.find((t) => t.trekId === trek.id)?.lastCheckin?.lls === 7 && (af.find((t) => t.trekId === trek.id)?.openAlerts ?? 0) >= 1);
let agencyAck = false; try { await q.ackSos(agency.sb, sos2.id, agency.uid); agencyAck = true; } catch {}
ok("agency cannot change SOS", !agencyAck);

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const shared = await anon.rpc("get_shared_trek", { token: trek.shareToken });
ok("family link works signed-out, coords rounded", shared.data?.[0]?.latest_position?.lat === 27.948 && shared.data?.[0]?.display_name === "Maya");
ok("anon cannot read sos_events", ((await anon.from("sos_events").select("id")).data ?? []).length === 0);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
