import { addMinutes } from "date-fns";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatTo12Hour(date: Date): string {
  return format(date, "hh:mm a");
}

/** Display a UTC instant in the viewer's timezone as 12-hour clock. */
export function convertUTCToUserTime(date: Date, userTz: string): string {
  return formatInTimeZone(date, userTz, "hh:mm a");
}

/** Start–end range from UTC start ISO and duration (minutes), both in user TZ, 12-hour. */
export function formatUtcInterval12h(utcStartIso: string, durationMinutes: number, userTz: string): string {
  const start = new Date(utcStartIso);
  const end = addMinutes(start, durationMinutes);
  return `${convertUTCToUserTime(start, userTz)} – ${convertUTCToUserTime(end, userTz)}`;
}
