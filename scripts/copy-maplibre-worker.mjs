// MapLibre resolves its web worker with `new URL("./maplibre-gl-worker.mjs", import.meta.url)`.
// Turbopack doesn't emit that file, so the worker 404s and the map renders nothing
// (no source ever finishes loading). Copy it next to its shared chunk into public/
// and point MapLibre at it with setWorkerUrl() — see src/components/map/MapInner.tsx.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"));
const out = join(process.cwd(), "public", "maplibre");

mkdirSync(out, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(out, file));
}
