/**
 * Bakes an OpenStreetMap POI extract for the places the demo plans around, so a
 * city day out doesn't depend on Overpass being up and quick at the time.
 *
 *   pnpm tsx scripts/fetch-pois.mts
 *
 * Everything it writes comes from OSM: names, coordinates and tags are copied,
 * never invented. Re-run it to refresh; the file is committed.
 */
import { writeFile } from "node:fs/promises";
import { OVERPASS_FILTERS, INTEREST_IDS, type InterestId } from "@/lib/plan/interests";
import { toPois, type Bbox } from "@/lib/plan/overpass";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "Sathi/0.1 (offline trekking safety app for Nepal; github.com/bittu1400/Sathi)";

/** Kathmandu valley: Kathmandu, Patan, Bhaktapur and the ring of hills. */
const REGIONS: { id: string; name: string; bbox: Bbox }[] = [
  {
    id: "kathmandu",
    name: "Kathmandu Valley",
    bbox: { south: 27.58, west: 85.19, north: 27.83, east: 85.55 },
  },
  {
    id: "pokhara",
    name: "Pokhara",
    bbox: { south: 28.12, west: 83.87, north: 28.31, east: 84.06 },
  },
];

/**
 * One query per interest. Asking for all ten at once hits Overpass's element
 * cap, and the 700-odd hotels crowd every temple out of the answer.
 */
async function fetchInterest(bbox: Bbox, interest: InterestId) {
  const box = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const filters = OVERPASS_FILTERS[interest];
  const query = `[out:json][timeout:180][bbox:${box}];(${filters.map((f) => `nwr${f};`).join("")});out center 1200;`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: new URLSearchParams({ data: query }),
    });
    if (response.ok) {
      const body = (await response.json()) as { elements?: unknown[]; remark?: string };
      if (body.remark) {
        console.warn(`  attempt ${attempt}: Overpass said "${body.remark}"`);
      } else {
        return toPois((body.elements ?? []) as never[], [interest]);
      }
    } else {
      console.warn(`  attempt ${attempt}: HTTP ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
  }
  throw new Error("Overpass would not answer after three attempts");
}

async function main() {
  for (const region of REGIONS) {
    console.log(`Fetching ${region.name}…`);
    const pois = [];
    for (const interest of INTEREST_IDS) {
      const found = await fetchInterest(region.bbox, interest);
      console.log(`  ${interest}: ${found.length}`);
      pois.push(...found);
      // Overpass is a shared public service: don't hammer it.
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    const file = `src/data/pois/${region.id}.json`;
    await writeFile(file, `${JSON.stringify({ ...region, pois }, null, 0)}\n`);
    const notable = pois.filter((poi) => poi.notable).length;
    console.log(`  ${pois.length} places (${notable} notable) → ${file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
