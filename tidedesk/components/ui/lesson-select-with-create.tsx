"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";

export type LessonOption = {
  id: string;
  title: string;
  durationMinutes: number;
  capacity: number | null;
  price?: unknown;
};

export function LessonSelectWithCreate({
  lessons,
  value,
  onValueChange,
  onLessonCreated,
  placeholder = "Type to search or add lesson…",
  disabled,
}: {
  lessons: LessonOption[];
  value: string;
  onValueChange: (id: string) => void;
  onLessonCreated?: (lesson: LessonOption) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [createdLessons, setCreatedLessons] = useState<LessonOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("50");
  const [newDuration, setNewDuration] = useState("60");
  const [newCapacity, setNewCapacity] = useState("");

  const allLessons = useMemo(() => {
    const fromLocal = createdLessons.filter(
      (ll) => !lessons.some((l) => l.id === ll.id),
    );
    return [...lessons, ...fromLocal];
  }, [lessons, createdLessons]);

  const filteredLessons = useMemo(() => {
    if (!search.trim()) return allLessons;
    const q = search.toLowerCase();
    return allLessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        String(l.durationMinutes).includes(q) ||
        (l.capacity != null && String(l.capacity).includes(q)),
    );
  }, [allLessons, search]);

  const selectedLesson = allLessons.find((l) => l.id === value);
  const canCreateFromTyped =
    search.trim().length > 0 &&
    !filteredLessons.some(
      (l) => l.title.toLowerCase() === search.trim().toLowerCase(),
    );

  async function createLesson(
    title: string,
    price: number,
    durationMinutes: number,
    capacity: number | null,
  ) {
    setCreating(true);
    setAddError(null);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          price,
          durationMinutes,
          capacity,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        data?: LessonOption;
        error?: string;
      } | null;
      if (!res.ok) {
        setAddError(data?.error ?? "Failed to create lesson.");
        return null;
      }
      if (data?.data) {
        const created = data.data;
        setCreatedLessons((prev) => [...prev, created]);
        onValueChange(created.id);
        onLessonCreated?.(created);
        setSearch("");
        setOpen(false);
        router.refresh();
        return created;
      }
    } finally {
      setCreating(false);
    }
    return null;
  }

  async function handleCreateFromTyped() {
    const title = search.trim();
    if (!title) return;
    await createLesson(title, 50, 60, null);
  }

  async function handleCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    const price = Number(newPrice);
    const duration = Math.trunc(Number(newDuration)) || 60;
    const capacity = newCapacity.trim()
      ? Math.trunc(Number(newCapacity))
      : null;

    if (!title) {
      setAddError("Title is required.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setAddError("Enter a valid price.");
      return;
    }
    if (duration < 15 || duration > 480) {
      setAddError("Duration must be between 15 and 480 minutes.");
      return;
    }
    if (capacity !== null && (capacity < 0 || !Number.isFinite(capacity))) {
      setAddError("Capacity must be a non-negative number.");
      return;
    }

    const created = await createLesson(title, price, duration, capacity);
    if (created) {
      setShowAddForm(false);
      setNewTitle("");
      setNewPrice("50");
      setNewDuration("60");
      setNewCapacity("");
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setShowAddForm(false);
          setSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between"
          disabled={disabled}
        >
          {selectedLesson ? (
            <span className="truncate">
              {selectedLesson.title} • {selectedLesson.durationMinutes} min
              {selectedLesson.capacity ? ` • cap ${selectedLesson.capacity}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {showAddForm ? (
          <form onSubmit={handleCreateLesson} className="space-y-3 border-b p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Add lesson type (price & duration)</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Back
              </Button>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Title *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Beginner, Kids"
                className="h-8"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs">Price *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="50"
                  className="h-8"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Duration (min) *</Label>
                <Input
                  type="number"
                  min={15}
                  max={480}
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="60"
                  className="h-8"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Capacity (optional)</Label>
              <Input
                type="number"
                min={0}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                placeholder="Leave empty"
                className="h-8"
              />
            </div>
            {addError ? (
              <p className="text-xs text-destructive">{addError}</p>
            ) : null}
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? "Creating…" : "Create & select"}
            </Button>
          </form>
        ) : null}
        <Command shouldFilter={false}>
          <div className="flex h-9 items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 opacity-50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search or create..."
              className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
          <CommandList>
            {!canCreateFromTyped && filteredLessons.length === 0 ? (
              <CommandEmpty>
                No lesson found. Type a name to create one.
              </CommandEmpty>
            ) : null}
            {canCreateFromTyped && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={handleCreateFromTyped}
                  className="font-medium text-primary"
                  disabled={creating}
                >
                  <Plus className="mr-2 size-4" />
                  Create &quot;{search.trim()}&quot; as new lesson
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {filteredLessons.map((l) => {
                const label = `${l.title} • ${l.durationMinutes} min${
                  l.capacity ? ` • cap ${l.capacity}` : ""
                }`;
                return (
                  <CommandItem
                    key={l.id}
                    value={`${l.id}-${label}`}
                    onSelect={() => {
                      onValueChange(l.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value === l.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => setShowAddForm(true)}
                className="text-muted-foreground"
              >
                <Plus className="mr-2 size-4" />
                Add with price & duration
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
