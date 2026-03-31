"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { skipWaiting } from "@/lib/pwa/register-sw";

export function UpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:inset-x-auto sm:right-4 sm:left-auto sm:w-80">
      <RefreshCw className="size-5 shrink-0 text-sky-500" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Update available</p>
        <p className="text-muted-foreground">
          A new version of TideDesk is ready.
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          skipWaiting();
          window.location.reload();
        }}
      >
        Update
      </Button>
    </div>
  );
}
