// Central map-coordinate registry for Roam-Blon.
// Every tourist destination and dining spot maps its `id` to real-world
// latitude/longitude. The Leaflet map reads from here as a fallback whenever
// a destination object doesn't carry its own lat/lng.
//
// Coordinates verified against OpenStreetMap (Nominatim) and PhilAtlas.

export interface LatLng {
  lat: number;
  lng: number;
}

// Romblon Town Proper center (port / poblacion area)
export const TOWN_PROPER_COORDS: LatLng = { lat: 12.5751, lng: 122.2710 };

// Barangay centers used when a spot's exact pin isn't known
const BARANGAY: Record<string, LatLng> = {
  lonos: { lat: 12.5701, lng: 122.2560 },      // Brgy Lonos (Bonbon/Tiamban side)
  ginablan: { lat: 12.5291, lng: 122.2608 },   // Brgy Ginablan (southwest coast)
  sablayan: { lat: 12.4917, lng: 122.3146 },   // Brgy Sablayan (southeast)
  logbon: { lat: 12.5927, lng: 122.2477 },     // Logbon Island
  agpanabat: { lat: 12.4828, lng: 122.2830 },  // Brgy Agpanabat (south coast)
  lamao: { lat: 12.5624, lng: 122.2968 },      // Brgy Lamao (east coast)
  palje: { lat: 12.4907, lng: 122.2769 },      // Brgy Palje (southern coast)
  poblacion: { lat: 12.5751, lng: 122.2710 },  // Town Proper (Poblacion)
};

export const DESTINATION_COORDS: Record<string, LatLng> = {
  // Beaches & Resorts (verified via OSM)
  "sd-bonbon": { lat: 12.5717, lng: 122.2451 },       // Bonbon Beach & Sandbar, Brgy Lonos
  "sd-peable": { lat: 12.4917, lng: 122.3146 },       // Peable Walk, Sitio Lahong, Brgy Sablayan (southeast coast)
  "sd-tiamban": { lat: 12.5688, lng: 122.2500 },      // Tiamban Beach, Sitio Tiamban, Brgy Lonos
  "sd-talipasak": { lat: 12.5311, lng: 122.2511 },    // Talipasak / San Pedro Beach, Brgy Ginablan
  "sd-lamao": { lat: 12.5547, lng: 122.3097 },        // Lamao Beach Resort, Brgy Lamao (east coast)
  "sd-dc-logbon": { lat: 12.5539, lng: 122.2568 },    // DC Munting Paraiso, Brgy Agnay
  "sd-coco": { lat: 12.4907, lng: 122.2769 },         // Coco Cabana, Bantigue-Sablayan Rd, Brgy Palje (southern coast)
  "sd-reggae": { lat: 12.4828, lng: 122.2830 },       // Reggae Vibes en Isla de Romblon, Brgy Agpanabat
  "sd-robinson": { lat: 12.5500, lng: 122.2500 },     // Robinson's Cove (Marble Beach), west coast Brgy Lonos
  "sd-horizon": { lat: 12.5728, lng: 122.2514 },      // Horizon Beach Resort, Magallanes St, Brgy Lonos
  "sd-stevejoy": { lat: 12.5291, lng: 122.2608 },     // Stevejoy Beach House, Brgy Ginablan
  "sd-libtong": { lat: 12.5052, lng: 122.2788 },      // Libtong Falls, near Sablayan Point
  "sd-kipot": { lat: 12.5013, lng: 122.3136 },        // Kipot River, southeast Romblon

  // Landmarks & Town Proper (verified via OSM)
  "sd-fort-san-andres": { lat: 12.5786, lng: 122.2704 }, // Fort San Andres, San Andres Road
  "sd-cathedral": { lat: 12.5757, lng: 122.2694 },    // St. Joseph Cathedral, J.P. Rizal St
  "sd-shopping": { lat: 12.5761, lng: 122.2712 },     // Romblon Shopping Center (Freedom Park)

  // Dining spots (same id space used by DiningList / QR pages)
  bistro: { lat: 12.5758, lng: 122.2706 },            // Marble City Café & Bistro, Town Proper
  el: { lat: 12.5760, lng: 122.2710 },                // El Hotel & Restaurant, Town Proper
  gangnam: { lat: 12.5765, lng: 122.2720 },           // Gangnam Korean Grill, Town Proper
  italian: { lat: 12.5755, lng: 122.2700 },           // Italian Trattoria, Town Proper
  panublion: { lat: 12.5750, lng: 122.2705 },         // Panublion Heritage Diner, Town Proper
  sunbird: { lat: 12.5762, lng: 122.2715 },           // Sunbird Cafe & Lounge, Town Proper
  horizon: { lat: 12.5728, lng: 122.2514 },           // Horizon Seaside Restaurant (Horizon Hotel), Brgy Lonos
  mamalois: { lat: 12.5701, lng: 122.2560 },          // Mama Lois Kitchen, Brgy Lonos
  ocean: { lat: 12.5291, lng: 122.2608 },             // Ocean View Seafood Grill, Brgy Ginablan
  yurich: { lat: 12.5291, lng: 122.2608 },            // Yurich Food House, Brgy Ginablan
  reggae: { lat: 12.4828, lng: 122.2830 },            // Reggae Bar & Grill, Brgy Agpanabat
};

// Look up coordinates for any destination/dining id.
// Returns the exact pin when known, the barangay center when close, or the
// town proper center as a last resort.
export function getCoords(id?: string): LatLng {
  if (id) {
    if (DESTINATION_COORDS[id]) return DESTINATION_COORDS[id];
    const lower = id.toLowerCase();
    for (const key of Object.keys(BARANGAY)) {
      if (lower.includes(key)) return BARANGAY[key];
    }
  }
  return TOWN_PROPER_COORDS;
}

// Normalize a place name for fuzzy matching (lowercase, strip punctuation)
function normalizeName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Known name aliases → registry keys (covers DB rows and QR-scanned items
// whose `id` is a database UUID that won't match the sd-* keys).
const NAME_ALIASES: Record<string, string> = {
  "bon bon": "sd-bonbon",
  "bonbon": "sd-bonbon",
  "bonbon beach": "sd-bonbon",
  "bonbon beach and sandbar": "sd-bonbon",
  "peable": "sd-peable",
  "pebble": "sd-peable",
  "pebble walk": "sd-peable",
  "peable walk": "sd-peable",
  "pebbles": "sd-peable",
  "tiamban": "sd-tiamban",
  "tiamban beach": "sd-tiamban",
  "tiamban resort": "sd-tiamban",
  "talipasak": "sd-talipasak",
  "san pedro beach": "sd-talipasak",
  "san pedro resort": "sd-talipasak",
  "lamao": "sd-lamao",
  "lamao beach": "sd-lamao",
  "lamao beach resort": "sd-lamao",
  "dc munting": "sd-dc-logbon",
  "dc munting paraiso": "sd-dc-logbon",
  "munting paraiso": "sd-dc-logbon",
  "coco cabana": "sd-coco",
  "reggae vibes": "sd-reggae",
  "reggae vibes de isla": "sd-reggae",
  "reggae": "sd-reggae",
  "robinson": "sd-robinson",
  "robinsons cove": "sd-robinson",
  "marble beach": "sd-robinson",
  "horizon beach": "sd-horizon",
  "horizon resort": "sd-horizon",
  "horizon": "sd-horizon",
  "stevejoy": "sd-stevejoy",
  "steve joy": "sd-stevejoy",
  "libtong": "sd-libtong",
  "kipot": "sd-kipot",
  "kipot river": "sd-kipot",
  "fort san andres": "sd-fort-san-andres",
  "san andres fort": "sd-fort-san-andres",
  "fort": "sd-fort-san-andres",
  "cathedral": "sd-cathedral",
  "st joseph cathedral": "sd-cathedral",
  "saint joseph cathedral": "sd-cathedral",
  "shopping": "sd-shopping",
  "shopping center": "sd-shopping",
  "romblon shopping": "sd-shopping",
  "marble city": "bistro",
  "island bistro": "bistro",
  "bistro": "bistro",
  "el hotel": "el",
  "el restaurant": "el",
  "el krimphoff": "el",
  "gangnam": "gangnam",
  "gangnam korean": "gangnam",
  "italian": "italian",
  "italian trattoria": "italian",
  "panublion": "panublion",
  "sunbird": "sunbird",
  "mama lois": "mamalois",
  "mama lois kitchen": "mamalois",
  "ocean view": "ocean",
  "ocean view seafood": "ocean",
  "seaview": "ocean",
  "yurich": "yurich",
};

// Resolve the best known coordinates for a place, matching by id first, then
// by name, then by barangay keyword. DB rows and QR items usually only have a
// UUID id + a display name, so name matching is what keeps pins accurate.
export function resolveCoords(place?: {
  id?: string;
  name?: string;
  barangay?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}): LatLng {
  // 1. Explicit coordinates carried by the item (e.g. static data)
  const explicitLat = place?.latitude ?? place?.lat;
  const explicitLng = place?.longitude ?? place?.lng;
  if (typeof explicitLat === "number" && typeof explicitLng === "number") {
    // Sanity check: must be near Romblon island (lat 12.2–12.9, lng 121.9–122.5)
    if (explicitLat > 12 && explicitLat < 13.5 && explicitLng > 121.5 && explicitLng < 123.5) {
      return { lat: explicitLat, lng: explicitLng };
    }
  }

  // 2. Registry key match by id
  const idKey = place?.id;
  if (idKey && DESTINATION_COORDS[idKey]) return DESTINATION_COORDS[idKey];

  // 3. Name alias / fuzzy name match
  const name = normalizeName(place?.name || "");
  if (name) {
    for (const alias of Object.keys(NAME_ALIASES)) {
      const normAlias = normalizeName(alias);
      if (name.includes(normAlias) || normAlias.includes(name)) {
        return DESTINATION_COORDS[NAME_ALIASES[alias]];
      }
    }
  }

  // 4. Barangay keyword match
  const area = `${place?.barangay || ""} ${place?.location || ""} ${idKey || ""}`.toLowerCase();
  for (const key of Object.keys(BARANGAY)) {
    if (area.includes(key)) return BARANGAY[key];
  }

  // 5. Last resort: town proper
  return TOWN_PROPER_COORDS;
}
