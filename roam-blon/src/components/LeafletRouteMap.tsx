"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { resolveCoords, TOWN_PROPER_COORDS as TOWN_CENTER } from "@/lib/coordinates";

interface LeafletRouteMapProps {
  destination?: {
    id?: string;
    name: string;
    address?: string;
    barangay?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  } | null;
  allDestinations?: any[];
}

// Romblon Town Proper default center coordinates
const TOWN_PROPER_COORDS: [number, number] = [TOWN_CENTER.lat, TOWN_CENTER.lng];

type MapView = "street" | "satellite";

export default function LeafletRouteMap({ destination, allDestinations = [] }: LeafletRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapView, setMapView] = useState<MapView>("street");
  const mapViewRef = useRef<MapView>("street");

  const isOverview = !destination;

  // Resolve target coordinates from the shared coordinate registry (id + name aware)
  const resolved = resolveCoords(destination || undefined);
  const destCoords: [number, number] = [resolved.lat, resolved.lng];

  // Address fallbacks
  const address = destination?.address || destination?.location || destination?.barangay || "Romblon Island, Romblon, Philippines";

  const applyView = (L: any, map: any, view: MapView) => {
    if (streetLayerRef.current) {
      map.removeLayer(streetLayerRef.current);
      streetLayerRef.current = null;
    }
    if (satelliteLayerRef.current) {
      map.removeLayer(satelliteLayerRef.current);
      satelliteLayerRef.current = null;
    }

    if (view === "satellite") {
      satelliteLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);
    } else {
      streetLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }
  };

  // Initialize Leaflet Map dynamically
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let isMounted = true;

    import("leaflet").then((LModule) => {
      const L = LModule.default || LModule;
      if (!isMounted || !mapContainerRef.current) return;

      // Reset existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: isOverview ? TOWN_PROPER_COORDS : destCoords,
        zoom: isOverview ? 12 : 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      applyView(L, map, mapViewRef.current);

      // Classic location-pin icon (teardrop with a shadowed tip)
      const createCustomIcon = (color: string, label: string, showLabel = true) => {
        const safeLabel = (label || "").replace(/"/g, "'");
        return L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="position: relative; transform: translate(-50%, -100%);">
              <div style="position: absolute; top: 34px; left: 50%; width: 14px; height: 14px; background: rgba(0,0,0,0.25); border-radius: 50%; filter: blur(2px); transform: translateX(-50%);"></div>
              <svg width="44" height="52" viewBox="0 0 44 52" style="display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                <path d="M22 0C9.85 0 0 9.85 0 22c0 15 18.5 28.5 21.2 30.6a1.2 1.2 0 0 0 1.6 0C25.5 50.5 44 37 44 22 44 9.85 34.15 0 22 0z" fill="${color}"/>
                <circle cx="22" cy="22" r="9" fill="#ffffff"/>
              </svg>
              ${showLabel ? `<div style="position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: ${color}; color: white; padding: 3px 10px; border-radius: 999px; font-weight: 900; font-size: 11px; font-family: sans-serif; border: 2px solid white; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">${safeLabel}</div>` : ""}
            </div>`,
          iconSize: [44, 52],
          iconAnchor: [22, 52],
        });
      };

      if (isOverview) {
        // Overview mode: show a destination pin for every known spot
        const seen = new Set<string>();
        allDestinations.forEach((d: any) => {
          if (!d || !d.name || seen.has(d.name)) return;
          seen.add(d.name);
          const c = resolveCoords(d);
          L.marker([c.lat, c.lng], {
            icon: createCustomIcon("#e11d48", d.name, false),
          }).addTo(map).bindPopup(`<b>${d.name}</b><br/>${d.address || d.location || d.barangay || ""}`);
        });
        setMapLoaded(true);
        return;
      }

      // Single destination marker — this is the actual location
      L.marker(destCoords, {
        icon: createCustomIcon("#e11d48", destination.name),
      }).addTo(map).bindPopup(`<b>${destination.name}</b><br/>${address}`).openPopup();

      setMapLoaded(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        streetLayerRef.current = null;
        satelliteLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, isOverview]);

  // Swap Street / Satellite layers when toggled
  useEffect(() => {
    if (mapInstanceRef.current && typeof window !== "undefined") {
      const L = (window as any).L;
      if (L) applyView(L, mapInstanceRef.current, mapView);
    }
    mapViewRef.current = mapView;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapView]);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden space-y-0 text-slate-800">
      {/* Header */}
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {isOverview ? (
          <div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Map of Romblon</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              Explore the Marble Capital's Top Destinations
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{destination.name}</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              {address}
            </p>
          </div>
        )}

        {/* Street / Satellite toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full shadow-sm p-1">
          <span className="pl-2 pr-1 text-slate-400"><Layers size={14} /></span>
          <button
            onClick={() => setMapView("street")}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mapView === "street" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapView("satellite")}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mapView === "satellite" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[360px] md:h-[420px] bg-slate-100 group">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 font-black uppercase text-xs tracking-widest">
            Loading Map...
          </div>
        )}

        {/* Map Floating Legend */}
        {!isOverview && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto z-[400] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-[10px] font-black text-slate-700 flex items-center gap-3">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shrink-0" />
              <span className="truncate">{destination.name} · {address}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
