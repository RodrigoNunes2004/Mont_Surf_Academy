"use client";

import { Waves } from "lucide-react";

export type TideExtreme = {
  height: number;
  time: string;
  type: "high" | "low";
};

type TidePanelProps = {
  tides: TideExtreme[];
  timezone?: string;
};

/**
 * Displays tide extremes (high/low) for the next 24h in a compact, surf-focused layout.
 */
export function TidePanel({ tides, timezone = "Pacific/Auckland" }: TidePanelProps) {
  if (!tides || tides.length === 0) return null;

  // Show next 24h of tides
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const toShow = tides.filter((t) => new Date(t.time) <= cutoff);

  if (toShow.length === 0) return null;

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString(undefined, {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <span className="text-base">🌊</span>
        Tides Today
      </h3>
      <div className="flex flex-col gap-2">
        {toShow.map((tide, i) => (
          <div
            key={`${tide.time}-${i}`}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className={`w-10 font-medium capitalize shrink-0 ${
                tide.type === "high"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {tide.type}
            </span>
            <Waves className="size-3.5 text-primary shrink-0" />
            <span className="font-semibold tabular-nums w-12">
              {formatTime(tide.time)}
            </span>
            <span className="text-muted-foreground">
              {tide.height.toFixed(1)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
