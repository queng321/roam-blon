"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode, MapPin, Utensils, Gift, Search, X,
  Camera, ChevronLeft, ChevronRight, Star, Clock, Info,
  Loader2, Download, ExternalLink, Wind
} from "lucide-react";

type ItemCategory = "destination" | "dining" | "landmarks" | "fall";

const BASE_URL = typeof window !== "undefined"
  ? window.location.origin
  : "https://roam-blon.vercel.app";

const STATIC_DESTINATIONS = [
  { id: "d1", name: "Bonbon Beach", location: "Brgy. Lonos", description: "The crown jewel of Romblon with a world-famous sandbar that appears at low tide.", category: "Beaches", image_url: "/beach&resorts/bonbon.webp" },
  { id: "d2", name: "Tiamban Beach", location: "Brgy. Lonos", description: "Crystal clear shallow waters and fine white sand, ideal for families.", category: "Beaches", image_url: "/beach&resorts/tiamban.webp" },
  { id: "d3", name: "Talipasak Beach", location: "Brgy. Ginablan", description: "A secluded cove offering peace, quiet, and stunning sunset views.", category: "Beaches", image_url: "/beach&resorts/talipasak.webp" },
  { id: "d4", name: "DC Munting Paraiso", location: "Brgy. Agnay", description: "A serene hideaway in Brgy. Agnay where fine white sand meets calm turquoise water. Fringed by coconut palms and shaded day cottages, it's the perfect spot to unwind, swim, and feast on fresh seafood grilled by the shore.", category: "Beaches", image_url: "/beach&resorts/dc.webp" },
  { id: "d6", name: "Coco Cabana", location: "Logbon Island", description: "A peaceful stretch of sand with turquoise waters, perfect for a quiet retreat.", category: "Resort", image_url: "/beach&resorts/coco.webp" },
];

const STATIC_DINING = [
  { id: "bistro", name: "Marble City Café & Bistro", address: "Across Freedom Park, Town Proper, Romblon", description: "A cozy café serving artisanal espresso, freshly baked pastries, and local snacks.", category: "Café & Bistro", image_url: "/dining/bistro.jpg", images: ["/dining/bistro.jpg"] },
  { id: "el", name: "El Krimphoff Resort & Restaurant", address: "Sitio Babangtan, Brgy. Lonos, Romblon", description: "Full-service resort restaurant offering fresh seafood, Filipino favorites, and cold beverages.", category: "Restaurant", image_url: "/dining/el.jpg", images: ["/dining/el.jpg"] },
  { id: "gangnam", name: "Gangnam Korean Grill", address: "Sitio Batiano, Brgy. Mapula, Romblon", description: "Unlimited Korean BBQ and Samgyeopsal with authentic banchan side dishes.", category: "Korean BBQ", image_url: "/dining/gangnam.jpg", images: ["/dining/gangnam.jpg"] },
  { id: "horizon", name: "Horizon Seaside Restaurant", address: "Brgy. Lonos", description: "Ross's Restaurant offers Filipino & Spanish cuisine by Horizon Hotel Romblon. Experience the rich flavors of the Philippines with a touch of Spanish culinary heritage—from beloved Filipino comfort food to Spanish-inspired favorites, every dish is thoughtfully prepared to bring together tradition, flavor, and modern dining, served with the warm hospitality Romblon is known for. \"Where Every Bite Becomes Part of Your Romblon Story.\"", category: "Seafood & Grill", image_url: "/dining/horizon.jpg", images: ["/dining/horizon.jpg"] },
  { id: "italian", name: "Italian Trattoria", address: "Republika St, Brgy. 1 Poblacion, Romblon", description: "Authentic wood-fired pizzas, fresh homemade pasta, and fine Italian wines.", category: "Italian & Pizza", image_url: "/dining/italian.jpg", images: ["/dining/italian.jpg"] },
  { id: "mamalois", name: "Mama Lois Kitchen", address: "Beside Romblon Port Terminal, Town Proper", description: "Home-cooked Romblon classics with generous servings at affordable prices.", category: "Local Eat", image_url: "/dining/mamalois.jpg", images: ["/dining/mamalois.jpg"] },
  { id: "ocean", name: "Seaview Restobar", address: "Sitio Suwa, Brgy. Lonos, Romblon", description: "Seaside restobar serving catch-of-the-day seafood with ocean sunset views.", category: "Seafood", image_url: "/dining/ocean.jpg", images: ["/dining/ocean.jpg"] },
  { id: "panublion", name: "Panublion Heritage Diner", address: "Republika St, Town Proper, Romblon", description: "Heritage Romblon recipes and delicacies in a warm cultural setting.", category: "Heritage Cuisine", image_url: "/dining/panublion.jpg", images: ["/dining/panublion.jpg"] },
  { id: "reggae", name: "Reggae Bar & Grill", address: "Agpanabat", description: "Bohemian beachfront bar and grill with live music and tropical cocktails.", category: "Bar & Grill", image_url: "/dining/reggae.jpg", images: ["/dining/reggae.jpg"] },
  { id: "sunbird", name: "Sunbird Ridge Coffee Shop", address: "Ridge above Tiamban Beach, Brgy. Lonos", description: "Specialty coffee and cold brews in a peaceful garden lounge setting.", category: "Café", image_url: "/foods/sarsa.webp", images: ["/foods/sarsa.webp", "/foods/inaslum.webp", "/foods/sihi.webp", "/foods/gayabon.webp"] },
  { id: "yurich", name: "Yurich Hotel & Caffeinate Co.", address: "Sitio Binagong, Brgy. Bagacay", description: "Premium coffee blends, artisanal pastries, and hearty local dishes in a cozy air-conditioned space.", category: "Local Restaurant", image_url: "/dining/yurich.jpg", images: ["/dining/yurich.jpg"] },
];

const STATIC_LANDMARKS: QRItem[] = [];
const STATIC_FALLS: QRItem[] = [];

interface QRItem {
  id: string;
  name: string;
  description?: string;
  location?: string;
  address?: string;
  category?: string;
  image_url?: string;
  images?: string[];
  opening_time?: string;
  closing_time?: string;
  price?: number;
  _type: ItemCategory;
}

interface Review {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

export default function QRViewer() {
  const [activeTab, setActiveTab] = useState<ItemCategory>("destination");
  const [items, setItems] = useState<{ destination: QRItem[]; dining: QRItem[]; landmarks: QRItem[]; fall: QRItem[] }>({
    destination: [],
    dining: [],
    landmarks: [],
    fall: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<QRItem | null>(null);
  const [selectedItemPhotoIdx, setSelectedItemPhotoIdx] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);

  const selectedItemImages = selectedItem
    ? (Array.isArray(selectedItem.images) && selectedItem.images.length > 0
      ? selectedItem.images
      : selectedItem.image_url
        ? [selectedItem.image_url]
        : [])
    : [];

  useEffect(() => {
    if (selectedItem) setSelectedItemPhotoIdx(0);
  }, [selectedItem]);

  useEffect(() => {
    fetchAllItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      loadReviewsForItem(selectedItem._type, selectedItem.id, selectedItem.name);

      const channel = supabase
        .channel(`qr-viewer-reviews-${selectedItem.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "reviews" },
          () => {
            loadReviewsForItem(selectedItem._type, selectedItem.id, selectedItem.name);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "reviews" },
          () => {
            loadReviewsForItem(selectedItem._type, selectedItem.id, selectedItem.name);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow || "";
      };
    }
    return undefined;
  }, [selectedItem]);

  const fetchAllItems = async () => {
    setLoading(true);
    try {
      const [{ data: destData }, { data: diningData }, { data: landmarksData }, { data: fallData }] = await Promise.all([
        supabase.from("destinations").select("*").order("name"),
        supabase.from("dining_hubs").select("*").order("name"),
        supabase.from("landmarks").select("*").order("name"),
        supabase.from("falls").select("*").order("name"),
      ]);

      const mapDest = (d: any): QRItem => ({ ...d, _type: "destination" });
      const mapDining = (d: any): QRItem => ({ ...d, _type: "dining" });
      const mapLandmark = (d: any): QRItem => ({ ...d, _type: "landmarks" });
      const mapFall = (d: any): QRItem => ({ ...d, _type: "fall" });

      setItems({
        destination: (destData && destData.length > 0) ? destData.map(mapDest) : STATIC_DESTINATIONS.map(mapDest),
        dining: (diningData && diningData.length > 0) ? diningData.map(mapDining) : STATIC_DINING.map(mapDining),
        landmarks: (landmarksData && landmarksData.length > 0) ? landmarksData.map(mapLandmark) : STATIC_LANDMARKS.map(mapLandmark),
        fall: (fallData && fallData.length > 0) ? fallData.map(mapFall) : STATIC_FALLS.map(mapFall),
      });
    } catch {
      setItems({
        destination: STATIC_DESTINATIONS.map(d => ({ ...d, _type: "destination" })),
        dining: STATIC_DINING.map(d => ({ ...d, _type: "dining" })),
        landmarks: STATIC_LANDMARKS.map(d => ({ ...d, _type: "landmarks" })),
        fall: STATIC_FALLS.map(d => ({ ...d, _type: "fall" })),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsForItem = async (type: string, id: string, name?: string) => {
    try {
      let remoteReviews: Review[] = [];
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        remoteReviews = data.filter(
          (r: any) =>
            r.item_type === type &&
            (r.item_id === id || (name && r.item_name === name))
        ) as Review[];
      }

      const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]") as Review[];
      const localForThisItem = stored.filter(
        (r: any) =>
          r.item_type === type &&
          (r.item_id === id || (name && r.item_name === name))
      );

      const combined = [...remoteReviews];
      localForThisItem.forEach((lr) => {
        if (
          !combined.some(
            (cr) => cr.id === lr.id || (cr.reviewer_name === lr.reviewer_name && cr.comment === lr.comment)
          )
        ) {
          combined.push(lr);
        }
      });
      combined.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setReviews(combined);
    } catch {
      const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]") as Review[];
      const filtered = stored.filter(
        (r) => r.item_type === type && (r.item_id === id || (name && r.item_name === name))
      );
      setReviews(filtered);
    }
  };

  const getQRUrl = (item: QRItem) =>
    `${BASE_URL}/qr?type=${item._type}&id=${item.id}`;

  const getTabConfig = (tab: ItemCategory) => {
    const cfg = {
      destination: { label: "Destinations", icon: MapPin, color: "rose", items: items.destination },
      dining: { label: "Dining", icon: Utensils, color: "orange", items: items.dining },
      landmarks: { label: "Landmarks", icon: MapPin, color: "violet", items: items.landmarks },
      fall: { label: "Waterfalls", icon: Wind, color: "cyan", items: items.fall },
    };
    return cfg[tab];
  };

  const currentItems = getTabConfig(activeTab).items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const tabColors: Record<ItemCategory, string> = {
    destination: "text-rose-600 bg-rose-50 border-rose-200",
    dining: "text-orange-600 bg-orange-50 border-orange-200",
    landmarks: "text-violet-600 bg-violet-50 border-violet-200",
    fall: "text-cyan-600 bg-cyan-50 border-cyan-200",
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">

      {/* Header */}
      <div className="text-center mb-8 pt-2">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full mb-4">
          <QrCode size={16} />
          <span className="text-xs font-black uppercase tracking-widest">QR Code Explorer</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Scan & Discover</h2>
        <p className="text-slate-500 text-sm font-medium mt-2 max-w-md mx-auto">
          Each destination, dining, landmark, and waterfall has a unique QR code. Scan to see details and leave your review.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
        {(["destination", "dining", "landmarks", "fall"] as ItemCategory[]).map(tab => {
          const cfg = getTabConfig(tab);
          const Icon = cfg.icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(""); setSelectedItem(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                isActive ? "bg-white shadow-md text-slate-900" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon size={16} className={isActive ? "text-rose-500" : ""} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${getTabConfig(activeTab).label.toLowerCase()}...`}
          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-rose-300 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-rose-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-3xl border-2 border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col"
            >
              {/* Image */}
              {(item.images?.[0] || item.image_url) && (
                <div className="h-36 overflow-hidden">
                  <img src={item.images?.[0] || item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}

              {/* QR Code Preview */}
              <div className="flex justify-center py-4 bg-slate-50 border-b border-slate-100">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                  <QRCodeSVG
                    value={getQRUrl(item)}
                    size={80}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className={`self-start text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${tabColors[activeTab]}`}>
                  {item.category || activeTab}
                </div>
                <h3 className="font-black text-slate-900 text-base leading-tight uppercase tracking-tight">{item.name}</h3>
                {(item.location || item.address) && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin size={11} />
                    <span className="text-[11px] font-bold truncate">{item.location || item.address}</span>
                  </div>
                )}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">View & Scan</span>
                  <ChevronRight size={14} className="text-rose-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}

          {currentItems.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <QrCode size={40} className="text-slate-200" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No items found</p>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[800] bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300"
          onClick={e => { if (e.target === e.currentTarget) setSelectedItem(null); }}
        >
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full md:max-w-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-400 shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md p-5 border-b border-slate-100 flex justify-between items-center rounded-t-[2.5rem] z-10">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mb-1 ${tabColors[selectedItem._type]}`}>
                  {selectedItem._type}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{selectedItem.name}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Image gallery */}
              {selectedItemImages.length > 0 && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden h-56 bg-slate-100">
                    <img
                      src={selectedItemImages[selectedItemPhotoIdx]}
                      alt={`${selectedItem.name} photo ${selectedItemPhotoIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedItemImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedItemPhotoIdx(idx => (idx - 1 + selectedItemImages.length) % selectedItemImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-900 hover:bg-white transition"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedItemPhotoIdx(idx => (idx + 1) % selectedItemImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-900 hover:bg-white transition"
                        >
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full font-black">
                          {selectedItemPhotoIdx + 1} / {selectedItemImages.length}
                        </div>
                      </>
                    )}
                  </div>
                  {selectedItemImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {selectedItemImages.map((img, idx) => (
                        <button
                          key={`${img}-${idx}`}
                          type="button"
                          onClick={() => setSelectedItemPhotoIdx(idx)}
                          className={`w-16 h-12 rounded-2xl overflow-hidden border-2 transition ${idx === selectedItemPhotoIdx ? "border-rose-500" : "border-transparent hover:border-slate-300"}`}
                        >
                          <img src={img} alt={`${selectedItem.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="space-y-2">
                {(selectedItem.location || selectedItem.address) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="text-sm font-bold">{selectedItem.location || selectedItem.address}</span>
                  </div>
                )}
                {(selectedItem.opening_time || selectedItem.closing_time) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} className="text-orange-500 shrink-0" />
                    <span className="text-sm font-bold">{selectedItem.opening_time} – {selectedItem.closing_time}</span>
                  </div>
                )}
                {selectedItem.description && (
                  <div className="flex items-start gap-2 text-slate-600 pt-1">
                    <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">{selectedItem.description}</p>
                  </div>
                )}
                {selectedItem.price && (
                  <div className="text-2xl font-black text-rose-500">₱{selectedItem.price}</div>
                )}
              </div>

              {/* QR Code (Large) */}
              <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center gap-4 border-2 border-slate-100">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">QR Code for this location</h4>
                <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
                  <QRCodeSVG
                    value={getQRUrl(selectedItem)}
                    size={180}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    imageSettings={{
                      src: "/logo.jpg",
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-bold text-center">
                  Scan this code to view details and leave a review
                </p>
                <a
                  href={getQRUrl(selectedItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-rose-600 transition-all"
                >
                  <ExternalLink size={14} /> Open QR Page
                </a>
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Reviews</h4>
                  {avgRating && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="font-black text-slate-800 text-sm">{avgRating}</span>
                      <span className="text-slate-400 text-xs font-bold">({reviews.length})</span>
                    </div>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <Star size={28} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No reviews yet</p>
                    <p className="text-slate-400 text-[11px] font-medium mt-1">Be the first to leave a review!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {reviews.map((r, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-slate-800 text-sm">{r.reviewer_name}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={12} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-slate-600 text-xs font-medium leading-relaxed">{r.comment}</p>}
                        <p className="text-slate-300 text-[10px] font-bold mt-1.5">
                          {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
