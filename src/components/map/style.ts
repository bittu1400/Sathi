import { layers, namedFlavor } from "@protomaps/basemaps";
import { addProtocol, setWorkerUrl, type LayerSpecification, type StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";

/** Low-zoom basemap for all of Nepal, drawn under the detailed regional tiles. */
const OVERVIEW_TILES = "/tiles/nepal.pmtiles";

let protocolAdded = false;
/** One-time MapLibre setup; call before creating any map. */
export function ensurePMTilesProtocol() {
  if (!protocolAdded) {
    // MapLibre 6 looks for its worker next to its own module, which the bundler
    // doesn't emit; without this no map ever renders. Copies live in public/maplibre
    // (kept in sync with node_modules by maplibre-worker.test.ts).
    setWorkerUrl(new URL("/maplibre/maplibre-gl-worker.mjs", location.href).href);
    addProtocol("pmtiles", new Protocol().tile);
    protocolAdded = true;
  }
}

/**
 * The first URL is the route's own tiles (source "protomaps", which MapInner
 * watches for errors); any others are extra regions drawn with it. `overview`
 * adds the Nepal-wide low-zoom tiles underneath for zoomed-out views.
 */
export function getMapStyle(
  theme: "dark" | "sunlight",
  tilesUrls: string | string[] = [],
  overview = false,
): StyleSpecification {
  const flavor = theme === "sunlight" ? "light" : "dark";
  const absolute = (url: string) => new URL(url, location.href).href;

  const sources: StyleSpecification["sources"] = {};
  // Without tiles the route still draws on this themed background.
  const styleLayers: LayerSpecification[] = [
    {
      id: "background",
      type: "background",
      paint: { "background-color": getComputedStyle(document.documentElement).getPropertyValue("--surface-2").trim() },
    },
  ];
  const addBasemap = (id: string, url: string, maxzoom?: number) => {
    sources[id] = { type: "vector", url: `pmtiles://${absolute(url)}`, attribution: "© OpenStreetMap contributors, Protomaps" };
    for (const layer of layers(id, namedFlavor(flavor), { lang: "en" })) {
      if (layer.type === "background") continue;
      styleLayers.push({ ...layer, id: `${id}-${layer.id}`, ...(maxzoom ? { maxzoom } : {}) } as LayerSpecification);
    }
  };

  if (overview) addBasemap("overview", OVERVIEW_TILES, 10);
  [...new Set([tilesUrls].flat().filter(Boolean))].forEach((url, i) => addBasemap(i === 0 ? "protomaps" : `protomaps-${i}`, url));

  return {
    version: 8,
    glyphs: absolute("/basemaps-assets/fonts/{fontstack}/{range}.pbf").replace(/%7B/g, "{").replace(/%7D/g, "}"),
    sprite: absolute(`/basemaps-assets/sprites/v4/${flavor}`),
    sources,
    layers: styleLayers,
  };
}
