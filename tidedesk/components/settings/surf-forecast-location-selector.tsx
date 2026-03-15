"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin, Loader2, Search } from "lucide-react";

export type SurfSpot = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string | null;
  country: string;
};

type SurfForecastLocationSelectorProps = {
  latitude: number | null;
  longitude: number | null;
  windguruSpotId: string | null;
  onSelect: (spot: { latitude: number; longitude: number; windguruSpotId: string }) => void;
};

export function SurfForecastLocationSelector({
  latitude,
  longitude,
  windguruSpotId,
  onSelect,
}: SurfForecastLocationSelectorProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loadingSpot, setLoadingSpot] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SurfSpot[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Resolve spot name from windguruSpotId
  useEffect(() => {
    if (!windguruSpotId?.trim()) {
      setDisplayName(null);
      return;
    }
    const id = Number(windguruSpotId);
    if (!Number.isInteger(id)) {
      setDisplayName(null);
      return;
    }
    let cancelled = false;
    setLoadingSpot(true);
    fetch(`/api/surf-spots/${id}`)
      .then((r) => r.json())
      .then((data: { data?: SurfSpot }) => {
        if (cancelled) return;
        setDisplayName(data.data?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setDisplayName(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSpot(false);
      });
    return () => { cancelled = true; };
  }, [windguruSpotId]);

  // Search when query changes (debounced)
  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/surf-spots/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { data?: SurfSpot[] };
      setSearchResults(data.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleUseMyLocation = () => {
    setGeoError(null);
    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(`/api/surf-spots/nearest?lat=${lat}&lon=${lon}`);
          const data = (await res.json()) as { data?: SurfSpot };
          if (data.data) {
            onSelect({
              latitude: data.data.latitude,
              longitude: data.data.longitude,
              windguruSpotId: String(data.data.id),
            });
          } else {
            setGeoError("No surf spot found nearby.");
          }
        } catch {
          setGeoError("Failed to find nearest surf spot.");
        } finally {
          setGeoLoading(false);
          setSearchOpen(false);
        }
      },
      () => {
        setGeoError("Could not get your location. Check browser permissions.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSelectSpot = (spot: SurfSpot) => {
    onSelect({
      latitude: spot.latitude,
      longitude: spot.longitude,
      windguruSpotId: String(spot.id),
    });
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="grid gap-3 sm:col-span-2">
      <Label>Surf forecast location</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-h-9 flex flex-1 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
          {loadingSpot ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </span>
          ) : displayName ? (
            <span className="font-medium">{displayName}</span>
          ) : latitude != null && longitude != null ? (
            <span className="text-muted-foreground">
              {latitude.toFixed(4)}, {longitude.toFixed(4)} — select a spot below
            </span>
          ) : (
            <span className="text-muted-foreground">Not set</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
          >
            {geoLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MapPin className="size-4" />
            )}
            <span className="ml-1.5">Use my location</span>
          </Button>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Search className="size-4" />
                <span className="ml-1.5">Search beach or city</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search beach or surf spot…"
                  value={searchQuery}
                  onValueChange={(v) => {
                    setSearchQuery(v);
                    search(v);
                  }}
                  onBlur={() => {}}
                />
                <CommandList>
                  <CommandEmpty>
                    {searching ? "Searching…" : searchQuery.length < 2 ? "Type 2+ characters" : "No spots found"}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchResults.map((spot) => (
                      <CommandItem
                        key={spot.id}
                        value={`${spot.id}`}
                        onSelect={() => handleSelectSpot(spot)}
                        className="cursor-pointer"
                      >
                        <span className="font-medium">{spot.name}</span>
                        {spot.region && (
                          <span className="ml-2 text-muted-foreground">
                            ({spot.region}, {spot.country})
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {geoError && (
        <p className="text-xs text-destructive">{geoError}</p>
      )}
      {displayName && windguruSpotId && (
        <a
          href={`https://www.windguru.cz/${windguruSpotId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View forecast on WindGuru →
        </a>
      )}
    </div>
  );
}
