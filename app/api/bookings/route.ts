import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";
import { endTimeFromStart } from "@/lib/booking-time";
import { bookingDateTimeUtc } from "@/lib/booking-datetime";
import { toUTC, fromUTC } from "@/lib/timezone";

export async function GET(req: Request) {
  try {
    const userId = await requireCurrentUserId();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "upcoming";

    const eventTypes = await prisma.eventType.findMany({
      where: { userId },
      select: { id: true },
    });
    const ids = eventTypes.map((e) => e.id);
    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const bookings = await prisma.booking.findMany({
      where: { eventTypeId: { in: ids } },
      include: {
        eventType: { select: { title: true, duration: true, slug: true } },
      },
    });

    const now = new Date();

    const withDt = bookings.map((b) => ({ b, dt: bookingDateTimeUtc(b) }));

    const filtered = withDt.filter(({ b, dt }) => {
      if (filter === "upcoming") {
        return b.status !== "cancelled" && dt >= now;
      }
      return dt < now || b.status === "cancelled";
    });

    filtered.sort((a, b) =>
      filter === "past" ? b.dt.getTime() - a.dt.getTime() : a.dt.getTime() - b.dt.getTime()
    );

    return NextResponse.json(filtered.map(({ b }) => b));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventTypeId = String(body.eventTypeId ?? "");
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const dateStr = String(body.date ?? "");
    const startTime = String(body.startTime ?? "");

    if (!eventTypeId || !name || !email || !dateStr || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const event = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: { user: { select: { timezone: true } } },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const endTime = endTimeFromStart(startTime, event.duration);
    const startUtc = toUTC(dateStr, startTime, event.user.timezone);
    if (startUtc <= new Date()) {
      return NextResponse.json({ error: "You cannot book time in the past." }, { status: 400 });
    }
    const hostLocal = fromUTC(startUtc, event.user.timezone);

    const booking = await prisma.booking.create({
      data: {
        eventTypeId,
        name,
        email,
        date: startUtc,
        startTime: hostLocal.time,
        endTime,
        status: "booked",
      },
      include: {
        eventType: { select: { title: true, duration: true, slug: true } },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "This time slot is already booked." }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
