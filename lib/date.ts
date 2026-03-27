import { getISODay } from "date-fns";

/** Store and compare booking days as UTC midnight for a calendar YYYY-MM-DD. */
export function parseDateKeyUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/** ISO weekday: Monday = 1 … Sunday = 7 (matches seed availability). */
export function isoWeekdayFromDateKey(dateStr: string): number {
  return getISODay(parseDateKeyUtc(dateStr));
}
