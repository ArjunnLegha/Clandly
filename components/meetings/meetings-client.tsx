"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

type BookingRow = {
  id: string;
  name: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  eventType: { title: string; duration: number; slug: string };
};

export function MeetingsClient() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [items, setItems] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setItems([]);
      try {
        const res = await fetch(`/api/bookings?filter=${tab}`);
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
        const data = await res.json();
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  async function cancel(id: string) {
    if (!confirm("Cancel this meeting?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Cancel failed");
      setItems((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  function formatDate(iso: string) {
    try {
      return format(new Date(iso), "MMM d, yyyy");
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
        <Button
          type="button"
          variant={tab === "upcoming" ? "default" : "ghost"}
          size="sm"
          className="rounded-md"
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          type="button"
          variant={tab === "past" ? "default" : "ghost"}
          size="sm"
          className="rounded-md"
          onClick={() => setTab("past")}
        >
          Past
        </Button>
      </div>

      <BookingsTable
        loading={loading}
        items={items}
        formatDate={formatDate}
        onCancel={cancel}
        showCancel={tab === "upcoming"}
      />
    </div>
  );
}

function BookingsTable({
  loading,
  items,
  formatDate,
  onCancel,
  showCancel,
}: {
  loading: boolean;
  items: BookingRow[];
  formatDate: (iso: string) => string;
  onCancel: (id: string) => void;
  showCancel: boolean;
}) {
  if (loading) {
    return <p className="text-slate-500 py-8">Loading…</p>;
  }
  if (items.length === 0) {
    return <p className="py-8 text-slate-500">No meetings here.</p>;
  }
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Status</TableHead>
            {showCancel && <TableHead className="w-[100px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((b) => (
            <TableRow key={b.id}>
              <TableCell>
                <div className="font-medium text-slate-900">{b.name}</div>
                <div className="text-sm text-slate-500">{b.email}</div>
              </TableCell>
              <TableCell>{b.eventType.title}</TableCell>
              <TableCell>
                {formatDate(b.date)} · {b.startTime}–{b.endTime}
              </TableCell>
              <TableCell>
                {b.status === "cancelled" ? (
                  <Badge variant="secondary">Cancelled</Badge>
                ) : (
                  <Badge variant="default">Booked</Badge>
                )}
              </TableCell>
              {showCancel && (
                <TableCell>
                  {b.status !== "cancelled" && (
                    <Button variant="outline" size="sm" onClick={() => onCancel(b.id)}>
                      Cancel
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
