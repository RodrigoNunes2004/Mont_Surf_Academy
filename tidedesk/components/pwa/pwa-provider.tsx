"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-sw";
import { OfflineBanner } from "./offline-banner";
import { InstallPrompt } from "./install-prompt";
import { UpdatePrompt } from "./update-prompt";

/**
 * Top-level client component that boots the service worker
 * and renders PWA UI affordances (offline banner, install prompt, etc.).
 * Mount once inside the dashboard layout.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <>
      <OfflineBanner />
      <InstallPrompt />
      <UpdatePrompt />
      {children}
    </>
  );
}
