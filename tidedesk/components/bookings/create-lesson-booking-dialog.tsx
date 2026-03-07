"use client";

import { useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { CustomerSelectWithCreate } from "@/components/ui/customer-select-with-create";
import { LessonSelectWithCreate } from "@/components/ui/lesson-select-with-create";

type CustomerOption = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
};

type LessonOption = {
  id: string;
  title: string;
  durationMinutes: number;
  capacity: number | null;
  price?: unknown;
};

type InstructorOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type VariantOption = {
  id: string;
  label: string;
  categoryId: string;
  category: { id: string; name: string };
};

type CategoryOption = { id: string; name: string };

function toDateTimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateLessonBookingDialog({
  customers,
  lessons,
  instructors,
  categories: _categories,
  variants,
}: {
  customers: CustomerOption[];
  lessons: LessonOption[];
  instructors: InstructorOption[];
  categories: CategoryOption[];
  variants: VariantOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const [customerId, setCustomerId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [participants, setParticipants] = useState(1);
  const [startAt, setStartAt] = useState(toDateTimeLocalValue(now));
  const [boardVariantId, setBoardVariantId] = useState("");
  const [wetsuitVariantId, setWetsuitVariantId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "EFTPOS" | "CARD" | "ONLINE">("CASH");

  const [instructorOpen, setInstructorOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [wetsuitOpen, setWetsuitOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const [wetsuitSearch, setWetsuitSearch] = useState("");
  const [createdLessons, setCreatedLessons] = useState<LessonOption[]>([]);

  const boardVariants = variants.filter((v) => {
    const n = v.category.name.toLowerCase().trim();
    return !n.includes("wetsuit");
  });
  const wetsuitVariants = variants.filter((v) => {
    const n = v.category.name.toLowerCase();
    return n.includes("wetsuit");
  });

  const filteredBoardVariants = useMemo(() => {
    if (!boardSearch.trim()) return boardVariants;
    const q = boardSearch.toLowerCase();
    return boardVariants.filter(
      (v) =>
        v.category.name.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q),
    );
  }, [boardVariants, boardSearch]);

  const filteredWetsuitVariants = useMemo(() => {
    if (!wetsuitSearch.trim()) return wetsuitVariants;
    const q = wetsuitSearch.toLowerCase();
    return wetsuitVariants.filter((v) => v.label.toLowerCase().includes(q));
  }, [wetsuitVariants, wetsuitSearch]);

  const selectedBoard = boardVariants.find((v) => v.id === boardVariantId);
  const selectedWetsuit = wetsuitVariants.find((v) => v.id === wetsuitVariantId);

  const allLessons = useMemo(
    () => [...lessons, ...createdLessons.filter((l) => !lessons.some((x) => x.id === l.id))],
    [lessons, createdLessons],
  );
  const selectedLesson = useMemo(
    () => allLessons.find((l) => l.id === lessonId) ?? null,
    [allLessons, lessonId],
  );
  const selectedInstructor = useMemo(
    () => instructors.find((i) => i.id === instructorId) ?? null,
    [instructors, instructorId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!boardVariantId || !wetsuitVariantId) {
      setError("Select board and wetsuit sizes.");
      return;
    }
    if (!instructorId) {
      setError("Select an instructor.");
      return;
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        lessonId,
        participants,
        startAt: new Date(startAt).toISOString(),
        durationMinutes: selectedLesson?.durationMinutes ?? 60,
        instructorId,
        equipmentAllocations: [
          { equipmentVariantId: boardVariantId, quantity: participants },
          { equipmentVariantId: wetsuitVariantId, quantity: participants },
        ],
        paymentMethod,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Failed to create booking.");
      return;
    }

    setOpen(false);
    setCustomerId("");
    setLessonId("");
    setCreatedLessons([]);
    setInstructorId("");
    setParticipants(1);
    setBoardVariantId("");
    setWetsuitVariantId("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button>Add booking</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lesson booking</DialogTitle>
          <DialogDescription>
            Select board and wetsuit sizes. Equipment is reserved for the lesson time.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="customer">Customer</Label>
            <CustomerSelectWithCreate
              customers={customers}
              value={customerId}
              onValueChange={setCustomerId}
              placeholder="Type to search or add customer…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instructor">Instructor *</Label>
            <Popover open={instructorOpen} onOpenChange={setInstructorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={instructorOpen}
                  className="h-10 w-full justify-between"
                  id="instructor"
                >
                  {selectedInstructor ? (
                    <span className="truncate">
                      {selectedInstructor.firstName} {selectedInstructor.lastName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select instructor…</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search instructor..." />
                  <CommandList>
                    <CommandEmpty>No instructor found. Add instructors in Settings.</CommandEmpty>
                    <CommandGroup>
                      {instructors.map((i) => {
                        const label = `${i.firstName} ${i.lastName}`;
                        return (
                          <CommandItem
                            key={i.id}
                            value={label}
                            onSelect={() => {
                              setInstructorId(i.id);
                              setInstructorOpen(false);
                            }}
                            className="gap-2"
                          >
                            <Check
                              className={cn(
                                "size-4",
                                instructorId === i.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="truncate">{label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lesson">Lesson</Label>
            <LessonSelectWithCreate
              lessons={lessons}
              value={lessonId}
              onValueChange={setLessonId}
              onLessonCreated={(l) => setCreatedLessons((prev) => [...prev, l])}
              placeholder="Type to search or add lesson…"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="boardVariant">Board size</Label>
              <Popover open={boardOpen} onOpenChange={(o) => { setBoardOpen(o); if (!o) setBoardSearch(""); }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={boardOpen}
                    className="h-10 w-full justify-between"
                    id="boardVariant"
                  >
                    {selectedBoard ? (
                      <span className="truncate">{selectedBoard.category.name} {selectedBoard.label}</span>
                    ) : (
                      <span className="text-muted-foreground">Select board…</span>
                    )}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-[100] w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <div className="flex h-9 items-center gap-2 border-b px-3">
                      <Search className="size-4 shrink-0 opacity-50" />
                      <Input
                        value={boardSearch}
                        onChange={(e) => setBoardSearch(e.target.value)}
                        placeholder="Search boards..."
                        className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoFocus
                      />
                    </div>
                    <CommandList>
                      <CommandEmpty>
                        No board found. In Equipment, add a category named e.g. &quot;Surfboard&quot; or &quot;Softboard&quot;, then add size variants (7ft, 9ft).
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredBoardVariants.map((v) => {
                          const label = `${v.category.name} ${v.label}`;
                          return (
                            <CommandItem
                              key={v.id}
                              value={`${v.id}-${label}`}
                              onSelect={() => {
                                setBoardVariantId(v.id);
                                setBoardOpen(false);
                                setBoardSearch("");
                              }}
                              className="gap-2"
                            >
                              <Check className={cn("size-4", boardVariantId === v.id ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{label}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wetsuitVariant">Wetsuit size</Label>
              <Popover open={wetsuitOpen} onOpenChange={(o) => { setWetsuitOpen(o); if (!o) setWetsuitSearch(""); }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={wetsuitOpen}
                    className="h-10 w-full justify-between"
                    id="wetsuitVariant"
                  >
                    {selectedWetsuit ? (
                      <span className="truncate">{selectedWetsuit.label}</span>
                    ) : (
                      <span className="text-muted-foreground">Select wetsuit…</span>
                    )}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-[100] w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <div className="flex h-9 items-center gap-2 border-b px-3">
                      <Search className="size-4 shrink-0 opacity-50" />
                      <Input
                        value={wetsuitSearch}
                        onChange={(e) => setWetsuitSearch(e.target.value)}
                        placeholder="Search wetsuits..."
                        className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoFocus
                      />
                    </div>
                    <CommandList>
                      <CommandEmpty>No wetsuit found. Add equipment in Settings.</CommandEmpty>
                      <CommandGroup>
                        {filteredWetsuitVariants.map((v) => (
                          <CommandItem
                            key={v.id}
                            value={`${v.id}-${v.label}`}
                            onSelect={() => {
                              setWetsuitVariantId(v.id);
                              setWetsuitOpen(false);
                              setWetsuitSearch("");
                            }}
                            className="gap-2"
                          >
                            <Check className={cn("size-4", wetsuitVariantId === v.id ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{v.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startAt">Start</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participants">Participants</Label>
              <Input
                id="participants"
                type="number"
                min={1}
                max={100}
                value={participants}
                onChange={(e) => setParticipants(Math.trunc(Number(e.target.value)))}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <select
              id="paymentMethod"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as "CASH" | "EFTPOS" | "CARD" | "ONLINE")
              }
            >
              <option value="CASH">Cash</option>
              <option value="EFTPOS">EFTPOS</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !customerId ||
                !lessonId ||
                !instructorId ||
                !boardVariantId ||
                !wetsuitVariantId
              }
            >
              {loading ? "Creating..." : "Create booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

