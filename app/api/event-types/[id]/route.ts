import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";

type Ctx = { params: { id: string } };

export async function PUT(req: Request, context: Ctx) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = context.params;
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const duration = Number(body.duration);
    const bufferBefore = Number(body.bufferBefore ?? 0);
    const bufferAfter = Number(body.bufferAfter ?? 0);
    const slug = String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (
      !title ||
      !Number.isFinite(duration) ||
      duration < 5 ||
      !slug ||
      !Number.isFinite(bufferBefore) ||
      !Number.isFinite(bufferAfter) ||
      bufferBefore < 0 ||
      bufferAfter < 0
    ) {
      return NextResponse.json({ error: "Invalid title, duration, or slug" }, { status: 400 });
    }

    const existing = await prisma.eventType.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.eventType.update({
      where: { id },
      data: {
        title,
        description,
        duration: Math.round(duration),
        bufferBefore: Math.round(bufferBefore),
        bufferAfter: Math.round(bufferAfter),
        slug,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: Ctx) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = context.params;

    const existing = await prisma.eventType.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.eventType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
