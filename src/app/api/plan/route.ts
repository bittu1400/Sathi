import { NextResponse } from "next/server";
import { z } from "zod";
import { INTEREST_IDS } from "@/lib/plan/interests";
import { PlanError } from "@/lib/plan/ors";
import { plan } from "@/lib/plan/planner";
import type { InterestId, PlanResult } from "@/lib/plan/types";

const point = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const planSchema = z.object({
  start: point,
  end: point,
  days: z.number().int().min(1).max(21),
  interests: z.array(z.enum(INTEREST_IDS as [string, ...string[]])).max(INTEREST_IDS.length),
});

// ponytail: per-process cache, good enough for one server and a demo. Move it
// to a shared store the day this runs on more than one instance.
const cache = new Map<string, { at: number; result: PlanResult }>();
const TTL_MS = 60 * 60 * 1000;

function cacheKey(input: z.infer<typeof planSchema>): string {
  const round = (n: number) => n.toFixed(3);
  return [
    round(input.start.lat),
    round(input.start.lng),
    round(input.end.lat),
    round(input.end.lng),
    input.days,
    [...input.interests].sort().join("+"),
  ].join(":");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That request didn't look right." }, { status: 400 });
  }

  const key = cacheKey(parsed.data);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.result);
  }

  try {
    const result: PlanResult = await plan({
      ...parsed.data,
      interests: parsed.data.interests as InterestId[],
    });
    if (result.routes.length === 0) {
      return NextResponse.json({ error: "No route found between those points." }, { status: 404 });
    }
    cache.set(key, { at: Date.now(), result });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlanError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Route planning failed:", error);
    return NextResponse.json({ error: "Couldn't reach the route service." }, { status: 502 });
  }
}
