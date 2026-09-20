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

/**
 * CARTO's vector basemaps for the planner: streets, labels and POIs at every
 * zoom, which is what makes the screen read like a maps app. Light by default —
 * a route drawn over a pale map is far easier to follow outdoors.
 * The key is a basemap key and reaches the browser by design; it is not one of
 * the server-only secrets.
 */
export function getBasemapUrl(theme: "light" | "dark" = "light", apiKey?: string): string {
  const style = theme === "dark" ? "dark-matter-gl-style" : "voyager-gl-style";
  const url = `https://basemaps.cartocdn.com/gl/${style}/style.json`;
  return apiKey ? `${url}?api_key=${encodeURIComponent(apiKey)}` : url;
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
