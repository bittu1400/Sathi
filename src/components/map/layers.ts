import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { RouteDetail, Resource } from "@/lib/types";

/** Map paint colours come from the design tokens, so they match the app. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

function setData(map: MapLibreMap, id: string, data: GeoJSON.GeoJSON) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource(id, { type: "geojson", data });
}

export function addRouteLayers(map: MapLibreMap, route: RouteDetail) {
  if (!route.line) return;
  setData(map, "route", { type: "Feature", properties: {}, geometry: route.line });
  setData(map, "waypoints", {
    type: "FeatureCollection",
    features: route.waypoints.map((wp) => ({
      type: "Feature",
      properties: { id: wp.id, name: wp.name, kind: wp.kind, altM: wp.altM },
      geometry: { type: "Point", coordinates: [wp.lng, wp.lat] },
    })),
  });

  if (map.getLayer("route-line")) return;
  map.addLayer({
    id: "route-casing",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": token("bg"), "line-width": 8, "line-opacity": 0.8 },
  });
  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": token("accent"), "line-width": 4 },
  });
  map.addLayer({
    id: "waypoints-circles",
    type: "circle",
    source: "waypoints",
    paint: {
      "circle-radius": 6,
      "circle-color": token("accent"),
      "circle-stroke-width": 2,
      "circle-stroke-color": token("bg"),
    },
  });
  map.addLayer({
    id: "waypoints-labels",
    type: "symbol",
    source: "waypoints",
    minzoom: 10,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
      "text-offset": [0, 1.2],
      "text-anchor": "top",
    },
    paint: { "text-color": token("text"), "text-halo-color": token("bg"), "text-halo-width": 1.5 },
  });
}

export function addResourceLayers(map: MapLibreMap, resources: Resource[]) {
  setData(map, "resources", {
    type: "FeatureCollection",
    features: resources.map((r) => ({
      type: "Feature",
      properties: { id: r.id, name: r.name, kind: r.kind },
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
    })),
  });
  if (map.getLayer("resources-markers")) return;
  map.addLayer({
    id: "resources-markers",
    type: "circle",
    source: "resources",
    paint: {
      "circle-radius": 8,
      // Kind decides the colour: medical ok, air accent, police warning, rest caution.
      "circle-color": [
        "match",
        ["get", "kind"],
        ["hra_post", "hospital", "health_post"],
        token("ok"),
        ["heli_operator", "helipad"],
        token("accent"),
        "police",
        token("warning"),
        token("caution"),
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": token("bg"),
    },
  });
}

export function setPositionLayer(map: MapLibreMap, position: { lat: number; lng: number } | null) {
  setData(map, "me", {
    type: "FeatureCollection",
    features: position
      ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [position.lng, position.lat] } }]
      : [],
  });
  if (map.getLayer("me-dot")) return;
  map.addLayer({
    id: "me-halo",
    type: "circle",
    source: "me",
    paint: { "circle-radius": 14, "circle-color": token("accent"), "circle-opacity": 0.25 },
  });
  map.addLayer({
    id: "me-dot",
    type: "circle",
    source: "me",
    paint: {
      "circle-radius": 6,
      "circle-color": token("accent"),
      "circle-stroke-width": 2,
      "circle-stroke-color": token("text"),
    },
  });
}
