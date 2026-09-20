const nepal = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" });
const nepalHour = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", hourCycle: "h23" });

/** The evening check-in is due after 16:00 Nepal time when none was logged today. */
export function isCheckinDue(recordedAts: string[], now: Date): boolean {
  if (Number(nepalHour.format(now)) < 16) return false;
  const today = nepal.format(now);
  return !recordedAts.some((at) => nepal.format(new Date(at)) === today);
}
