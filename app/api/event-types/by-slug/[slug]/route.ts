import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { slug: string } };

/** Public: event type + host name for booking page */
export async function GET(_req: Request, context: Ctx) {
  try {
    const { slug } = context.params;
    const event = await prisma.eventType.findUnique({
      where: { slug },
      include: { user: { select: { name: true, timezone: true } } },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: event.id,
      title: event.title,
      description: event.description,
      duration: event.duration,
      bufferBefore: event.bufferBefore,
      bufferAfter: event.bufferAfter,
      slug: event.slug,
      hostName: event.user.name,
      timezone: event.user.timezone,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
