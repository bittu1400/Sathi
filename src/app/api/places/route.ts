import { NextResponse } from "next/server";
import { z } from "zod";
import { geocode, PlanError } from "@/lib/plan/ors";

// The ORS key stays here: the browser asks this route instead (CLAUDE.md rule 5).

const querySchema = z.string().trim().min(2).max(80);

// ponytail: per-process cache, same as /api/plan. A search box repeats itself.
const cache = new Map<string, { at: number; places: unknown[] }>();
const TTL_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!parsed.success) {
    return NextResponse.json({ places: [] });
  }

  const key = parsed.data.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ places: hit.places });
  }

  try {
    const places = await geocode(parsed.data);
    cache.set(key, { at: Date.now(), places });
    return NextResponse.json({ places });
  } catch (error) {
    if (error instanceof PlanError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Place search failed:", error);
    return NextResponse.json({ error: "Couldn't reach the place search." }, { status: 502 });
  }
}
