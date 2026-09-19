import { layers, namedFlavor } from "@protomaps/basemaps";
import type { StyleSpecification } from "maplibre-gl";

export function getMapStyle(
  theme: "dark" | "sunlight",
  tilesUrl?: string
): StyleSpecification {
  const flavor = theme === "sunlight" ? "light" : "dark";
  const sourceUrl = tilesUrl ? `pmtiles://${tilesUrl}` : undefined;

  const styleLayers = layers("protomaps", namedFlavor(flavor), { lang: "en" });

  return {
    version: 8,
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${flavor}`,
    sources: sourceUrl
      ? {
          protomaps: {
            type: "vector",
            url: sourceUrl,
            attribution: "© OpenStreetMap contributors, Protomaps",
          },
        }
      : {},
    layers: sourceUrl ? styleLayers : [],
  };
}
