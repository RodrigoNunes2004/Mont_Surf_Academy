"use client";

import { useEffect, useSyncExternalStore } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export default function OfflinePage() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => false,
  );

  useEffect(() => {
    if (isOnline) {
      const t = setTimeout(() => window.location.replace("/dashboard"), 1500);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="rounded-full bg-muted p-6">
        <WifiOff className="size-12 text-muted-foreground" />
      </div>

      <div className="max-w-sm space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          You&apos;re offline
        </h1>
        <p className="text-muted-foreground">
          {isOnline
            ? "Connection restored — redirecting…"
            : "Check your internet connection. Any changes you made will sync automatically when you're back online."}
        </p>
      </div>

      {!isOnline && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      )}

      {isOnline && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span className="size-2 animate-pulse rounded-full bg-green-500" />
          Reconnected
        </div>
      )}
    </div>
  );
}
