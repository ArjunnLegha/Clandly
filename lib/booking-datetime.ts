import type { Booking } from "@prisma/client";

export function bookingDateTimeUtc(booking: Pick<Booking, "date" | "startTime">): Date {
  return booking.date;
}
