"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [trackSizes, setTrackSizes] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/equipment-categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        trackSizes,
        ...(hourlyRate.trim() ? { hourlyRate: Number(hourlyRate) || null } : {}),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? "Failed to create category.");
      return;
    }

    setOpen(false);
    setName("");
    setHourlyRate("");
    setTrackSizes(true);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>
            Define equipment type (e.g. Softboard, Wetsuit). Size tracking
            controls whether variants use sizes (6ft, M) or not.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Softboard"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-hourly">Hourly rate (optional)</Label>
            <Input
              id="cat-hourly"
              type="number"
              min={0}
              step={0.01}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g. 15.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-hourly">Hourly rate (optional)</Label>
            <Input
              id="cat-hourly"
              type="number"
              min={0}
              step={0.01}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g. 15.00"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="track-sizes"
              checked={trackSizes}
              onChange={(e) => setTrackSizes(e.target.checked)}
              className="rounded border"
            />
            <Label htmlFor="track-sizes">Track sizes (6ft, XS, M, etc.)</Label>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
