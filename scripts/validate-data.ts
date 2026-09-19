import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src", "data", "routes");
const ROUTE_INDEX_PATH = join(ROUTES_DIR, "index.json");
const RESOURCES_PATH = join(ROOT, "src", "data", "resources.json");

const NEPAL_BOUNDS = {
  minLng: 80,
  minLat: 26.3,
  maxLng: 88.3,
  maxLat: 30.5,
};
const MIN_ALTITUDE_M = 500;
const MAX_ALTITUDE_M = 8000;
const RESOURCE_KINDS = new Set([
  "hra_post",
  "hospital",
  "health_post",
  "heli_operator",
  "helipad",
  "police",
  "embassy",
  "rescue_org",
]);
const WAYPOINT_KINDS = new Set([
  "trailhead",
  "village",
  "pass",
  "viewpoint",
  "basecamp",
]);
const SIGNALS = new Set(["none", "weak", "good", "unknown"]);
const DIFFICULTIES = new Set(["easy", "moderate", "strenuous", "extreme"]);
const SEASONS = new Set(["spring", "monsoon", "autumn", "winter"]);
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

const errors: string[] = [];

function error(path: string, message: string): void {
  errors.push(`${path}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  path: string,
): boolean {
  if (typeof record[key] !== "string" || record[key].trim() === "") {
    error(`${path}.${key}`, "must be a non-empty string");
    return false;
  }
  return true;
}

function requiredNumber(
  record: Record<string, unknown>,
  key: string,
  path: string,
): boolean {
  if (typeof record[key] !== "number" || !Number.isFinite(record[key])) {
    error(`${path}.${key}`, "must be a finite number");
    return false;
  }
  return true;
}

function requiredBoolean(
  record: Record<string, unknown>,
  key: string,
  path: string,
): boolean {
  if (typeof record[key] !== "boolean") {
    error(`${path}.${key}`, "must be a boolean");
    return false;
  }
  return true;
}

function validateAltitude(value: unknown, path: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    error(path, "must be a finite number");
    return;
  }
  if (value < MIN_ALTITUDE_M || value > MAX_ALTITUDE_M) {
    error(
      path,
      `must be between ${MIN_ALTITUDE_M} and ${MAX_ALTITUDE_M} metres`,
    );
  }
}

function validateCoordinate(
  lat: unknown,
  lng: unknown,
  path: string,
  allowOutsideNepal: boolean,
): void {
  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    typeof lng !== "number" ||
    !Number.isFinite(lng)
  ) {
    error(path, "lat and lng must be finite numbers");
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    error(path, "lat/lng are outside valid geographic ranges");
    return;
  }

  if (
    !allowOutsideNepal &&
    (lng < NEPAL_BOUNDS.minLng ||
      lng > NEPAL_BOUNDS.maxLng ||
      lat < NEPAL_BOUNDS.minLat ||
      lat > NEPAL_BOUNDS.maxLat)
  ) {
    error(path, "coordinates are outside the documented Nepal bounds");
  }
}

function validateStringArray(
  value: unknown,
  path: string,
  allowEmpty = true,
): value is string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    error(path, "must be an array of strings");
    return false;
  }
  if (!allowEmpty && value.length === 0) {
    error(path, "must not be empty");
  }
  return true;
}

function validateVerification(
  value: unknown,
  path: string,
  required: boolean,
): void {
  if (value === null && !required) {
    return;
  }
  if (!isRecord(value)) {
    error(path, required ? "must be an object" : "must be null or an object");
    return;
  }
  requiredString(value, "source", path);
  requiredString(value, "date", path);
}

function readJson(path: string): unknown | null {
  if (!existsSync(path)) {
    error(path, "file is missing");
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (cause) {
    error(path, `invalid JSON (${String(cause)})`);
    return null;
  }
}

function validateRouteSummary(
  value: unknown,
  path: string,
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    error(path, "must be an object");
    return false;
  }

  requiredString(value, "id", path);
  requiredString(value, "name", path);
  requiredString(value, "region", path);
  requiredString(value, "summary", path);
  requiredString(value, "startPoint", path);
  requiredString(value, "heroImage", path);
  requiredNumber(value, "maxAltitudeM", path);
  validateAltitude(value.maxAltitudeM, `${path}.maxAltitudeM`);
  requiredBoolean(value, "hasFullData", path);

  if (!DIFFICULTIES.has(value.difficulty as string)) {
    error(`${path}.difficulty`, "is not a valid difficulty");
  }
  if (!Array.isArray(value.days) || value.days.length !== 2) {
    error(`${path}.days`, "must contain exactly [min, max]");
  } else if (
    value.days.some(
      (day) => typeof day !== "number" || !Number.isFinite(day) || day < 1,
    )
  ) {
    error(`${path}.days`, "must contain positive finite numbers");
  } else if (value.days[0] > value.days[1]) {
    error(`${path}.days`, "minimum must not exceed maximum");
  }
  if (!validateStringArray(value.terrain, `${path}.terrain`, false)) {
    return false;
  }
  if (
    value.terrain.some(
      (terrain) =>
        ![
          "river_valley",
          "forest",
          "alpine",
          "ridge",
          "glacier",
          "cultural",
        ].includes(terrain),
    )
  ) {
    error(`${path}.terrain`, "contains an invalid terrain");
  }
  validateStringArray(value.permits, `${path}.permits`);
  if (!Array.isArray(value.bestSeasons)) {
    error(`${path}.bestSeasons`, "must be an array");
  } else if (
    value.bestSeasons.some(
      (season) => typeof season !== "string" || !SEASONS.has(season),
    )
  ) {
    error(`${path}.bestSeasons`, "contains an invalid season");
  }
  return true;
}

function validateRouteDetail(
  value: unknown,
  path: string,
): value is Record<string, unknown> {
  if (!validateRouteSummary(value, path) || value.hasFullData !== true) {
    if (isRecord(value) && value.hasFullData !== true) {
      error(`${path}.hasFullData`, "must be true for a full route file");
    }
    return false;
  }

  if (
    !Array.isArray(value.bbox) ||
    value.bbox.length !== 4 ||
    value.bbox.some(
      (coordinate) => typeof coordinate !== "number" || !Number.isFinite(coordinate),
    )
  ) {
    error(`${path}.bbox`, "must contain four finite numbers");
  }
  if (!isRecord(value.line) || value.line.type !== "LineString") {
    error(`${path}.line`, "must be a GeoJSON LineString");
  } else if (
    !Array.isArray(value.line.coordinates) ||
    value.line.coordinates.length < 2
  ) {
    error(`${path}.line.coordinates`, "must contain at least two positions");
  } else {
    value.line.coordinates.forEach((position, index) => {
      if (
        !Array.isArray(position) ||
        position.length < 2 ||
        typeof position[0] !== "number" ||
        typeof position[1] !== "number"
      ) {
        error(
          `${path}.line.coordinates[${index}]`,
          "must contain numeric [lng, lat] coordinates",
        );
      } else {
        validateCoordinate(
          position[1],
          position[0],
          `${path}.line.coordinates[${index}]`,
          false,
        );
      }
    });
  }
  if (!Array.isArray(value.waypoints) || value.waypoints.length === 0) {
    error(`${path}.waypoints`, "must be a non-empty array");
  } else {
    const waypointIds = new Set<string>();
    value.waypoints.forEach((waypoint, index) => {
      const waypointPath = `${path}.waypoints[${index}]`;
      if (!isRecord(waypoint)) {
        error(waypointPath, "must be an object");
        return;
      }
      requiredString(waypoint, "id", waypointPath);
      if (typeof waypoint.id === "string" && waypointIds.has(waypoint.id)) {
        error(waypointPath, `duplicate waypoint id "${waypoint.id}"`);
      }
      if (typeof waypoint.id === "string") {
        waypointIds.add(waypoint.id);
      }
      requiredString(waypoint, "name", waypointPath);
      validateCoordinate(
        waypoint.lat,
        waypoint.lng,
        waypointPath,
        false,
      );
      validateAltitude(waypoint.altM, `${waypointPath}.altM`);
      if (!WAYPOINT_KINDS.has(waypoint.kind as string)) {
        error(`${waypointPath}.kind`, "is not a valid waypoint kind");
      }
      requiredBoolean(waypoint, "hasTeahouse", waypointPath);
      if (!SIGNALS.has(waypoint.signal as string)) {
        error(`${waypointPath}.signal`, "is not a valid signal");
      }
    });

    if (!Array.isArray(value.stages)) {
      error(`${path}.stages`, "must be an array");
    } else {
      const waypointIds = new Set(
        value.waypoints
          .filter(isRecord)
          .map((waypoint) => waypoint.id)
          .filter((id): id is string => typeof id === "string"),
      );
      value.stages.forEach((stage, index) => {
        const stagePath = `${path}.stages[${index}]`;
        if (!isRecord(stage)) {
          error(stagePath, "must be an object");
          return;
        }
        requiredNumber(stage, "day", stagePath);
        requiredString(stage, "fromId", stagePath);
        requiredString(stage, "toId", stagePath);
        if (typeof stage.fromId === "string" && !waypointIds.has(stage.fromId)) {
          error(`${stagePath}.fromId`, "does not reference a waypoint");
        }
        if (typeof stage.toId === "string" && !waypointIds.has(stage.toId)) {
          error(`${stagePath}.toId`, "does not reference a waypoint");
        }
        requiredNumber(stage, "distanceKm", stagePath);
        requiredNumber(stage, "ascentM", stagePath);
        requiredNumber(stage, "descentM", stagePath);
        requiredNumber(stage, "hours", stagePath);
        validateAltitude(stage.sleepAltM, `${stagePath}.sleepAltM`);
        requiredBoolean(stage, "isAcclimatization", stagePath);
      });
    }
  }
  validateStringArray(value.hazards, `${path}.hazards`);
  requiredString(value, "tilesUrl", path);
  if (
    requiredNumber(value, "tilesBytes", path) &&
    typeof value.tilesBytes === "number" &&
    value.tilesBytes <= 0
  ) {
    error(`${path}.tilesBytes`, "must be greater than zero");
  }
  return true;
}

function validateResource(
  value: unknown,
  path: string,
  ids: Set<string>,
): void {
  if (!isRecord(value)) {
    error(path, "must be an object");
    return;
  }
  requiredString(value, "id", path);
  if (typeof value.id === "string" && ids.has(value.id)) {
    error(path, `duplicate resource id "${value.id}"`);
  }
  if (typeof value.id === "string") {
    ids.add(value.id);
  }
  requiredString(value, "name", path);
  if (!RESOURCE_KINDS.has(value.kind as string)) {
    error(`${path}.kind`, "is not a valid resource kind");
  }
  validateCoordinate(
    value.lat,
    value.lng,
    path,
    value.kind === "embassy",
  );
  if (hasOwn(value, "altM") && value.altM !== undefined) {
    validateAltitude(value.altM, `${path}.altM`);
  }
  requiredString(value, "region", path);
  if (hasOwn(value, "phone") && value.phone !== undefined) {
    if (typeof value.phone !== "string" || !PHONE_PATTERN.test(value.phone)) {
      error(`${path}.phone`, "must be a valid E.164 number");
    }
  }
  if (hasOwn(value, "seasonal") && value.seasonal !== undefined) {
    requiredString(value, "seasonal", path);
  }
  if (hasOwn(value, "notes") && value.notes !== undefined) {
    requiredString(value, "notes", path);
  }
  // null = "unverified" badge; a phone number must always carry a verified source.
  validateVerification(value.verified, `${path}.verified`, hasOwn(value, "phone"));
}

function validateRouteIndex(): Set<string> {
  const fullRouteIds = new Set<string>();
  const value = readJson(ROUTE_INDEX_PATH);
  if (!Array.isArray(value)) {
    if (value !== null) {
      error(ROUTE_INDEX_PATH, "must contain an array");
    }
    return fullRouteIds;
  }

  const ids = new Set<string>();
  value.forEach((route, index) => {
    const path = `${ROUTE_INDEX_PATH}[${index}]`;
    if (validateRouteSummary(route, path) && isRecord(route)) {
      if (typeof route.id === "string" && ids.has(route.id)) {
        error(path, `duplicate route id "${route.id}"`);
      }
      if (typeof route.id === "string") {
        ids.add(route.id);
        if (route.hasFullData === true) {
          fullRouteIds.add(route.id);
        }
      }
    }
  });
  return fullRouteIds;
}

function validateRouteFiles(fullRouteIds: Set<string>): void {
  if (!existsSync(ROUTES_DIR)) {
    return;
  }

  const routeFiles = readdirSync(ROUTES_DIR).filter(
    (file) => file.endsWith(".json") && file !== "index.json",
  );
  const seenIds = new Set<string>();
  for (const file of routeFiles) {
    const path = join(ROUTES_DIR, file);
    const route = readJson(path);
    if (!validateRouteDetail(route, path) || !isRecord(route)) {
      continue;
    }
    const expectedId = file.slice(0, -".json".length);
    if (route.id !== expectedId) {
      error(path, `id must match filename "${expectedId}"`);
    }
    if (typeof route.id === "string") {
      if (seenIds.has(route.id)) {
        error(path, `duplicate route detail id "${route.id}"`);
      }
      seenIds.add(route.id);
      if (fullRouteIds.size > 0 && !fullRouteIds.has(route.id)) {
        error(path, "is not marked hasFullData in route index");
      }
    }
  }

  for (const id of fullRouteIds) {
    const path = join(ROUTES_DIR, `${id}.json`);
    if (!existsSync(path)) {
      error(path, "full route listed in index is missing");
    }
  }
}

function validateResources(): void {
  const value = readJson(RESOURCES_PATH);
  if (!Array.isArray(value)) {
    if (value !== null) {
      error(RESOURCES_PATH, "must contain an array");
    }
    return;
  }

  const ids = new Set<string>();
  value.forEach((resource, index) => {
    validateResource(resource, `${RESOURCES_PATH}[${index}]`, ids);
  });
}

const fullRouteIds = validateRouteIndex();
validateRouteFiles(fullRouteIds);
validateResources();

if (errors.length > 0) {
  console.error(`Static data validation failed with ${errors.length} error(s):`);
  for (const message of errors) {
    console.error(`- ${message}`);
  }
  process.exitCode = 1;
} else {
  console.log("Static data validation passed.");
}
