"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/pwa/use-online-status";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-medium text-white shadow-md">
      <WifiOff className="size-4" />
      You&apos;re offline — cached data is shown. Changes will sync when back
      online.
    </div>
  );
}
