/**
 * Builds src/data/route-lines.json: one trail line per route, routed along
 * OpenStreetMap paths between the route's main stops (stop coordinates are OSM
 * nodes; for EBC they are the waypoints in ebc.json). Also refreshes ebc.json's
 * line and bbox. Re-run when the stop lists change:
 *
 *   pnpm tsx scripts/build-route-lines.ts
 *
 * Output is © OpenStreetMap contributors (ODbL) and marked unverified.
 */
import { readFileSync, writeFileSync } from "node:fs";

type LngLat = [number, number];
type Bbox = [west: number, south: number, east: number, north: number];

// Stop names are the standard itineraries; aliases are OSM spellings.
const ROUTES: { id: string; tilesUrl: string; bbox: Bbox; stops: string[][] }[] = [
  {
    id: "ebc",
    tilesUrl: "/tiles/khumbu.pmtiles",
    bbox: [86.55, 27.6, 86.95, 28.1],
    stops: [["Lukla"], ["Phakding"], ["Namche Bazaar"], ["Tengboche"], ["Dingboche"], ["Lobuche"], ["Gorak Shep"], ["Everest Base Camp"]],
  },
  {
    id: "gokyo",
    tilesUrl: "/tiles/khumbu.pmtiles",
    bbox: [86.55, 27.6, 86.95, 28.1],
    stops: [["Lukla"], ["Phakding"], ["Namche Bazaar"], ["Dole", "Dhole"], ["Machhermo", "Macchermo", "Machermo"], ["Gokyo"]],
  },
  {
    id: "poon-hill",
    tilesUrl: "/tiles/annapurna.pmtiles",
    bbox: [83.6, 28.2, 83.95, 28.5],
    stops: [["Nayapul", "Naya Pul"], ["Tikhedhunga", "Tikhe Dhunga", "Tikhedunga"], ["Ulleri"], ["Ghorepani"], ["Poon Hill"], ["Tadapani"], ["Ghandruk"]],
  },
  {
    id: "annapurna-circuit",
    tilesUrl: "/tiles/annapurna.pmtiles",
    bbox: [83.65, 28.4, 84.45, 28.85],
    stops: [["Dharapani"], ["Chame"], ["Upper Pisang", "Pisang", "Lower Pisang"], ["Manang"], ["Yak Kharka"], ["Thorong Phedi", "Thorung Phedi"], ["Thorong La", "Thorung La"], ["Muktinath"], ["Jomsom"]],
  },
  {
    id: "langtang",
    tilesUrl: "/tiles/langtang.pmtiles",
    bbox: [85.25, 28.05, 85.75, 28.3],
    stops: [["Syabrubesi", "Syabru Besi", "Syabrubesi hot spring"], ["Lama Hotel"], ["Langtang"], ["Kyanjin Gompa", "Kyāṅjiṅ Gompā", "Kyangjin Gompa"]],
  },
  {
    id: "manaslu",
    tilesUrl: "/tiles/annapurna.pmtiles",
    bbox: [84.3, 28.1, 84.95, 28.8],
    stops: [["Soti Khola"], ["Machha Khola", "Machhakhola"], ["Jagat"], ["Deng"], ["Namrung"], ["Lho"], ["Samagaon", "Sama Gaun", "Samagaun"], ["Samdo"], ["Dharmasala", "Larke Phedi (Dharmasala)", "Larke Phedi"], ["Larkya La", "Larke La"], ["Bimthang", "Bimtang"], ["Dharapani"]],
  },
];

const HIGHWAYS = "path|footway|track|steps|bridleway|unclassified|residential|service|living_street|tertiary|secondary|primary|trunk|road";
const ROAD_PENALTY = 1.3; // prefer foot trails over jeep roads where both exist
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

interface OsmElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

async function overpass(query: string): Promise<OsmElement[]> {
  for (let attempt = 0; attempt < 9; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length]!;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": "sathi-route-lines/1.0 (https://github.com/bittu1400/sathi)", Accept: "application/json" },
        body: new URLSearchParams({ data: query }),
      });
      if (res.ok) return ((await res.json()) as { elements: OsmElement[] }).elements;
      console.warn(`  ${url}: HTTP ${res.status}, retrying`);
    } catch (e) {
      console.warn(`  ${url}: ${(e as Error).message}, retrying`);
    }
    await new Promise((r) => setTimeout(r, 30_000));
  }
  throw new Error("Overpass unavailable");
}

function metres([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 12_742_000 * Math.asin(Math.sqrt(a));
}

class Graph {
  coords = new Map<number, LngLat>();
  edges = new Map<number, [number, number][]>();

  add(a: number, b: number, factor: number) {
    const w = metres(this.coords.get(a)!, this.coords.get(b)!) * factor;
    if (!this.edges.has(a)) this.edges.set(a, []);
    if (!this.edges.has(b)) this.edges.set(b, []);
    this.edges.get(a)!.push([b, w]);
    this.edges.get(b)!.push([a, w]);
  }

  nearest(p: LngLat): { id: number; distM: number } {
    let best = { id: -1, distM: Infinity };
    for (const id of this.edges.keys()) {
      const d = metres(p, this.coords.get(id)!);
      if (d < best.distM) best = { id, distM: d };
    }
    return best;
  }

  // ponytail: array-scan Dijkstra frontier would be O(n²); a binary heap keeps big regions fast.
  shortest(from: number, to: number): LngLat[] | null {
    const dist = new Map<number, number>([[from, 0]]);
    const prev = new Map<number, number>();
    const heap: [number, number][] = [[0, from]];
    const push = (item: [number, number]) => {
      heap.push(item);
      for (let i = heap.length - 1; i > 0; ) {
        const p = (i - 1) >> 1;
        if (heap[p]![0] <= heap[i]![0]) break;
        [heap[p], heap[i]] = [heap[i]!, heap[p]!];
        i = p;
      }
    };
    const pop = (): [number, number] => {
      const top = heap[0]!;
      const last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        for (let i = 0; ; ) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
          if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i]!, heap[m]!];
          i = m;
        }
      }
      return top;
    };
    while (heap.length) {
      const [d, u] = pop();
      if (u === to) break;
      if (d > (dist.get(u) ?? Infinity)) continue;
      for (const [v, w] of this.edges.get(u) ?? []) {
        if (d + w < (dist.get(v) ?? Infinity)) {
          dist.set(v, d + w);
          prev.set(v, u);
          push([d + w, v]);
        }
      }
    }
    if (!dist.has(to)) return null;
    const path: LngLat[] = [];
    for (let n: number | undefined = to; n !== undefined; n = prev.get(n)) path.push(this.coords.get(n)!);
    return path.reverse();
  }
}

// Douglas–Peucker in degrees; tolerance grows until the line fits the 300-point budget (SPEC RouteDetail.line).
function simplify(points: LngLat[], maxPoints = 300): LngLat[] {
  const run = (tol: number): LngLat[] => {
    const keep = new Uint8Array(points.length);
    keep[0] = keep[points.length - 1] = 1;
    const stack: [number, number][] = [[0, points.length - 1]];
    while (stack.length) {
      const [s, e] = stack.pop()!;
      const [x1, y1] = points[s]!;
      const [x2, y2] = points[e]!;
      const len = Math.hypot(x2 - x1, y2 - y1) || 1e-12;
      let maxD = 0;
      let idx = -1;
      for (let i = s + 1; i < e; i++) {
        const d = Math.abs((x2 - x1) * (y1 - points[i]![1]) - (x1 - points[i]![0]) * (y2 - y1)) / len;
        if (d > maxD) [maxD, idx] = [d, i];
      }
      if (maxD > tol && idx > 0) {
        keep[idx] = 1;
        stack.push([s, idx], [idx, e]);
      }
    }
    return points.filter((_, i) => keep[i]);
  };
  let tol = 0.00002;
  let out = run(tol);
  while (out.length > maxPoints) out = run((tol *= 1.5));
  return out;
}

const round = ([lng, lat]: LngLat): LngLat => [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];

async function main() {
  const ebcText = readFileSync("src/data/routes/ebc.json", "utf8");
  const ebc = JSON.parse(ebcText);
  let ebcOut = ebcText;
  const out: Record<string, unknown> = {};

  for (const route of ROUTES) {
    console.log(`${route.id}:`);
    await new Promise((r) => setTimeout(r, 5_000)); // be polite to the shared Overpass servers
    const [w, s, e, n] = route.bbox;
    const box = `${s},${w},${n},${e}`;
    const elements = await overpass(
      `[out:json][timeout:180];(way[highway~"^(${HIGHWAYS})$"](${box}););out body;>;out skel qt;` +
        `(node[name][place](${box});node[name][mountain_pass](${box});node[name][tourism~"viewpoint|alpine_hut"](${box});node[name][natural~"peak|saddle|hot_spring"](${box}););out body;`,
    );

    const graph = new Graph();
    const named: { names: string[]; at: LngLat }[] = [];
    for (const el of elements) {
      if (el.type !== "node") continue;
      graph.coords.set(el.id, [el.lon!, el.lat!]);
      if (el.tags?.name) named.push({ names: [el.tags.name, el.tags["name:en"] ?? ""].map((x) => x.toLowerCase()), at: [el.lon!, el.lat!] });
    }
    for (const el of elements) {
      if (el.type !== "way" || !el.nodes) continue;
      const factor = /^(path|footway|track|steps|bridleway)$/.test(el.tags?.highway ?? "") ? 1 : ROAD_PENALTY;
      for (let i = 1; i < el.nodes.length; i++) graph.add(el.nodes[i - 1]!, el.nodes[i]!, factor);
    }

    // Geocode stops; duplicates (several "Jagat"s) resolve to the one nearest the previous stop.
    const stops: { name: string; lng: number; lat: number }[] = [];
    for (const aliases of route.stops) {
      const name = aliases[0]!;
      const wp = route.id === "ebc" ? ebc.waypoints.find((x: { name: string }) => x.name === name) : undefined;
      let at: LngLat | undefined = wp ? [wp.lng, wp.lat] : undefined;
      if (!at) {
        const wanted = aliases.map((a) => a.toLowerCase());
        const hits = named.filter((p) => p.names.some((x) => wanted.includes(x)));
        const prev = stops.at(-1);
        hits.sort((a, b) => (prev ? metres(a.at, [prev.lng, prev.lat]) - metres(b.at, [prev.lng, prev.lat]) : 0));
        at = hits[0]?.at;
      }
      if (!at) {
        console.warn(`  ! stop not found in OSM, skipped: ${name}`);
        continue;
      }
      stops.push({ name, lng: round(at)[0], lat: round(at)[1] });
    }

    const points: LngLat[] = [];
    for (let i = 1; i < stops.length; i++) {
      const from = stops[i - 1]!;
      const to = stops[i]!;
      const a = graph.nearest([from.lng, from.lat]);
      const b = graph.nearest([to.lng, to.lat]);
      const leg = graph.shortest(a.id, b.id);
      if (!leg || a.distM > 1500 || b.distM > 1500) {
        console.warn(`  ! no trail ${from.name} → ${to.name}, straight segment used`);
        points.push([from.lng, from.lat], [to.lng, to.lat]);
      } else {
        points.push(...leg);
      }
    }
    const line = simplify(points).map(round);
    const lngs = line.map((p) => p[0]);
    const lats = line.map((p) => p[1]);
    const pad = 0.01;
    const bbox = [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad].map((x) => Math.round(x * 1e3) / 1e3);
    const km = line.reduce((sum, p, i) => (i ? sum + metres(line[i - 1]!, p) : 0), 0) / 1000;
    console.log(`  ${stops.length}/${route.stops.length} stops, ${line.length} points, ~${km.toFixed(0)} km`);

    out[route.id] = { tilesUrl: route.tilesUrl, bbox, line: { type: "LineString", coordinates: line }, stops };
    // Edit ebc.json in place (keeps its hand formatting); tilesBytes stays manual.
    if (route.id === "ebc") {
      ebcOut = ebcOut
        .replace(/"tilesUrl": ".*?"/, `"tilesUrl": "${route.tilesUrl}"`)
        .replace(/"bbox": \[.*?\]/, `"bbox": [${bbox.join(", ")}]`)
        .replace(/"line": \{[\s\S]*$/, `"line": {\n    "type": "LineString",\n    "coordinates": [\n${line.map(([x, y]) => `      [${x}, ${y}]`).join(",\n")}\n    ]\n  }\n}\n`);
    }
  }

  writeFileSync("src/data/route-lines.json", JSON.stringify(out) + "\n");
  writeFileSync("src/data/routes/ebc.json", ebcOut);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
