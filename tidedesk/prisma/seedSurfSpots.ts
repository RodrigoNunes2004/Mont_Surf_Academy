/**
 * Surf spot seed data for TideDesk location selector.
 * WindGuru-compatible IDs stored in SurfSpot.id (used in Business.windguruSpotId).
 * Run via: npm run db:seed (called from prisma/seed.ts)
 */

import { prisma } from "../lib/prisma";

export type SurfSpotSeed = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  country: string;
};

export const surfSpotsSeed: SurfSpotSeed[] = [
  // New Zealand - Bay of Plenty
  { id: 172701, name: "Mount Maunganui", latitude: -37.639, longitude: 176.185, region: "Bay of Plenty", country: "NZ" },
  { id: 172702, name: "Papamoa Beach", latitude: -37.705, longitude: 176.312, region: "Bay of Plenty", country: "NZ" },
  { id: 172703, name: "Pukehina", latitude: -37.793, longitude: 176.505, region: "Bay of Plenty", country: "NZ" },
  // Waikato
  { id: 172710, name: "Raglan Manu Bay", latitude: -37.799, longitude: 174.872, region: "Waikato", country: "NZ" },
  { id: 172711, name: "Raglan Whale Bay", latitude: -37.8, longitude: 174.868, region: "Waikato", country: "NZ" },
  { id: 172712, name: "Raglan Indicators", latitude: -37.803, longitude: 174.865, region: "Waikato", country: "NZ" },
  // Auckland
  { id: 172720, name: "Piha", latitude: -36.955, longitude: 174.468, region: "Auckland", country: "NZ" },
  { id: 172721, name: "Muriwai", latitude: -36.833, longitude: 174.417, region: "Auckland", country: "NZ" },
  { id: 172722, name: "Karekare", latitude: -36.985, longitude: 174.466, region: "Auckland", country: "NZ" },
  // Northland
  { id: 172730, name: "Ahipara", latitude: -35.17, longitude: 173.156, region: "Northland", country: "NZ" },
  { id: 172731, name: "Shipwreck Bay", latitude: -35.177, longitude: 173.151, region: "Northland", country: "NZ" },
  { id: 172732, name: "Mangawhai Heads", latitude: -36.1, longitude: 174.583, region: "Northland", country: "NZ" },
  // Taranaki
  { id: 172740, name: "Fitzroy Beach", latitude: -39.047, longitude: 174.107, region: "Taranaki", country: "NZ" },
  { id: 172741, name: "Stent Road", latitude: -39.33, longitude: 173.915, region: "Taranaki", country: "NZ" },
  { id: 172742, name: "Back Beach", latitude: -39.08, longitude: 174.04, region: "Taranaki", country: "NZ" },
  // Gisborne
  { id: 172750, name: "Wainui Beach", latitude: -38.647, longitude: 178.034, region: "Gisborne", country: "NZ" },
  { id: 172751, name: "Midway Beach", latitude: -38.668, longitude: 178.018, region: "Gisborne", country: "NZ" },
  // Hawkes Bay
  { id: 172760, name: "Ocean Beach Hawkes Bay", latitude: -39.633, longitude: 176.98, region: "Hawkes Bay", country: "NZ" },
  // Wellington
  { id: 172770, name: "Lyall Bay", latitude: -41.329, longitude: 174.793, region: "Wellington", country: "NZ" },
  { id: 172771, name: "Titahi Bay", latitude: -41.102, longitude: 174.84, region: "Wellington", country: "NZ" },
  // Nelson
  { id: 172780, name: "Tahunanui Beach", latitude: -41.276, longitude: 173.233, region: "Nelson", country: "NZ" },
  // Canterbury
  { id: 172790, name: "Sumner Beach", latitude: -43.567, longitude: 172.75, region: "Canterbury", country: "NZ" },
  { id: 172791, name: "New Brighton", latitude: -43.509, longitude: 172.731, region: "Canterbury", country: "NZ" },
  // West Coast South Island
  { id: 172800, name: "Greymouth", latitude: -42.45, longitude: 171.21, region: "West Coast", country: "NZ" },
  { id: 172801, name: "Westport", latitude: -41.752, longitude: 171.603, region: "West Coast", country: "NZ" },
  // Otago
  { id: 172810, name: "St Clair Beach", latitude: -45.913, longitude: 170.471, region: "Otago", country: "NZ" },
  { id: 172811, name: "Aramoana Spit", latitude: -45.783, longitude: 170.717, region: "Otago", country: "NZ" },
  // Southland
  { id: 172820, name: "Colac Bay", latitude: -46.341, longitude: 167.936, region: "Southland", country: "NZ" },

  // Australia - NSW
  { id: 180100, name: "Bondi Beach", latitude: -33.891, longitude: 151.276, region: "NSW", country: "AU" },
  { id: 180101, name: "Manly Beach", latitude: -33.796, longitude: 151.286, region: "NSW", country: "AU" },
  { id: 180102, name: "Cronulla", latitude: -34.057, longitude: 151.152, region: "NSW", country: "AU" },
  { id: 180103, name: "Byron Bay", latitude: -28.642, longitude: 153.619, region: "NSW", country: "AU" },
  { id: 180104, name: "Lennox Head", latitude: -28.792, longitude: 153.593, region: "NSW", country: "AU" },
  // QLD
  { id: 180110, name: "Snapper Rocks", latitude: -28.164, longitude: 153.548, region: "QLD", country: "AU" },
  { id: 180111, name: "Gold Coast", latitude: -28.004, longitude: 153.432, region: "QLD", country: "AU" },
  { id: 180112, name: "Noosa", latitude: -26.396, longitude: 153.087, region: "QLD", country: "AU" },
  // VIC
  { id: 180120, name: "Bells Beach", latitude: -38.365, longitude: 144.286, region: "VIC", country: "AU" },
  { id: 180121, name: "Torquay", latitude: -38.329, longitude: 144.317, region: "VIC", country: "AU" },
  // WA
  { id: 180130, name: "Margaret River", latitude: -33.954, longitude: 115.039, region: "WA", country: "AU" },
  { id: 180131, name: "Cottesloe", latitude: -31.994, longitude: 115.757, region: "WA", country: "AU" },

  // USA - California
  { id: 190100, name: "Huntington Beach", latitude: 33.66, longitude: -117.998, region: "California", country: "US" },
  { id: 190101, name: "Malibu Surfrider", latitude: 34.038, longitude: -118.676, region: "California", country: "US" },
  { id: 190102, name: "Encinitas", latitude: 33.049, longitude: -117.292, region: "California", country: "US" },
  { id: 190103, name: "Santa Cruz", latitude: 36.951, longitude: -122.026, region: "California", country: "US" },
  // Hawaii
  { id: 190110, name: "Pipeline", latitude: 21.664, longitude: -158.051, region: "Hawaii", country: "US" },
  { id: 190111, name: "Waikiki", latitude: 21.279, longitude: -157.829, region: "Hawaii", country: "US" },
  { id: 190112, name: "Sunset Beach", latitude: 21.675, longitude: -158.037, region: "Hawaii", country: "US" },
  // East Coast
  { id: 190120, name: "Cocoa Beach", latitude: 28.32, longitude: -80.608, region: "Florida", country: "US" },
  { id: 190121, name: "Montauk", latitude: 41.071, longitude: -71.857, region: "New York", country: "US" },

  // Europe - Portugal
  { id: 200100, name: "Supertubos", latitude: 39.35, longitude: -9.379, region: "Peniche", country: "PT" },
  { id: 200101, name: "Nazaré", latitude: 39.601, longitude: -9.071, region: "Leiria", country: "PT" },
  { id: 200102, name: "Ericeira", latitude: 38.963, longitude: -9.419, region: "Lisbon", country: "PT" },
  // Spain
  { id: 200110, name: "Mundaka", latitude: 43.409, longitude: -2.696, region: "Basque Country", country: "ES" },
  { id: 200111, name: "San Sebastián", latitude: 43.318, longitude: -2.008, region: "Basque Country", country: "ES" },
  // France
  { id: 200120, name: "Hossegor", latitude: 43.66, longitude: -1.4, region: "Aquitaine", country: "FR" },
  { id: 200121, name: "Biarritz", latitude: 43.481, longitude: -1.559, region: "Aquitaine", country: "FR" },

  // Brazil
  { id: 210100, name: "Barra da Tijuca", latitude: -23.01, longitude: -43.368, region: "Rio de Janeiro", country: "BR" },
  { id: 210101, name: "Copacabana Beach", latitude: -22.971, longitude: -43.177, region: "Rio de Janeiro", country: "BR" },
  { id: 210102, name: "Itacaré", latitude: -14.279, longitude: -38.995, region: "Bahia", country: "BR" },
  { id: 210103, name: "Fernando de Noronha", latitude: -3.855, longitude: -32.425, region: "Pernambuco", country: "BR" },
];

export async function seedSurfSpots(): Promise<void> {
  // Adapter-based client loses SurfSpot in generated types; cast to access at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).surfSpot.createMany({
    data: surfSpotsSeed,
    skipDuplicates: true,
  });
  console.log(`Seeded ${surfSpotsSeed.length} surf spots`);
}
