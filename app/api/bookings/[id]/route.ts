import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, context: Ctx) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = context.params;
    const body = await req.json();
    const status = String(body.status ?? "");

    if (status !== "cancelled") {
      return NextResponse.json({ error: "Only status cancelled is supported" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!booking || booking.eventType.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
