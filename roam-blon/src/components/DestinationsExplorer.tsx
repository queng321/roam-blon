"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { resolveCoords } from "@/lib/coordinates";
import {
  Star,
  Building2,
  Landmark,
  Waves,
  Trees,
  Hotel,
  MapPin,
  Eye,
  Compass,
  MessageCircle,
  Camera,
  Images,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
} from "lucide-react";
import QRItemModal from "@/components/QRItemModal";
import LeafletRouteMap from "@/components/LeafletRouteMap";
import BookingNotifications from "@/components/BookingNotifications";
import { STATIC_DESTINATIONS } from "@/data/staticDestinations";

export default function DestinationsExplorer({ tourist }: { tourist?: any }) {
  const [destinations, setDestinations] = useState<any[]>(STATIC_DESTINATIONS);
  const [destCategoryFilter, setDestCategoryFilter] = useState<string>("ALL");
  const [beachReviews, setBeachReviews] = useState<Record<string, any[]>>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [cardPhotoIdx, setCardPhotoIdx] = useState<Record<string, number>>({});
  const [activeGallery, setActiveGallery] = useState<any>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [selectedQRItem, setSelectedQRItem] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showGuideBooking, setShowGuideBooking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: dbDests } = await supabase.from("destinations").select("*");
        if (dbDests && dbDests.length > 0) {
          const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
          const baseName = (s: string) => normName(s).replace(/\s(parish|church)\s?$/, "").trim();
          const mapped = dbDests.map((d: any) => {
            const staticMatch = STATIC_DESTINATIONS.find(
              (s) =>
                s.id === d.id ||
                baseName(s.name) === baseName(d.name) ||
                (normName(d.name).length > 0 && normName(s.name).includes(normName(d.name))) ||
                (normName(s.name).length > 0 && normName(d.name).includes(normName(s.name)))
            );
            const fallbackCoords = resolveCoords(d);
            if (staticMatch) {
              return {
                ...staticMatch,
                id: d.id,
                desc: d.description || staticMatch.desc,
                barangay: d.location || staticMatch.barangay,
                category: d.category || staticMatch.category,
                image: d.image_url || staticMatch.image,
                image_url: d.image_url || staticMatch.image_url,
                latitude: fallbackCoords.lat,
                longitude: fallbackCoords.lng,
              };
            }
            return {
              id: d.id,
              name: d.name,
              barangay: d.location || "Romblon",
              address: d.location || "Romblon Island, Romblon",
              contact: "+63 976 305 9118",
              latitude: fallbackCoords.lat,
              longitude: fallbackCoords.lng,
              desc: d.description || "",
              howToGetThere: d.description?.includes("How To Get There:")
                ? d.description.split("How To Get There:")[1].trim()
                : `Take a tricycle from Romblon Town Proper to ${d.name}.`,
              tag: d.category === "Beaches" ? "Natural" : d.category || "Featured",
              type: d.category === "Resort" ? "Resort" : "Natural",
              category: d.category || "Beach",
              image: d.image_url || "/beach%26resorts/peabble.jpg",
              image_url: d.image_url || "/beach%26resorts/peabble.jpg",
              images: d.image_url
                ? [d.image_url]
                : ["/beach%26resorts/peabble.jpg", "/beach%26resorts/peabble1.jpg", "/beach%26resorts/peabble2.jpg"],
              info: {
                type: d.category || "Tourist Spot",
                access: "Tricycle",
                bestTime: "Daytime",
                entranceFee: d.entrance_fee || "Contact for details",
                visitingHours: d.visiting_hours || "8:00 AM - 5:00 PM",
                features: ["Scenic Spot", "Island Destination"],
              },
            };
          });
          setDestinations(mapped);
        }
      } catch (err) {
        console.error("Failed to load destinations", err);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchBeachReviews = async () => {
      setReviewsLoading(true);
      try {
        let remoteReviews: any[] = [];
        try {
          const res = await fetch("/api/reviews");
          if (res.ok) {
            const json = await res.json();
            if (json.data) remoteReviews = json.data.filter((r: any) => r.item_type === "destination");
          } else {
            throw new Error("API response not ok");
          }
        } catch {
          const { data } = await supabase.from("reviews").select("*").eq("item_type", "destination").order("created_at", { ascending: false });
          if (data) remoteReviews = data;
        }

        const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]");
        const localReviews = stored.filter((r: any) => r.item_type === "destination");

        const allReviews = [...remoteReviews];
        localReviews.forEach((lr: any) => {
          if (!allReviews.some((ar: any) => ar.id === lr.id || (ar.reviewer_name === lr.reviewer_name && ar.comment === lr.comment))) {
            allReviews.push(lr);
          }
        });

        const grouped: Record<string, any[]> = {};
        allReviews.forEach((r: any) => {
          if (r.item_id) {
            if (!grouped[r.item_id]) grouped[r.item_id] = [];
            grouped[r.item_id].push(r);
          }
          if (r.item_name) {
            if (!grouped[r.item_name]) grouped[r.item_name] = [];
            grouped[r.item_name].push(r);
          }
        });
        setBeachReviews(grouped);
      } catch (err) {
        console.error("Failed to load destination reviews", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchBeachReviews();
  }, []);

  const getDestReviews = (d: any) => {
    const byId = beachReviews[d.id] || [];
    const byName = beachReviews[d.name] || [];
    const combined = [...byId];
    byName.forEach((r) => {
      if (!combined.some((c) => c.id === r.id)) combined.push(r);
    });
    return combined;
  };

  return (
    <div className="min-h-screen bg-[#FAEEED]/20">
      <div className="px-4 pt-8 pb-3 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">Romblon, Philippines</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Tourist Destinations
          </h1>
          <p className="text-rose-500 font-bold text-sm tracking-widest uppercase mt-1">
            Explore the Marble Capital&apos;s Top Destinations
          </p>
        </div>
      </div>

      <div className="px-4 pb-10 max-w-7xl mx-auto">
        {/* Classification Filter Tabs */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 max-w-2xl mx-auto overflow-x-auto no-scrollbar sticky top-0 z-10">
          {[
            { id: "ALL", label: "All Destinations" },
            { id: "Beach", label: "🏖️ Beaches" },
            { id: "Resort", label: "🌴 Resorts" },
            { id: "Hotel", label: "🏨 Hotels & Stays" },
            { id: "Falls", label: "🌊 Falls" },
            { id: "Landmark", label: "🏛️ Landmarks" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setDestCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                destCategoryFilter === cat.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
          {destinations
            .map((d) => {
              const cat = (d.category || d.type || d.info?.type || "").toLowerCase();
              let classification = "Beach";
              if (cat.includes("hotel") || cat.includes("stay") || cat.includes("inn")) classification = "Hotel";
              else if (cat.includes("resort") || cat.includes("cabana")) classification = "Resort";
              else if (cat.includes("landmark") || cat.includes("fort") || cat.includes("church") || cat.includes("heritage")) classification = "Landmark";
              else if (cat.includes("fall") || cat.includes("waterfall")) classification = "Falls";
              return { ...d, classification };
            })
            .filter((d) => destCategoryFilter === "ALL" || d.classification === destCategoryFilter)
            .sort((a, b) => {
              const aReviews = getDestReviews(a);
              const bReviews = getDestReviews(b);
              const avgA = aReviews.length ? aReviews.reduce((s, r) => s + r.rating, 0) / aReviews.length : 0;
              const avgB = bReviews.length ? bReviews.reduce((s, r) => s + r.rating, 0) / bReviews.length : 0;
              const avgDiff = avgB - avgA;
              return avgDiff !== 0 ? avgDiff : bReviews.length - aReviews.length;
            })
            .map((dest, index) => {
              const photos: string[] = dest.images || [dest.image];
              const currentPhotoIdx = cardPhotoIdx[dest.id] || 0;
              const goNextPhoto = (e: React.MouseEvent) => {
                e.stopPropagation();
                setCardPhotoIdx((prev) => ({ ...prev, [dest.id]: (currentPhotoIdx + 1) % photos.length }));
              };
              const goPrevPhoto = (e: React.MouseEvent) => {
                e.stopPropagation();
                setCardPhotoIdx((prev) => ({ ...prev, [dest.id]: (currentPhotoIdx - 1 + photos.length) % photos.length }));
              };
              return (
                <div key={index} className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-slate-100 group hover:shadow-md transition-all flex flex-col">
                  {/* Photo Carousel */}
                  <div className="h-52 overflow-hidden relative bg-slate-100">
                    {/* Classification & Tag Badges */}
                    <div className="flex items-center gap-1.5 absolute top-3 left-3 z-10">
                      <span
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md text-white ${
                          dest.classification === "Hotel"
                            ? "bg-purple-600"
                            : dest.classification === "Resort"
                            ? "bg-blue-600"
                            : dest.classification === "Landmark"
                            ? "bg-amber-600"
                            : dest.classification === "Falls"
                            ? "bg-cyan-600"
                            : "bg-rose-500"
                        }`}
                      >
                        {dest.classification === "Hotel" && <Building2 size={10} />}
                        {dest.classification === "Resort" && <Hotel size={10} />}
                        {dest.classification === "Landmark" && <Landmark size={10} />}
                        {dest.classification === "Falls" && <Waves size={10} />}
                        {dest.classification === "Beach" && <Trees size={10} />}
                        {dest.classification}
                      </span>
                      {dest.tag && (
                        <span className="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                          {dest.tag}
                        </span>
                      )}
                    </div>
                    {/* Main photo */}
                    <img
                      src={photos[currentPhotoIdx]}
                      alt={`${dest.name} photo ${currentPhotoIdx + 1}`}
                      className="w-full h-full object-cover transition-all duration-500"
                    />
                    {/* Photo credit */}
                    <span className="absolute bottom-3 left-3 z-10 bg-black/50 backdrop-blur-sm text-white/80 text-[8px] md:text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Camera size={8} /> Photo credits to the rightful owner
                    </span>
                    {/* Expand to gallery button */}
                    <button
                      onClick={() => {
                        setActiveGallery(dest);
                        setGalleryIdx(currentPhotoIdx);
                      }}
                      className="absolute bottom-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-lg px-2 py-1 flex items-center gap-1 text-[10px] font-black backdrop-blur-sm transition-all"
                    >
                      <Images size={11} /> {photos.length} Photo{photos.length > 1 ? "s" : ""}
                    </button>
                    {/* Prev/Next only if multiple photos */}
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={goPrevPhoto}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={goNextPhoto}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                        >
                          <ChevronRight size={14} />
                        </button>
                        {/* Dot indicators */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                          {photos.map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardPhotoIdx((prev) => ({ ...prev, [dest.id]: i }));
                              }}
                              className={`rounded-full transition-all ${
                                i === currentPhotoIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1 text-rose-500 text-[10px] font-bold uppercase">
                        <MapPin size={10} /> {dest.barangay}
                      </div>
                    </div>

                    <h4 className="text-xl font-black text-slate-900 mb-1">{dest.name}</h4>
                    <p className="text-slate-500 text-[13px] leading-tight mb-3">{dest.desc}</p>

                    {/* Open Detail & Route Mapping Modal Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => setSelectedQRItem({ ...dest, type: "destination" })}
                        className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLocation(dest);
                          setShowMap(true);
                        }}
                        className="py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Compass size={14} />
                        <span>Route Map</span>
                      </button>
                    </div>

                    {/* Reviews Section */}
                    <div className="mt-auto border-t border-slate-100 pt-3">
                      {(() => {
                        const reviews = getDestReviews(dest);
                        const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
                        const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
                        return (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={12}
                                    className={`${
                                      avg && s <= Math.round(parseFloat(avg))
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-200 fill-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              {avg ? <span className="text-[11px] font-black text-slate-700">{avg}</span> : null}
                              <span className="text-[10px] font-bold text-slate-400">
                                {reviews.length === 0 ? "No reviews yet" : `${reviews.length} review${reviews.length > 1 ? "s" : ""}`}
                              </span>
                              {fiveStarCount > 0 && (
                                <span className="ml-auto text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                                  ⭐ {fiveStarCount} × 5★
                                </span>
                              )}
                            </div>

                            <div className="border-t border-slate-100 pt-3 mt-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <MessageCircle size={11} className="text-rose-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Reviews & Comments</span>
                              </div>
                              {reviewsLoading ? (
                                <p className="text-[10px] text-slate-300 font-bold animate-pulse">Loading reviews...</p>
                              ) : reviews.length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-medium italic">Be the first to leave a review!</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {reviews.slice(0, 2).map((r, i) => (
                                    <div key={i} className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-black text-slate-700 truncate">{r.reviewer_name}</span>
                                        <div className="flex gap-0.5 ml-auto flex-shrink-0">
                                          {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={8} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                                          ))}
                                        </div>
                                      </div>
                                      {r.comment && <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">{r.comment}</p>}
                                    </div>
                                  ))}
                                  {reviews.length > 2 && (
                                    <p className="text-[10px] text-rose-500 font-black text-right">+{reviews.length - 2} more</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── ROUTE MAP MODAL ── */}
      {showMap && (
        <div
          className="fixed inset-0 z-[550] bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMap(false);
              setSelectedLocation(null);
            }
          }}
        >
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full md:max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-400">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-[2.5rem]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest mb-1">
                  <Compass size={10} /> Route Map
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{selectedLocation?.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowMap(false);
                  setSelectedLocation(null);
                }}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <div className="h-[60vh] rounded-2xl overflow-hidden">
                {selectedLocation ? <LeafletRouteMap destination={selectedLocation} /> : <LeafletRouteMap allDestinations={destinations} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN PHOTO LIGHTBOX ── */}
      {activeGallery && (() => {
        const photos: string[] = activeGallery.images || [activeGallery.image];
        const total = photos.length;
        const goPrev = () => setGalleryIdx((i) => (i - 1 + total) % total);
        const goNext = () => setGalleryIdx((i) => (i + 1) % total);
        return (
          <div
            className="fixed inset-0 z-[800] bg-black/95 flex flex-col animate-in fade-in duration-300"
            onClick={() => setActiveGallery(null)}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 bg-black/60 backdrop-blur-md z-10 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">{activeGallery.barangay}</p>
                <h3 className="text-white font-black text-lg tracking-tight leading-tight">{activeGallery.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-black">
                  {galleryIdx + 1} / {total}
                </span>
                <button onClick={() => setActiveGallery(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center relative px-2" onClick={(e) => e.stopPropagation()}>
              <img
                src={photos[galleryIdx]}
                alt={`${activeGallery.name} - Photo ${galleryIdx + 1}`}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl select-none"
                style={{ maxHeight: "calc(100vh - 220px)" }}
              />
              {/* Photo credit */}
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Camera size={10} /> Photo credits to the rightful owner
              </span>
              {total > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft size={22} className="text-white" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all backdrop-blur-sm"
                  >
                    <ChevronRight size={22} className="text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Info Panel */}
            {activeGallery.info && (
              <div
                className="px-5 py-3 bg-black/60 backdrop-blur-md flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-bold text-white/60 mb-2">
                  {activeGallery.info.type && <span>🏖️ {activeGallery.info.type}</span>}
                  {activeGallery.info.bestTime && <span>🕐 Best: {activeGallery.info.bestTime}</span>}
                  {activeGallery.info.access && <span>🚌 {activeGallery.info.access}</span>}
                  {activeGallery.info.entranceFee && <span>🎟️ {activeGallery.info.entranceFee}</span>}
                  {activeGallery.info.visitingHours && <span>⏰ {activeGallery.info.visitingHours}</span>}
                </div>
                {activeGallery.info.features && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeGallery.info.features.map((f: string, i: number) => (
                      <span key={i} className="text-[10px] font-black text-white/70 bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Strip */}
            {total > 1 && (
              <div className="flex gap-2 px-5 py-3 overflow-x-auto bg-black/80 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === galleryIdx ? "border-rose-500 scale-105" : "border-white/10 opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* QR ITEM MODAL - DESTINATION */}
      {selectedQRItem && (
        <QRItemModal item={selectedQRItem} type="destination" tourist={tourist} onClose={() => setSelectedQRItem(null)} />
      )}

      {/* TOUR GUIDE BOOKING NOTIFICATIONS OVERLAY */}
      {showGuideBooking && (
        <div
          className="fixed inset-0 z-[900] bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuideBooking(false);
          }}
        >
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full md:max-w-lg max-h-[93vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 duration-400">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-rose-300 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Booking Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your tour guide booking updates</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideBooking(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 max-h-[78vh] overflow-y-auto bg-[#FAEEED]/20">
              <BookingNotifications tourist={tourist} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
