import { addMinutes, format, parse } from "date-fns";

/**
 * Generate time slot strings between start and end for a given duration (minutes).
 * Times are "HH:mm" in 24h format.
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const base = new Date(2000, 0, 1);
  const start = parse(startTime, "HH:mm", base);
  const end = parse(endTime, "HH:mm", base);
  const slots: string[] = [];

  let cursor = start;
  while (true) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (slotEnd.getTime() > end.getTime()) {
      break;
    }
    slots.push(format(cursor, "HH:mm"));
    cursor = addMinutes(cursor, durationMinutes);
  }

  return slots;
}

/** Overlap check for slot [slotStart, slotStart+duration) vs booked [b.start, b.end) */
export function filterSlotsByBookings(
  slots: string[],
  durationMinutes: number,
  bookedRanges: { startTime: string; endTime: string }[]
): string[] {
  const base = new Date(2000, 0, 1);
  return slots.filter((slot) => {
    const slotStart = parse(slot, "HH:mm", base);
    const slotEnd = addMinutes(slotStart, durationMinutes);
    return !bookedRanges.some((b) => {
      const bStart = parse(b.startTime, "HH:mm", base);
      const bEnd = parse(b.endTime, "HH:mm", base);
      return slotStart < bEnd && slotEnd > bStart;
    });
  });
}
