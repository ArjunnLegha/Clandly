"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

type EventType = {
  id: string;
  title: string;
  description: string;
  duration: number;
  bufferBefore: number;
  bufferAfter: number;
  slug: string;
};

export function EventTypesClient() {
  const [items, setItems] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/event-types");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDuration(30);
    setDescription("");
    setBufferBefore(0);
    setBufferAfter(0);
    setSlug("");
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(et: EventType) {
    setEditing(et);
    setTitle(et.title);
    setDuration(et.duration);
    setDescription(et.description ?? "");
    setBufferBefore(et.bufferBefore ?? 0);
    setBufferAfter(et.bufferAfter ?? 0);
    setSlug(et.slug);
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/event-types/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, duration, bufferBefore, bufferAfter, slug }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      } else {
        const res = await fetch("/api/event-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, duration, bufferBefore, bufferAfter, slug }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      }
      setOpen(false);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event type and its booking link?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/event-types/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
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

      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New event type
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((et) => (
          <Card key={et.id} className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{et.title}</CardTitle>
              <CardDescription>
                {et.duration} minutes · Buffer {et.bufferBefore}/{et.bufferAfter} min · /book/{et.slug}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/book/${et.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Booking page
                </Link>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openEdit(et)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(et.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-slate-500">No event types yet. Create one to get a booking link.</CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event type" : "New event type"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Intro call" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this meeting is about"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="buffer-before">Buffer before (min)</Label>
                <Input
                  id="buffer-before"
                  type="number"
                  min={0}
                  step={5}
                  value={bufferBefore}
                  onChange={(e) => setBufferBefore(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="buffer-after">Buffer after (min)</Label>
                <Input
                  id="buffer-after"
                  type="number"
                  min={0}
                  step={5}
                  value={bufferAfter}
                  onChange={(e) => setBufferAfter(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-meeting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim() || !slug.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
