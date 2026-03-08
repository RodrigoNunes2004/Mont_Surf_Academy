"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Business = {
  id: string;
  name: string;
  location?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  timezone?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const TIMEZONES = [
  "Pacific/Auckland",
  "Pacific/Chatham",
  "Australia/Sydney",
  "Australia/Melbourne",
  "UTC",
];

const CURRENCIES = ["NZD", "AUD", "USD", "EUR", "GBP"];

type FieldErrors = Partial<Record<string, string>>;

export function BusinessProfileForm({ business }: { business: Business }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: business.name ?? "",
    location: business.location ?? "",
    contactEmail: business.contactEmail ?? "",
    phone: business.phone ?? "",
    address: business.address ?? "",
    timezone: business.timezone ?? "Pacific/Auckland",
    currency: business.currency ?? "NZD",
    latitude: business.latitude != null ? String(business.latitude) : "",
    longitude: business.longitude != null ? String(business.longitude) : "",
  });

  function validateForm(): boolean {
    const err: FieldErrors = {};
    const lat = form.latitude.trim();
    const lng = form.longitude.trim();
    if (lat) {
      const n = Number(lat);
      if (Number.isNaN(n) || n < -90 || n > 90) {
        err.latitude = "Must be between -90 and 90";
      }
    }
    if (lng) {
      const n = Number(lng);
      if (Number.isNaN(n) || n < -180 || n > 180) {
        err.longitude = "Must be between -180 and 180";
      }
    }
    if (lat && !lng) err.longitude = "Required when latitude is set";
    if (!lat && lng) err.latitude = "Required when longitude is set";
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          location: form.location.trim() || undefined,
          contactEmail: form.contactEmail.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          timezone: form.timezone || undefined,
          currency: form.currency || undefined,
          latitude: form.latitude.trim() ? Number(form.latitude) : null,
          longitude: form.longitude.trim() ? Number(form.longitude) : null,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Failed to save.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 max-w-xl">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Location & weather */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Location & weather
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="grid gap-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={form.latitude}
              onChange={(e) => {
                setForm((f) => ({ ...f, latitude: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, latitude: undefined }));
              }}
              placeholder="-37.639"
              aria-invalid={!!fieldErrors.latitude}
              aria-describedby={fieldErrors.latitude ? "latitude-error" : "latitude-hint"}
            />
            {fieldErrors.latitude ? (
              <p id="latitude-error" className="text-xs text-destructive">
                {fieldErrors.latitude}
              </p>
            ) : (
              <p id="latitude-hint" className="text-xs text-muted-foreground">
                Mount Maunganui ≈ -37.639
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={form.longitude}
              onChange={(e) => {
                setForm((f) => ({ ...f, longitude: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, longitude: undefined }));
              }}
              placeholder="176.185"
              aria-invalid={!!fieldErrors.longitude}
              aria-describedby={fieldErrors.longitude ? "longitude-error" : "longitude-hint"}
            />
            {fieldErrors.longitude ? (
              <p id="longitude-error" className="text-xs text-destructive">
                {fieldErrors.longitude}
              </p>
            ) : (
              <p id="longitude-hint" className="text-xs text-muted-foreground">
                Mount Maunganui ≈ 176.185
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact & business */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Contact & business
        </h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Business name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Surf School"
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                placeholder="hello@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+64 9 123 4567"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="123 Beach Rd, Auckland"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">City / Region</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Mount Maunganui"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="timezone">Time zone</Label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
