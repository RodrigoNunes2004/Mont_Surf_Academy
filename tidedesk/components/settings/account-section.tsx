"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

type AccountSectionProps = {
  avatarUrl: string | null;
  name: string;
  email: string;
};

export function AccountSection({ avatarUrl: initialAvatarUrl, name, email }: AccountSectionProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { data?: { avatarUrl: string }; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to upload");
        return;
      }

      if (data.data?.avatarUrl) {
        setAvatarUrl(data.data.avatarUrl);
        router.refresh();
        window.location.reload(); // Reload so topbar shows new avatar (session refetches)
      }
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="size-24">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 size-9 rounded-full border-2 border-background"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            aria-label="Upload photo"
          >
            <Camera className="size-4" />
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Click the camera icon or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="underline hover:no-underline"
            >
              choose a file
            </button>{" "}
            from your folder. JPEG, PNG or WebP. Max 4MB.
          </p>
          {loading && (
            <p className="mt-1 text-sm text-muted-foreground">Uploading…</p>
          )}
        </div>
      </div>
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
