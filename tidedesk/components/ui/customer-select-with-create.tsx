"use client";

import { useState, useMemo } from "react";
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

export type CustomerOption = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
};

function splitName(typed: string): { firstName: string; lastName: string } {
  const trimmed = typed.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function CustomerSelectWithCreate({
  customers,
  value,
  onValueChange,
  placeholder = "Type to search or add customer…",
  disabled,
}: {
  customers: CustomerOption[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [createdCustomers, setCreatedCustomers] = useState<CustomerOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const allCustomers = useMemo(() => {
    const fromLocal = createdCustomers.filter(
      (lc) => !customers.some((f) => f.id === lc.id),
    );
    return [...customers, ...fromLocal];
  }, [customers, createdCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const q = search.toLowerCase();
    return allCustomers.filter((c) => {
      const label = `${c.firstName} ${c.lastName} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase();
      return label.includes(q);
    });
  }, [allCustomers, search]);

  const selectedCustomer = allCustomers.find((c) => c.id === value);
  const canCreateFromTyped = search.trim().length > 0 && !filteredCustomers.some(
    (c) => `${c.firstName} ${c.lastName}`.toLowerCase() === search.trim().toLowerCase(),
  );

  async function createCustomer(firstName: string, lastName: string, phone?: string | null, email?: string | null) {
    setCreating(true);
    setAddError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        data?: CustomerOption;
        error?: string;
      } | null;
      if (!res.ok) {
        setAddError(data?.error ?? "Failed to create customer.");
        return null;
      }
      if (data?.data) {
        const created = data.data;
        setCreatedCustomers((prev) => [...prev, created]);
        onValueChange(created.id);
        setSearch("");
        setOpen(false);
        return created;
      }
    } finally {
      setCreating(false);
    }
    return null;
  }

  async function handleCreateFromTyped() {
    const { firstName, lastName } = splitName(search);
    if (!firstName) return;
    await createCustomer(firstName, lastName);
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) {
      setAddError("First and last name are required.");
      return;
    }
    const created = await createCustomer(newFirstName, newLastName, newPhone, newEmail);
    if (created) {
      setShowAddForm(false);
      setNewFirstName("");
      setNewLastName("");
      setNewPhone("");
      setNewEmail("");
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
          {selectedCustomer ? (
            <span className="truncate">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
              {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
              {selectedCustomer.email ? ` • ${selectedCustomer.email}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {showAddForm ? (
          <form onSubmit={handleCreateCustomer} className="p-3 space-y-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Add new customer (with phone/email)</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Back
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs">First name *</Label>
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-8"
                  autoFocus
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Last name *</Label>
                <Input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-8"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone"
                className="h-8"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="h-8"
              />
            </div>
            {addError && (
              <p className="text-xs text-destructive">{addError}</p>
            )}
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
              placeholder="Type name to search or create..."
              className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
          <CommandList>
            {!canCreateFromTyped && filteredCustomers.length === 0 ? (
              <CommandEmpty>No customer found. Type a name to create one.</CommandEmpty>
            ) : null}
            {canCreateFromTyped && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={handleCreateFromTyped}
                  className="text-primary font-medium"
                  disabled={creating}
                >
                  <Plus className="size-4 mr-2" />
                  Create &quot;{search.trim()}&quot; as new customer
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {filteredCustomers.map((c) => {
                const label = `${c.firstName} ${c.lastName}${
                  c.phone ? ` • ${c.phone}` : ""
                }${c.email ? ` • ${c.email}` : ""}`;
                return (
                  <CommandItem
                    key={c.id}
                    value={`${c.id}-${label}`}
                    onSelect={() => {
                      onValueChange(c.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value === c.id ? "opacity-100" : "opacity-0",
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
                <Plus className="size-4 mr-2" />
                Add with phone & email
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
