import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// public/maplibre holds copies of MapLibre's worker files (see style.ts). After a
// maplibre-gl upgrade, re-copy them: cp node_modules/maplibre-gl/dist/maplibre-gl-{worker,shared}.mjs public/maplibre/
describe("public/maplibre worker files", () => {
  it.each(["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"])("%s matches the installed maplibre-gl", (file) => {
    expect(readFileSync(`public/maplibre/${file}`, "utf8")).toBe(readFileSync(`node_modules/maplibre-gl/dist/${file}`, "utf8"));
  });
});
