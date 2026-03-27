"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = [
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
  { id: 7, label: "Sunday" },
];

type Row = { dayOfWeek: number; startTime: string; endTime: string; enabled: boolean };

function defaultRows(): Row[] {
  return DAYS.map((d) => ({
    dayOfWeek: d.id,
    startTime: "09:00",
    endTime: "17:00",
    enabled: d.id >= 1 && d.id <= 5,
  }));
}

export function AvailabilityClient() {
  const [rows, setRows] = useState<Row[]>(defaultRows);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/availability");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const data: { dayOfWeek: number; startTime: string; endTime: string }[] = await res.json();
      if (data.length === 0) {
        setRows(defaultRows());
        return;
      }
      const map = new Map(data.map((r) => [r.dayOfWeek, r]));
      setRows(
        DAYS.map((d) => {
          const found = map.get(d.id);
          return {
            dayOfWeek: d.id,
            startTime: found?.startTime ?? "09:00",
            endTime: found?.endTime ?? "17:00",
            enabled: !!found,
          };
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateRow(dayOfWeek: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const availabilities = rows
        .filter((r) => r.enabled)
        .map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        }));
      const disabledDays = rows.filter((r) => !r.enabled).map((r) => r.dayOfWeek);
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilities, disabledDays }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
      )}
      {saved && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
          Availability saved.
        </div>
      )}

      <Card className="border-slate-200">
        <CardContent className="pt-6 space-y-4">
          {rows.map((r) => {
            const day = DAYS.find((d) => d.id === r.dayOfWeek)?.label ?? "";
            return (
              <div
                key={r.dayOfWeek}
                className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-100 last:border-0 pb-4 last:pb-0"
              >
                <label className="flex items-center gap-3 w-40 shrink-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={r.enabled}
                    onChange={(e) => updateRow(r.dayOfWeek, { enabled: e.target.checked })}
                  />
                  <span className="font-medium text-slate-900">{day}</span>
                </label>
                <div className="flex flex-wrap items-end gap-3 flex-1">
                  <div className="grid gap-1">
                    <Label className="text-xs text-slate-500">Start</Label>
                    <Input
                      type="time"
                      value={r.startTime}
                      disabled={!r.enabled}
                      onChange={(e) => updateRow(r.dayOfWeek, { startTime: e.target.value })}
                      className="w-36"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-slate-500">End</Label>
                    <Input
                      type="time"
                      value={r.endTime}
                      disabled={!r.enabled}
                      onChange={(e) => updateRow(r.dayOfWeek, { endTime: e.target.value })}
                      className="w-36"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save availability"}
      </Button>
    </div>
  );
}
