import { prisma } from "@/lib/prisma";

/**
 * Haversine distance (km) between two points.
 * Used to find the nearest surf spot to given coordinates.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type SurfSpotResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string | null;
  country: string;
};

/**
 * Find the nearest surf spot to the given coordinates.
 * Queries the SurfSpot table and returns the closest match by Haversine distance.
 */
export async function findNearestSpot(
  latitude: number,
  longitude: number
): Promise<SurfSpotResult | null> {
  // Adapter-based client loses SurfSpot in generated types; cast to access at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spots = await (prisma as any).surfSpot.findMany({
    select: { id: true, name: true, latitude: true, longitude: true, region: true, country: true },
  });

  if (spots.length === 0) return null;

  let nearest: (typeof spots)[0] | null = null;
  let minDistance = Infinity;

  for (const spot of spots) {
    const distance = haversineDistance(
      latitude,
      longitude,
      spot.latitude,
      spot.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = spot;
    }
  }

  return nearest;
}
