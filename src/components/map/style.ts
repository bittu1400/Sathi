import { layers, namedFlavor } from "@protomaps/basemaps";
import type { StyleSpecification } from "maplibre-gl";

const FLAVOR = "dark";
// Self-hosted: protomaps.github.io is cross-origin, so the service worker can't
// cache it and labels/icons would vanish offline. /basemaps-assets/* is cache-first.
const GLYPHS = "/basemaps-assets/fonts/{fontstack}/{range}.pbf";
// MapLibre rejects a relative sprite URL, so it gets our origin.
const sprite = () => new URL(`/basemaps-assets/sprites/v4/${FLAVOR}`, location.origin).href;
const ATTRIBUTION = "© OpenStreetMap contributors, Protomaps";

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/** Trail diagram: no tile source, so this style can never fail to load. */
export function getDiagramStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sprite: sprite(),
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": token("surface-2") } }],
  };
}

/** Full basemap over `pmtilesUrl` (a remote .pmtiles URL or a local pack's key). */
export function getMapStyle(pmtilesUrl?: string): StyleSpecification {
  if (!pmtilesUrl) return getDiagramStyle();
  return {
    version: 8,
    glyphs: GLYPHS,
    sprite: sprite(),
    sources: {
      protomaps: { type: "vector", url: `pmtiles://${pmtilesUrl}`, attribution: ATTRIBUTION },
    },
    layers: layers("protomaps", namedFlavor(FLAVOR), { lang: "en" }),
  };
}
