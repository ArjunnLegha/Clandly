import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const items = await prisma.eventType.findMany({
      where: { userId },
      orderBy: { title: "asc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireCurrentUserId();
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const duration = Number(body.duration);
    const description = String(body.description ?? "").trim();
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

    const created = await prisma.eventType.create({
      data: {
        title,
        description,
        duration: Math.round(duration),
        bufferBefore: Math.round(bufferBefore),
        bufferAfter: Math.round(bufferAfter),
        slug,
        userId,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
