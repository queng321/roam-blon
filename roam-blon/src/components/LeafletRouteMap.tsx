"use client";

import { useEffect, useState, useRef } from "react";
import { LocateFixed, AlertTriangle } from "lucide-react";

interface LeafletRouteMapProps {
  destination?: {
    id?: string;
    name: string;
    address?: string;
    barangay?: string;
    location?: string;
    contact?: string;
    phone?: string;
    facebook?: string;
    facebook_url?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    howToGetThere?: string;
    route_info?: string;
    desc?: string;
    description?: string;
    info?: {
      entranceFee?: string;
      visitingHours?: string;
    };
  } | null;
  allDestinations?: any[];
}

// Romblon Town Proper default center coordinates
const TOWN_PROPER_COORDS: [number, number] = [12.5768, 122.2721];

// Default coordinates for Romblon destinations if lat/lng not specified
const DESTINATION_COORDS: Record<string, [number, number]> = {
  "sd-bonbon": [12.5804, 122.2530],       // Bonbon Beach & Sandbar
  "sd-peable": [12.5298, 122.2355],       // Peable Walk Beach Resort Ginablan
  "sd-tiamban": [12.5701, 122.2510],      // Tiamban Beach Lonos
  "sd-talipasak": [12.5350, 122.2380],     // Talipasak Beach Ginablan
  "sd-lamao": [12.5890, 122.2390],        // Lamao Beach Resort Logbon Island
  "sd-dc-logbon": [12.5920, 122.2410],    // DC Munting Paraiso Logbon
  "sd-coco": [12.5950, 122.2430],         // Coco Cabana Logbon
  "sd-reggae": [12.5580, 122.2590],       // Reggae Vibes Agpanabat
  "sd-robinson": [12.5680, 122.2490],     // Robinson's Cove Lonos
  "sd-horizon": [12.5650, 122.2470],      // Horizon Beach Resort Lonos
  "sd-fort-san-andres": [12.5788, 122.2705], // Fort San Andres
  "sd-stevejoy": [12.5320, 122.2360],    // Stevejoy Beach House Ginablan
  "sd-libtong": [12.5052, 122.2788],     // Libtong Falls, Sablayan Point
  "sd-kipot": [12.5013, 122.3136],       // Kipot River, Southeast Romblon
  "sd-cathedral": [12.5758, 122.2695],   // Saint Joseph Cathedral, Town Proper
  "sd-shopping": [12.5761, 122.2712],    // Romblon Shopping Center, Town Proper
};

export default function LeafletRouteMap({ destination, allDestinations = [] }: LeafletRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routingControlRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number]>(TOWN_PROPER_COORDS);
  const [usingGPS, setUsingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const autoFollowRef = useRef(true);

  const [distanceKm, setDistanceKm] = useState<string>("Calculating...");
  const [estimatedTime, setEstimatedTime] = useState<string>("Calculating...");
  const [mapLoaded, setMapLoaded] = useState(false);

  const isOverview = !destination;

  // Resolve target coordinates
  const targetLat = destination?.latitude || destination?.lat || (destination?.id && DESTINATION_COORDS[destination.id] ? DESTINATION_COORDS[destination.id][0] : 12.5701);
  const targetLng = destination?.longitude || destination?.lng || (destination?.id && DESTINATION_COORDS[destination.id] ? DESTINATION_COORDS[destination.id][1] : 122.2510);
  const destCoords: [number, number] = [targetLat, targetLng];

  // Address fallbacks
  const address = destination?.address || destination?.location || destination?.barangay || "Romblon Island, Romblon, Philippines";

  const setAutoFollowState = (val: boolean) => {
    autoFollowRef.current = val;
    setAutoFollow(val);
  };

  // Get User GPS Location using watchPosition
  const startGPSWatch = () => {
    if (typeof window === "undefined") return;

    // Diagnostic: figure out WHY geolocation may be blocked before requesting
    let diagnostic: string | null = null;

    // 1. Secure context (HTTPS or localhost) is REQUIRED for geolocation
    if (!window.isSecureContext) {
      diagnostic = "Geolocation needs a secure connection (HTTPS). This page is not HTTPS — host it over HTTPS or use localhost, otherwise the browser blocks location.";
    }
    // 2. Inside an iframe without the geolocation permission
    else if (window.self !== window.top) {
      diagnostic = "The map is running inside an embedded frame. The parent page must add allow=\"geolocation\" to its <iframe> tag (and the site must be HTTPS), or the browser blocks location.";
    }
    // 3. No geolocation API at all
    else if (!navigator.geolocation) {
      diagnostic = "Geolocation is not supported by this browser. Try Chrome, Edge, or Safari.";
    }

    if (diagnostic) {
      setGpsError(diagnostic);
      return;
    }

    setGpsError(null);

    // Check the browser's stored permission state before asking
    const askForLocation = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(userCoords);
          setUsingGPS(true);
          setGpsError(null);
          
          if (autoFollowRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.setView(userCoords, mapInstanceRef.current.getZoom(), { animate: true });
          }
        },
        (err) => {
          console.error("GPS Error:", err);
          if (err.code === 1) {
            // Double-check OS-level location service (common on Windows/macOS)
            let osHint = "";
            if (navigator.userAgent.indexOf("Windows") !== -1) {
              osHint = " On Windows, open Settings → Privacy & Security → Location and make sure “Location services” and “Let apps access your location” are ON. On macOS, enable System Settings → Privacy & Security → Location Services.";
            }
            setGpsError("Location access was blocked. Fix the browser permission (🔒 icon in the address bar → Location → Allow, then reload) or your device's location service." + osHint);
          } else if (err.code === 2) {
            setGpsError("Could not determine your position. Check your GPS / Wi-Fi signal and try again.");
          } else {
            setGpsError("Unable to fetch live GPS location. Using Romblon Town as the default center.");
          }
          setUserLocation(TOWN_PROPER_COORDS);
          setUsingGPS(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
      watchIdRef.current = id;
    };

    // Use the Permissions API to give a clearer first-time prompt (if available)
    try {
      if ((navigator as any).permissions?.query) {
        (navigator as any).permissions.query({ name: "geolocation" }).then((status: any) => {
          if (status.state === "denied") {
            setGpsError("You previously blocked location for this site. Open your browser settings → Site permissions → Location, choose “Allow”, reload the page, then tap “Use My Location” again.");
          } else {
            // "prompt" or "granted": call watchPosition — the browser will show its own permission popup
            askForLocation();
          }
        }).catch(() => askForLocation());
      } else {
        askForLocation();
      }
    } catch {
      askForLocation();
    }
  };

  const stopGPSWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation(TOWN_PROPER_COORDS);
    setUsingGPS(false);
    setGpsError(null);
  };

  useEffect(() => {
    // GPS is opt-in via the "Use My Location" button — don't auto-request
    // permissions on mount, otherwise the browser blocks it and every map
    // shows a "location access denied" error.
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Update routing waypoints if user location changes
  useEffect(() => {
    if (routingControlRef.current && userLocation && typeof window !== "undefined") {
      const L = (window as any).L;
      if (L && L.latLng) {
        const newStart = L.latLng(userLocation[0], userLocation[1]);
        routingControlRef.current.spliceWaypoints(0, 1, newStart);
        
        if (originMarkerRef.current) {
          originMarkerRef.current.setLatLng(newStart);
        }
      }
    }
  }, [userLocation]);

  // Initialize Leaflet Map dynamically
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (!userLocation) return; // Wait for initial location    // Load Leaflet stylesheet dynamically if missing
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    
    // Load Leaflet Routing Machine CSS
    if (!document.getElementById("leaflet-routing-css")) {
      const linkRouting = document.createElement("link");
      linkRouting.id = "leaflet-routing-css";
      linkRouting.rel = "stylesheet";
      linkRouting.href = "https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css";
      document.head.appendChild(linkRouting);
    }

    let isMounted = true;

    // Dynamically import Leaflet JS and Routing Machine
    Promise.all([
      import("leaflet"),
      import("leaflet-routing-machine" as any)
    ]).then(([LModule]) => {
      const L = LModule.default || LModule;
      if (!isMounted || !mapContainerRef.current) return;

      // Reset existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        routingControlRef.current = null;
      }

      const startCoords = userLocation;

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: isOverview ? TOWN_PROPER_COORDS : startCoords,
        zoom: isOverview ? 12 : 13,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Disable auto-follow when user drags map
      map.on('dragstart', () => {
         if (autoFollowRef.current) setAutoFollowState(false);
      });

      // Satellite tile layer (Esri World Imagery — open & free)
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);

      // Custom icon helper
      const createCustomIcon = (color: string, label: string) => {
        return L.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="background-color: ${color}; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 900; font-size: 11px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span>📍</span> ${label}
          </div>`,
          iconSize: [120, 36],
          iconAnchor: [60, 18],
        });
      };

      // Overview mode: just show the Romblon map, no destination markers
      if (isOverview) {
        setMapLoaded(true);
        return;
      }

      // User / Origin Marker
      const originLabel = usingGPS ? "Your Location" : "Town Proper";
      const originMarker = L.marker(startCoords, {
        icon: createCustomIcon("#2563eb", originLabel),
        zIndexOffset: 1000,
      }).addTo(map);
      originMarkerRef.current = originMarker;

      // Destination Marker
      const destMarker = L.marker(destCoords, {
        icon: createCustomIcon("#e11d48", destination.name),
      }).addTo(map);
      destMarker.bindPopup(`<b>${destination.name}</b><br/>${address}`).openPopup();

      // Leaflet Routing Machine Control
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(startCoords[0], startCoords[1]),
          L.latLng(destCoords[0], destCoords[1])
        ],
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
          styles: [{ color: "#e11d48", weight: 6, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        },
        createMarker: () => null, // We use our own markers
        show: false, // hide instructions
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);

      routingControlRef.current = routingControl;

      // Extract distance and time from OSRM
      routingControl.on('routesfound', function (e: any) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const summary = routes[0].summary;
          const distKm = summary.totalDistance / 1000;
          setDistanceKm(distKm.toFixed(1) + " km");
          
          let customTimeMins = Math.round((distKm / 25) * 60) + 5; // Tricycle average speed
          
          setEstimatedTime(`${customTimeMins} mins`);
        }
      });

      setMapLoaded(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        routingControlRef.current = null;
      }
    };
  }, [userLocation, destination]); // Re-run if these fundamental dependencies change

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden space-y-0 text-slate-800">
      
      {gpsError && (
        <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium leading-relaxed flex-1">{gpsError}</p>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => { setGpsError(null); startGPSWatch(); }}
              className="text-amber-700 hover:text-amber-900 font-black uppercase text-[10px] tracking-widest bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => setGpsError(null)}
              className="text-amber-500 hover:text-amber-700 font-black uppercase text-[10px] tracking-widest"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}



      {/* Mode Selector & Route Stats */}
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {isOverview ? (
          <div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Map of Romblon</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              Explore the Marble Capital's Top Destinations
            </p>
          </div>
        ) : (
        <>
        {/* Live Distance & Time Badges */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Distance</p>
            <p className="text-lg font-black text-rose-600 italic leading-none">{distanceKm}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Travel Time</p>
            <p className="text-lg font-black text-slate-900 italic leading-none">{estimatedTime}</p>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[360px] md:h-[420px] bg-slate-100 group">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 font-black uppercase text-xs tracking-widest">
            Loading Live Navigation Engine...
          </div>
        )}

        {/* Floating Map Controls */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
           {usingGPS ? (
             <button
               onClick={stopGPSWatch}
               className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-xs font-black text-slate-500 flex items-center gap-2 hover:bg-slate-50 transition-colors"
             >
               <LocateFixed size={14} /> Disable GPS
             </button>
           ) : (
             <button
               onClick={startGPSWatch}
               className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-xs font-black text-blue-600 flex items-center gap-2 hover:bg-blue-50 transition-colors"
             >
               <LocateFixed size={14} /> Use My Location
             </button>
           )}
           {!autoFollow && usingGPS && (
             <button
               onClick={() => {
                 setAutoFollowState(true);
                 if (mapInstanceRef.current && userLocation) {
                   mapInstanceRef.current.setView(userLocation, mapInstanceRef.current.getZoom(), { animate: true });
                 }
               }}
               className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-xs font-black text-blue-600 flex items-center gap-2 hover:bg-blue-50 transition-colors"
             >
               <LocateFixed size={14} /> Recenter
             </button>
           )}
        </div>

        {/* Map Floating Legend */}
        {isOverview ? (
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-[10px] font-black text-slate-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
            <span className="whitespace-nowrap">Romblon Island</span>
          </div>
        ) : (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto z-[400] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-[10px] font-black text-slate-700 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
            <span className="whitespace-nowrap">Origin ({usingGPS ? "GPS" : "Town"})</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shrink-0" />
            <span className="truncate">{destination.name}</span>
          </div>
        </div>
        )}
      </div>

    </div>
  );
}
