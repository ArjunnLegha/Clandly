import { NextResponse } from "next/server";
import { getSlotsForDate } from "@/lib/slots-availability";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventTypeId = searchParams.get("eventTypeId");
    const date = searchParams.get("date");
    if (!eventTypeId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "eventTypeId and date (YYYY-MM-DD) required" }, { status: 400 });
    }
    const slots = await getSlotsForDate(eventTypeId, date);
    return NextResponse.json({ slots });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
