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
  "sd-dc-logbon": { lat: 12.5905, lng: 122.2420 },    // DC Munting Paraiso, Logbon Island
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
