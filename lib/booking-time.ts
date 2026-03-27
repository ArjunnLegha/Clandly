import { addMinutes, format, parse } from "date-fns";

export function endTimeFromStart(startTime: string, durationMinutes: number): string {
  const base = new Date(2000, 0, 1);
  const end = addMinutes(parse(startTime, "HH:mm", base), durationMinutes);
  return format(end, "HH:mm");
}
