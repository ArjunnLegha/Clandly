"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { fromUTC } from "@/lib/timezone";

export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  duration: number;
  bufferBefore: number;
  bufferAfter: number;
  slug: string;
  hostName: string;
  timezone: string;
};

type Step = "pick" | "form" | "done";
type Slot = {
  utcStart: string;
  localStart: string;
  localEnd: string;
  isBooked: boolean;
};

function formatLocalLabel(utcIso: string): string {
  const local = fromUTC(new Date(utcIso), Intl.DateTimeFormat().resolvedOptions().timeZone);
  return local.time;
}

export function BookingFlow({ event }: { event: PublicEvent }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    date: string;
    startTime: string;
    name: string;
    email: string;
  } | null>(null);

  const monthLabel = format(month, "MMMM yyyy");

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const loadSlots = useCallback(
    async (dateStr: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const res = await fetch(
          `/api/slots?eventTypeId=${encodeURIComponent(event.id)}&date=${encodeURIComponent(dateStr)}`
        );
        if (!res.ok) throw new Error((await res.json()).error ?? "Could not load times");
        const data = await res.json();
        const raw: Slot[] = Array.isArray(data.slots) ? data.slots : [];
        const now = new Date();
        setSlots(raw.filter((s) => new Date(s.utcStart) > now));
      } catch (e) {
        setSlotsError(e instanceof Error ? e.message : "Could not load slots. Please try again.");
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [event.id]
  );

  useEffect(() => {
    if (selectedDate) {
      setSelectedSlot(null);
      loadSlots(selectedDate);
    } else {
      setSlots([]);
    }
  }, [selectedDate, loadSlots]);

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: event.id,
          name,
          email,
          date: selectedDate,
          startTime: selectedSlot.localStart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setConfirmed({
        date: selectedDate,
        startTime: selectedSlot.localStart,
        name,
        email,
      });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  const todayStart = startOfDay(new Date());

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:py-12">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm lg:sticky lg:top-20">
          <CardHeader className="p-6 pb-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <User className="h-4 w-4" />
              <span>{event.hostName}</span>
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{event.duration} minutes</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>Host timezone: {event.timezone}</span>
              </div>
            </div>
            <Separator />
            <p className="text-sm leading-relaxed text-slate-600">
              {event.description || "Pick a date and time. You will receive a confirmation after booking."}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {(error || slotsError) && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error ?? slotsError}
            </div>
          )}

          {step === "pick" && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg">Select date & time</CardTitle>
                <CardDescription>Times shown in your local timezone.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="hover:bg-slate-100"
                    onClick={() => setMonth(addMonths(month, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-slate-900">{monthLabel}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="hover:bg-slate-100"
                    onClick={() => setMonth(addMonths(month, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const isCurrentMonth = isSameMonth(day, month);
                    const disabled = isBefore(startOfDay(day), todayStart);
                    const isSelected = selectedDate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled || !isCurrentMonth}
                        onClick={() => {
                          setSelectedDate(key);
                          setStep("pick");
                        }}
                        className={[
                          "h-9 rounded-md text-sm transition-colors duration-150",
                          !isCurrentMonth ? "text-transparent pointer-events-none" : "",
                          disabled ? "text-slate-300 cursor-not-allowed" : "text-slate-900 hover:bg-slate-100",
                          isSelected && isCurrentMonth ? "bg-primary text-primary-foreground hover:bg-primary/90" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
                    </p>
                    {slotsLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-10 rounded-lg border border-slate-100 bg-slate-100/80 animate-pulse" />
                        ))}
                      </div>
                    ) : slotsError ? (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {slotsError}
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-slate-500">No slots available for this day</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {slots.map((s) => (
                          <Button
                            key={s.utcStart}
                            type="button"
                            variant={selectedSlot?.utcStart === s.utcStart ? "default" : "outline"}
                            className={[
                              "justify-center rounded-lg transition-all",
                              s.isBooked ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-100" : "hover:border-slate-400 hover:bg-slate-50",
                              selectedSlot?.utcStart === s.utcStart ? "ring-2 ring-primary/30" : "",
                            ].join(" ")}
                            disabled={s.isBooked}
                            onClick={() => {
                              setSelectedSlot(s);
                              setStep("form");
                            }}
                          >
                            {s.isBooked
                              ? `${formatLocalLabel(s.utcStart)} - ${s.localEnd} (Booked)`
                              : `${formatLocalLabel(s.utcStart)} - ${s.localEnd}`}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === "form" && selectedDate && selectedSlot && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg">Your details</CardTitle>
                <CardDescription>
                  {format(new Date(selectedDate + "T12:00:00"), "MMM d, yyyy")} at {formatLocalLabel(selectedSlot.utcStart)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-2">
                  <Label htmlFor="guest-name">Name</Label>
                  <Input
                    id="guest-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guest-email">Email</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    autoComplete="email"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("pick");
                      setSelectedSlot(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBook}
                    disabled={submitting || !name.trim() || !email.trim()}
                    className="hover:bg-primary/90"
                  >
                    {submitting ? "Booking…" : "Confirm"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "done" && confirmed && (
            <Card className="rounded-lg border-emerald-200 bg-emerald-50/60 shadow-sm">
              <CardHeader className="p-6 pb-2">
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg text-emerald-900">You are scheduled</CardTitle>
                <CardDescription className="text-emerald-800">
                  Your meeting is confirmed and the slot is now reserved.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-6 text-sm text-slate-800">
                <p>
                  <span className="font-medium">{confirmed.name}</span> ({confirmed.email})
                </p>
                <p>
                  {format(new Date(confirmed.date + "T12:00:00"), "MMMM d, yyyy")} · {confirmed.startTime} ·{" "}
                  {event.duration} min with {event.hostName}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
