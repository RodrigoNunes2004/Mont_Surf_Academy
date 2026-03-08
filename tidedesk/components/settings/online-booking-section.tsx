"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";

type Props = {
  slug: string | null;
};

export function OnlineBookingSection({ slug }: Props) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.com";

  const bookingUrl = slug ? `${baseUrl}/book/${slug}` : null;
  const embedUrl = slug ? `${baseUrl}/book/${slug}?embed=1` : null;

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!slug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Online booking</CardTitle>
          <CardDescription>
            Your business needs a unique URL (slug) to enable online booking. This is set during onboarding.
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
          Customers can book lessons directly at this URL. Share it on your website or embed it in an iframe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Booking page URL</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={bookingUrl ?? ""}
              className="font-mono text-sm"
            />
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
            <Input
              readOnly
              value={embedUrl ?? ""}
              className="font-mono text-sm"
            />
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
