import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/slots";
import { toUTC, fromUTC, isoWeekdayInTimezone } from "@/lib/timezone";
import { addMinutes } from "date-fns";

export type SlotState = {
  utcStart: string;
  localStart: string;
  localEnd: string;
  isBooked: boolean;
};

export async function getSlotsForDate(eventTypeId: string, dateStr: string): Promise<SlotState[]> {
  const event = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
    include: { user: true },
  });
  if (!event) return [];

  const weekday = isoWeekdayInTimezone(dateStr, event.user.timezone);
  const windows = await prisma.availability.findMany({
    where: { userId: event.userId, dayOfWeek: weekday },
  });

  const dayStartUtc = toUTC(dateStr, "00:00", event.user.timezone);
  const dayEndUtc = toUTC(dateStr, "23:59", event.user.timezone);
  const booked = await prisma.booking.findMany({
    where: {
      eventTypeId,
      date: {
        gte: dayStartUtc,
        lte: dayEndUtc,
      },
      status: { not: "cancelled" },
    },
    select: { date: true, startTime: true, endTime: true },
  });

  let slots: string[] = [];
  for (const w of windows) {
    const part = generateSlots(w.startTime, w.endTime, event.duration);
    slots = slots.concat(part);
  }

  slots = Array.from(new Set(slots)).sort();
  const bookedRanges = booked.map((b) => {
    const startUtc = toUTC(fromUTC(b.date, event.user.timezone).dateKey, b.startTime, event.user.timezone);
    const startWithBuffer = addMinutes(startUtc, -event.bufferBefore);
    const endBase = toUTC(fromUTC(b.date, event.user.timezone).dateKey, b.endTime, event.user.timezone);
    const endWithBuffer = addMinutes(endBase, event.bufferAfter);
    return { startUtc: startWithBuffer, endUtc: endWithBuffer };
  });

  return slots.map((localStart) => {
    const startUtc = toUTC(dateStr, localStart, event.user.timezone);
    const localEnd = fromUTC(addMinutes(startUtc, event.duration), event.user.timezone).time;
    const endUtc = addMinutes(startUtc, event.duration);
    const isBooked = bookedRanges.some((b) => startUtc < b.endUtc && endUtc > b.startUtc);
    return {
      utcStart: startUtc.toISOString(),
      localStart,
      localEnd,
      isBooked,
    };
  });
}
