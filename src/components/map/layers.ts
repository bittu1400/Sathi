import type { Map as MapLibreMap } from "maplibre-gl";
import { RouteDetail, Resource } from "@/lib/types";

export function addRouteLayers(
  map: MapLibreMap,
  route: RouteDetail,
  progressIndex: number = 0
) {
  if (!route.line) return;

  const totalCoords = route.line.coordinates;
  const splitIdx = Math.min(
    Math.max(progressIndex, 0),
    totalCoords.length - 1
  );

  const completedCoords = totalCoords.slice(0, splitIdx + 1);

  // Completed segment source & layer
  if (!map.getSource("route-completed")) {
    map.addSource("route-completed", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: completedCoords.length > 1 ? completedCoords : totalCoords,
        },
      },
    });

    map.addLayer({
      id: "route-casing",
      type: "line",
      source: "route-completed",
      paint: {
        "line-color": "#0A0E13",
        "line-width": 8,
        "line-opacity": 0.8,
      },
    });

    map.addLayer({
      id: "route-line-completed",
      type: "line",
      source: "route-completed",
      paint: {
        "line-color": "#7CC4FF",
        "line-width": 4,
        "line-opacity": 1.0,
      },
    });
  }

  // Waypoints source & layer
  if (route.waypoints && !map.getSource("waypoints")) {
    map.addSource("waypoints", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: route.waypoints.map((wp) => ({
          type: "Feature",
          properties: {
            id: wp.id,
            name: wp.name,
            kind: wp.kind,
            altM: wp.altM,
          },
          geometry: {
            type: "Point",
            coordinates: [wp.lng, wp.lat],
          },
        })),
      },
    });

    map.addLayer({
      id: "waypoints-circles",
      type: "circle",
      source: "waypoints",
      paint: {
        "circle-radius": 6,
        "circle-color": "#7CC4FF",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0A0E13",
      },
    });

    map.addLayer({
      id: "waypoints-labels",
      type: "symbol",
      source: "waypoints",
      minzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#E9EEF4",
        "text-halo-color": "#0A0E13",
        "text-halo-width": 1.5,
      },
    });
  }
}

export function addResourceLayers(
  map: MapLibreMap,
  resources: Resource[],
  onResourceClick?: (r: Resource) => void
) {
  if (!resources || resources.length === 0) return;

  if (!map.getSource("resources")) {
    map.addSource("resources", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: resources.map((r) => ({
          type: "Feature",
          properties: {
            id: r.id,
            name: r.name,
            kind: r.kind,
          },
          geometry: {
            type: "Point",
            coordinates: [r.lng, r.lat],
          },
        })),
      },
    });

    map.addLayer({
      id: "resources-markers",
      type: "circle",
      source: "resources",
      paint: {
        "circle-radius": 8,
        "circle-color": "#FFC24B",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0A0E13",
      },
    });

    map.on("click", "resources-markers", (e) => {
      const feature = e.features?.[0];
      if (feature && feature.properties?.id) {
        const target = resources.find((r) => r.id === feature.properties.id);
        if (target && onResourceClick) {
          onResourceClick(target);
        }
      }
    });
  }
}
