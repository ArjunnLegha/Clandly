import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const rows = await prisma.availability.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type AvailabilityInput = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function isValidHHmm(v: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
}

function validateNoOverlap(items: AvailabilityInput[]): string | null {
  const byDay = new Map<number, AvailabilityInput[]>();
  for (const i of items) {
    const arr = byDay.get(i.dayOfWeek) ?? [];
    arr.push(i);
    byDay.set(i.dayOfWeek, arr);
  }

  for (const [day, rows] of byDay.entries()) {
    rows.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx];
      if (row.startTime >= row.endTime) return `Invalid time range on day ${day}`;
      if (idx > 0 && rows[idx - 1].endTime > row.startTime) {
        return `Overlapping time ranges on day ${day}`;
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const userId = await requireCurrentUserId();
    const body = await req.json();
    const items: AvailabilityInput[] = Array.isArray(body.availabilities) ? body.availabilities : [];
    const disabledDays: number[] = Array.isArray(body.disabledDays)
      ? body.disabledDays.filter((d: unknown) => typeof d === "number")
      : [];

    for (const row of items) {
      if (
        typeof row.dayOfWeek !== "number" ||
        row.dayOfWeek < 1 ||
        row.dayOfWeek > 7 ||
        typeof row.startTime !== "string" ||
        typeof row.endTime !== "string" ||
        !isValidHHmm(row.startTime) ||
        !isValidHHmm(row.endTime)
      ) {
        return NextResponse.json({ error: "Invalid availability row" }, { status: 400 });
      }
    }

    const overlapError = validateNoOverlap(items);
    if (overlapError) {
      return NextResponse.json({ error: overlapError }, { status: 400 });
    }

    const touchedDays = Array.from(new Set(items.map((i) => i.dayOfWeek).concat(disabledDays)));
    await prisma.$transaction(async (tx) => {
      if (touchedDays.length > 0) {
        await tx.availability.deleteMany({
          where: {
            userId,
            dayOfWeek: { in: touchedDays },
          },
        });
      }

      if (items.length > 0) {
        await tx.availability.createMany({
          data: items.map((a) => ({
            userId,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
        });
      }
    });

    const rows = await prisma.availability.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
