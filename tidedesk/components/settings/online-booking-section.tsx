"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";

type Props = {
  slug: string | null;
  onlineBookingEnabled?: boolean;
  onlineBookingMessage?: string | null;
  businessHoursOpen?: number | null;
  businessHoursClose?: number | null;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, "0")}:00`,
}));

export function OnlineBookingSection({
  slug,
  onlineBookingEnabled = true,
  onlineBookingMessage,
  businessHoursOpen,
  businessHoursClose,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(onlineBookingEnabled);
  const [message, setMessage] = useState(onlineBookingMessage ?? "");
  const [openHour, setOpenHour] = useState<number | "">(businessHoursOpen ?? 7);
  const [closeHour, setCloseHour] = useState<number | "">(businessHoursClose ?? 17);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL ?? "https://yoursite.com"
  );

  useEffect(() => {
    setEnabled(onlineBookingEnabled);
    setMessage(onlineBookingMessage ?? "");
    setOpenHour(businessHoursOpen ?? 7);
    setCloseHour(businessHoursClose ?? 17);
  }, [onlineBookingEnabled, onlineBookingMessage, businessHoursOpen, businessHoursClose]);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const bookingUrl = slug ? `${baseUrl}/book/${slug}` : null;
  const embedUrl = slug ? `${baseUrl}/book/${slug}?embed=1` : null;

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const oh = openHour === "" ? 7 : Number(openHour);
    const ch = closeHour === "" ? 17 : Number(closeHour);
    if (ch <= oh) {
      setSaveError("Close hour must be after open hour.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          onlineBookingEnabled: enabled,
          onlineBookingMessage: message.trim() || null,
          businessHoursOpen: openHour === "" ? null : Number(openHour),
          businessHoursClose: closeHour === "" ? null : Number(closeHour),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setSaveError(data?.error ?? "Failed to save");
        return;
      }
      router.refresh();
    } catch {
      setSaveError("Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!slug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Online booking</CardTitle>
          <CardDescription>
            Your business needs a unique URL (slug) to enable online booking. This is set during
            onboarding.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Online booking</CardTitle>
        <CardDescription>
          Enable or disable public booking, set a custom message, and configure booking hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="online-booking-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="online-booking-enabled" className="cursor-pointer font-medium">
              Enable online booking
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            When disabled, visitors see your custom message instead of the booking form.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="online-booking-message">Custom message (when disabled)</Label>
            <textarea
              id="online-booking-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Online booking is temporarily closed. Call us to book!"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <Label>Booking hours (local timezone)</Label>
            <p className="text-sm text-muted-foreground">
              Time slots are only offered within these hours. Leave blank for 7:00–17:00.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="hours-open" className="text-muted-foreground text-xs">
                  Open
                </Label>
                <select
                  id="hours-open"
                  value={openHour === "" ? "" : openHour}
                  onChange={(e) =>
                    setOpenHour(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-muted-foreground">–</span>
              <div className="flex items-center gap-2">
                <Label htmlFor="hours-close" className="text-muted-foreground text-xs">
                  Close
                </Label>
                <select
                  id="hours-close"
                  value={closeHour === "" ? "" : closeHour}
                  onChange={(e) =>
                    setCloseHour(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </form>

        <hr className="border-t" />

        <div className="grid gap-2">
          <Label>Booking page URL</Label>
          <div className="flex gap-2">
            <Input readOnly value={bookingUrl ?? ""} className="font-mono text-sm" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => bookingUrl && copyToClipboard(bookingUrl)}
              title="Copy URL"
            >
              <Copy className="size-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={bookingUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Embed URL (iframe)</Label>
          <div className="flex gap-2">
            <Input readOnly value={embedUrl ?? ""} className="font-mono text-sm" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => embedUrl && copyToClipboard(embedUrl)}
              title="Copy embed URL"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use this URL in an iframe to embed booking on your website.
          </p>
        </div>
        {copied && (
          <p className="text-sm text-green-600 dark:text-green-400">Copied to clipboard</p>
        )}
      </CardContent>
    </Card>
  );
}
