const km = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 4940 → "4,940 m" */
export const formatAltitude = (m: number) => `${whole.format(m)} m`;

/** 530 → "+530 m", -120 → "−120 m" */
export const formatGain = (m: number) =>
  `${m > 0 ? "+" : m < 0 ? "−" : ""}${whole.format(Math.abs(m))} m`;

/** 12.34 → "12.3 km" */
export const formatKm = (value: number) => `${km.format(value)} km`;

/** Display time in Nepal (UTC+5:45); data is stored in UTC. */
export const formatNepalTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/** "just now", "3 min ago", "2 h ago", "1 d ago" (for freshness labels). */
export const formatAgo = (iso: string, nowMs: number) => {
  const min = Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 1440) return `${Math.floor(min / 60)} h ago`;
  return `${Math.floor(min / 1440)} d ago`;
};

/** 27.98813, 86.925 → "27.9881° N, 86.9250° E" */
export const formatCoords = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
