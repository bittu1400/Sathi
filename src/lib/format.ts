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
