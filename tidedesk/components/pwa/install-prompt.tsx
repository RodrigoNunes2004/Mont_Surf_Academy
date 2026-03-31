"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

const DISMISSED_KEY = "tidedesk-pwa-install-dismissed";

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const v = localStorage.getItem(DISMISSED_KEY);
    if (!v) {
      setDismissed(false);
    } else {
      const ts = Number(v);
      if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) {
        setDismissed(false);
      }
    }
  }, []);

  if (!canInstall || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:inset-x-auto sm:right-4 sm:left-auto sm:w-80">
      <Download className="size-5 shrink-0 text-sky-500" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Install TideDesk</p>
        <p className="text-muted-foreground">
          Add to home screen for offline access
        </p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await install();
          dismiss();
        }}
      >
        Install
      </Button>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
