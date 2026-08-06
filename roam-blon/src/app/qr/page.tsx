"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Star, MapPin, Clock, Utensils, Gift, ChevronLeft, Send, Loader2,
  CheckCircle2, QrCode, Camera, ChevronRight, Play, Image as ImageIcon,
  Waves, Wind, Sun, Info, ExternalLink, Wallet
} from "lucide-react";
import QRScanner from "@/components/QRScanner";
import LeafletRouteMap from "@/components/LeafletRouteMap";

/* ─── BEACH MEDIA DATABASE ─────────────────────────────────────────── */
// Each beach gets multiple images — all real photos from public/beach&resorts/
const BEACH_MEDIA: Record<string, { images: string[]; videoId?: string; videoUrl?: string; highlights: string[]; bestTime: string; activities: string[]; entranceFee?: string }> = {
  "sd-bonbon": {
    images: [
      "/beach&resorts/bonbon.jpg",
      "/beach&resorts/bonbon1.jpg",
      "/beach&resorts/bonbon2.jpg",
      "/beach&resorts/bonbon3.jpg",
      "/beach&resorts/bonbon4.jpg",
    ],
    highlights: ["World-famous sandbar at low tide", "Crystal clear turquoise waters", "White powdery sand", "Stunning 360° ocean views"],
    bestTime: "March – May (dry season, low tide in the morning)",
    activities: ["Swimming", "Sandbar walking", "Photography", "Snorkeling", "Sunset watching"],
    entranceFee: "₱10 public / ₱60 private",
  },
  "sd-peable": {
    images: [
      "/beach&resorts/peabble.jpg",
      "/beach&resorts/peabble1.jpg",
      "/beach&resorts/peabble2.jpg",
    ],
    highlights: ["Wide white-sand beach", "Cozy beachfront cottages", "Towering palm trees", "Family-friendly facilities"],
    bestTime: "November – May (peak season)",
    activities: ["Beach camping", "Swimming", "Beach volleyball", "Cottage stays", "Kayaking"],
    entranceFee: "₱100",
  },
  "sd-tiamban": {
    images: [
      "/beach&resorts/tiamban.jpg",
      "/beach&resorts/tiamban2.jpg",
      "/beach&resorts/tiamban3.jpg",
      "/beach&resorts/tiamban4.jpg",
    ],
    highlights: ["Crystal-clear shallow waters", "Fine white sand", "Safe for children", "Gentle waves"],
    bestTime: "Year-round, best from December – May",
    activities: ["Family swimming", "Snorkeling", "Sand castle building", "Picnicking", "Beach games"],
    entranceFee: "₱50 adult / ₱30 kids",
  },
  "sd-talipasak": {
    images: [
      "/beach&resorts/talipasak.jpg",
      "/beach&resorts/talipasak2.jpg",
      "/beach&resorts/talipasak3.jpg",
    ],
    highlights: ["Secluded hidden cove", "Dramatic sunset views", "Pristine nature", "Peaceful atmosphere"],
    bestTime: "November – April (dry season)",
    activities: ["Sunset watching", "Photography", "Swimming", "Meditation", "Nature hiking"],
    entranceFee: "₱50 adult / ₱30 kids",
  },
  "sd-lamao": {
    images: [
      "/beach&resorts/lamao.jpg",
      "/beach&resorts/lamao1.jpg",
      "/beach&resorts/lamao2.jpg",
      "/beach&resorts/lamao3.jpg",
    ],
    highlights: ["Pristine white beach on Logbon Island", "Turquoise waters", "Quiet island getaway", "Part of island hopping route"],
    bestTime: "January – May (calm seas for island hopping)",
    activities: ["Island hopping", "Swimming", "Snorkeling", "Picnicking", "Boat tours"],
    entranceFee: "₱100 adult / ₱70 kids",
  },
  "sd-dc-logbon": {
    images: [
      "/beach&resorts/dc.jpg",
      "/beach&resorts/dc1.jpg",
      "/beach&resorts/dc2.jpg",
    ],
    highlights: ["Pristine white sand", "Quiet and relaxing atmosphere", "Beautiful views", "Local island culture"],
    bestTime: "March – June (calm seas)",
    activities: ["Swimming", "Snorkeling", "Relaxing", "Photography", "Island Hopping"],
    entranceFee: "₱50 adult / ₱30 kids",
  },
  "sd-coco": {
    images: [
      "/beach&resorts/coco.jpg",
      "/beach&resorts/coco1.jpg",
      "/beach&resorts/coco2.jpg",
      "/beach&resorts/coco3.jpg",
    ],
    highlights: ["Peaceful & less crowded", "Opposite side of Logbon Island", "Natural palm canopy", "Quiet retreat"],
    bestTime: "Year-round",
    activities: ["Relaxing", "Swimming", "Kayaking", "Bird watching", "Stargazing"],
    entranceFee: "₱100 adult / ₱50 kids",
  },
  "sd-reggae": {
    images: [
      "/beach&resorts/reggae.jpg",
      "/beach&resorts/reggae1.jpg",
      "/beach&resorts/reggae2.jpg",
      "/beach&resorts/reggae3.jpg",
    ],
    highlights: ["Bohemian beachfront resort", "Popular with backpackers", "Near Tiamban Beach", "Budget-friendly"],
    bestTime: "December – April",
    activities: ["Beach bonfires", "Live music events", "Swimming", "Solo travel meetups", "Hammock lounging"],
    entranceFee: "₱50 adult / ₱30 kids (free if dine-in)",
  },
  "sd-takot": {
    images: [
      "/beach&resorts/robinson.jpg",
    ],
    highlights: ["Natural cliff diving platform", "10 to 30-foot jumps", "Deep clear waters below", "Heart-pounding adrenaline rush"],
    bestTime: "March – June (clear visibility)",
    activities: ["Cliff diving", "Deep water swimming", "Adrenaline sports", "Photography", "Snorkeling"],
    entranceFee: "Free",
  },
  "sd-robinson": {
    images: [
      "/beach&resorts/robinson.jpg",
      "/beach&resorts/robinson1.jpg",
      "/beach&resorts/robinson2.jpg",
      "/beach&resorts/robinson3.jpg",
    ],
    highlights: ["Hidden picturesque inlet", "Small private sandbar", "Very photogenic scenery", "Peaceful atmosphere"],
    bestTime: "December – May",
    activities: ["Photography", "Swimming", "Kayaking", "Romantic picnics", "Sandbar exploration"],
    entranceFee: "₱50 adult / ₱30 kids",
  },
  "sd-horizon": {
    images: [
      "/beach&resorts/horizon1.jpg",
      "/beach&resorts/horizon2.jpg",
      "/beach&resorts/horizon.jpg",
    ],
    highlights: ["Panoramic sea views", "Comfortable accommodations", "Easy beach access", "Stunning sunsets"],
    bestTime: "Year-round",
    activities: ["Sea View Dining", "Swimming", "Relaxing", "Sunset Watching", "Photography"],
    entranceFee: "Free (Dine-in)",
  },
  "sd-libtong": {
    images: [
      "/beach&resorts/libtong.jpg",
      "/beach&resorts/libtong1.jpg",
    ],
    highlights: ["Off-the-beaten-path waterfall", "Layered cascades in dense forest", "Refreshing natural pools", "Adventure trek trail"],
    bestTime: "Morning (before noon)",
    activities: ["Trekking", "Swimming", "Photography", "Nature Walk"],
    entranceFee: "Free",
  },
  "sd-kipot": {
    images: [
      "/beach&resorts/kipot.jpg",
      "/beach&resorts/kipot2.jpg",
      "/beach&resorts/kipot3.jpg",
    ],
    highlights: ["Hidden emerald river canyon", "Natural rock pools", "Swim-through narrow slots", "Cliff jumping spots"],
    bestTime: "Morning",
    activities: ["Canyon Swimming", "Cliff Jumping", "Trekking", "Photography"],
    entranceFee: "₱10",
  },
  "sd-fort-san-andres": {
    images: [
      "/beach&resorts/fort.jpg",
      "/beach&resorts/fort1.jpg",
    ],
    highlights: ["17th-century Spanish fortress", "Panoramic harbor views", "National Cultural Treasure", "Historical heritage site"],
    bestTime: "Sunset (4PM – 6PM)",
    activities: ["Sightseeing", "Photography", "History Tour", "Sunset Watching"],
    entranceFee: "Free (Donation)",
  },
  "sd-cathedral": {
    images: [
      "/beach&resorts/cathedral.jpg",
      "/beach&resorts/cathedral1.jpg",
      "/beach&resorts/cathedral2.jpg",
    ],
    highlights: ["Baroque marble church", "National Cultural Treasure", "Seat of the Diocese of Romblon", "Historic 17th-century architecture"],
    bestTime: "Morning Mass",
    activities: ["Church Visit", "Sightseeing", "Photography", "Heritage Tour"],
    entranceFee: "Free",
  },
  "sd-shopping": {
    images: [
      "/beach&resorts/shopping1.jpg",
      "/shopping.avif",
    ],
    highlights: ["Marble souvenir hub", "Local artisan craftsmanship", "On-site engraving services", "Pasalubong shopping"],
    bestTime: "Morning",
    activities: ["Shopping", "Souvenir Hunting", "Marble Viewing", "Engraving"],
    entranceFee: "Free",
  },
};

/* ─── INTERFACES ─────────────────────────────────────────────────────── */
interface ReviewData {
  rating: number;
  comment: string;
  reviewer_name: string;
}

/* ─── PHOTO GALLERY COMPONENT ────────────────────────────────────────── */
function PhotoGallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const go = (idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsTransitioning(false);
    }, 200);
  };

  const prev = () => go((current - 1 + images.length) % images.length);
  const next = () => go((current + 1) % images.length);

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
        <img
          src={images[current]}
          alt={`${name} - photo ${current + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-90"
            >
              <ChevronLeft size={18} className="text-slate-800" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-90"
            >
              <ChevronRight size={18} className="text-slate-800" />
            </button>
          </>
        )}

        {/* Photo counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <Camera size={10} />
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2.5 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`w-16 h-11 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                i === current ? "border-rose-500 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── VIDEO EMBED COMPONENT ──────────────────────────────────────────── */
function VideoSection({ videoId, videoUrl, name, previewImage }: { videoId?: string; videoUrl?: string; name: string; previewImage?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    if (videoUrl) {
      return (
        <div className="max-w-[360px] mx-auto bg-black shadow-2xl rounded-3xl border-2 border-slate-800 relative w-full flex items-center justify-center overflow-hidden animate-in zoom-in duration-300">
          <video
            controls
            autoPlay
            playsInline
            className="w-full block rounded-2xl"
            style={{ backgroundColor: "#000", maxHeight: "80vh" }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    return (
      <div className="rounded-3xl overflow-hidden h-52 md:h-64 bg-slate-900 shadow-xl border-2 border-slate-800 animate-in zoom-in duration-300">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={`${name} video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-none"
        />
      </div>
    );
  }

  // Use preview image or a fallback
  const thumbnail = previewImage || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/beach&resorts/bonbon.jpg");
  
  // Set tall aspect ratio for portrait videos (9:16) and landscape for YouTube
  const cardClassName = videoUrl 
    ? "relative max-w-[360px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 shadow-xl border-2 border-slate-800 group w-full"
    : "relative w-full h-52 md:h-64 rounded-3xl overflow-hidden bg-slate-900 shadow-xl border-2 border-slate-800 group";

  return (
    <button
      onClick={() => setPlaying(true)}
      className={cardClassName}
    >
      <img
        src={thumbnail}
        alt={`${name} video thumbnail`}
        className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
          <Play size={24} className="text-white ml-1 fill-white" />
        </div>
        <span className="text-white font-black text-sm uppercase tracking-wider drop-shadow-lg">
          Watch Video
        </span>
      </div>
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full">
        🎬 BeyondLens
      </div>
    </button>
  );
}

/* ─── MAIN QR CONTENT ────────────────────────────────────────────────── */
function QRScanContent() {
  const params = useSearchParams();
  const type = params.get("type") || "";
  const id = params.get("id") || "";

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gallery" | "video" | "info">("gallery");
  const [review, setReview] = useState<ReviewData>({ rating: 0, comment: "", reviewer_name: "" });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [existingReviews, setExistingReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Local/Foreign prompt after scanning
  const [visitorPrompt, setVisitorPrompt] = useState(false);
  const [visitorType, setVisitorType] = useState<"local" | "foreign" | null>(null);

  useEffect(() => {
    if (!type || !id) { setLoading(false); return; }
    fetchItem();
  }, [type, id]);

  const fetchReviews = async () => {
    if (!type || !id) return;
    setReviewsLoading(true);
    try {
      let remoteReviews: any[] = [];
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        remoteReviews = data.filter(
          (r: any) =>
            r.item_type === type &&
            (r.item_id === id || (item?.name && r.item_name === item.name))
        );
      }

      const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]");
      const localForThisItem = stored.filter(
        (r: any) =>
          r.item_type === type &&
          (r.item_id === id || (item?.name && r.item_name === item.name))
      );

      const combined = [...remoteReviews];
      localForThisItem.forEach((lr: any) => {
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
      setExistingReviews(combined);
    } catch {
      const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]");
      const localForThisItem = stored.filter(
        (r: any) =>
          r.item_type === type &&
          (r.item_id === id || (item?.name && r.item_name === item.name))
      );
      setExistingReviews(localForThisItem);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!type || !id) return;
    fetchReviews();

    const channel = supabase
      .channel(`qr-reviews-realtime-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        () => {
          fetchReviews();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reviews" },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, id, item?.name]);

  const [loggedScans] = useState<Set<string>>(new Set());

  const logQRScan = async (itemType: string, itemId: string, itemName: string) => {
    // Dedupe: count each QR only once per browser so refresh doesn't inflate the count
    const scanKey = `${itemType}:${itemId}`;
    if (loggedScans.has(scanKey)) return;
    loggedScans.add(scanKey);
    try {
      const scanned = JSON.parse(localStorage.getItem("roam_blon_scanned_qrs") || "[]");
      if (scanned.includes(scanKey)) return;
    } catch { /* ignore */ }

    let inserted = false;
    try {
      const payload = {
        item_type: itemType,
        item_id: itemId,
        item_name: itemName,
        visitor_type: visitorType || "local",
        nationality: (visitorType === "foreign" ? "Foreign" : "Local"),
        scanned_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("qr_scans").insert([payload]);
      inserted = !error;
    } catch {
      /* ignore if table not present */
    }
    if (!inserted) {
      // Broadcast fallback — catches scans when the DB insert fails (missing table / RLS)
      try {
        const chan = supabase.channel('admin-live-feed');
        await chan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chan.send({
              type: 'broadcast',
              event: 'new_scan',
              payload: {
                item_type: itemType,
                item_id: itemId,
                item_name: itemName,
                visitor_type: visitorType || "local",
                nationality: (visitorType === "foreign" ? "Foreign" : "Local"),
              },
            });
            supabase.removeChannel(chan);
          }
        });
      } catch { /* ignore */ }
    }

    // Mark as scanned (persists across refresh)
    try {
      const scanned = JSON.parse(localStorage.getItem("roam_blon_scanned_qrs") || "[]");
      scanned.push(scanKey);
      localStorage.setItem("roam_blon_scanned_qrs", JSON.stringify(scanned.slice(-500)));
    } catch { /* ignore */ }

    // Ask the visitor whether they're local or foreign (once per browser)
    if (!localStorage.getItem("roam_blon_visitor_classified")) {
      setVisitorPrompt(true);
    }
  };

  const fetchItem = async () => {
    setLoading(true);
    try {
      const tableMap: Record<string, string> = {
        destination: "destinations",
        dining: "dining_hubs",
        souvenir: "souvenirs",
        landmarks: "landmarks",
        fall: "falls",
      };
      const table = tableMap[type];
      if (!table) { setLoading(false); return; }
      const { data } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (data) {
        setItem(data);
        logQRScan(type, id, data.name || "Location");
      } else {
        const cached = localStorage.getItem(`roam_qr_${type}_${id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setItem(parsed);
          logQRScan(type, id, parsed.name || "Location");
        } else {
          // Try static data fallback
          if (type === "destination" || type === "landmarks" || type === "fall") {
            const staticItem = getStaticBeach(id);
            if (staticItem) {
              setItem(staticItem);
              logQRScan(type, id, staticItem.name);
            }
          } else if (type === "dining") {
            const staticItem = getStaticDining(id);
            if (staticItem) {
              setItem(staticItem);
              logQRScan(type, id, staticItem.name);
            }
          }
        }
      }
    } catch {
      const cached = localStorage.getItem(`roam_qr_${type}_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setItem(parsed);
        logQRScan(type, id, parsed.name || "Location");
      } else if (type === "destination" || type === "landmarks" || type === "fall") {
          const staticItem = getStaticBeach(id);
          if (staticItem) {
            setItem(staticItem);
            logQRScan(type, id, staticItem.name);
          }
        } else if (type === "dining") {
          const staticItem = getStaticDining(id);
          if (staticItem) {
            setItem(staticItem);
            logQRScan(type, id, staticItem.name);
          }
        }
    } finally {
      setLoading(false);
    }
  };

  const getStaticBeach = (beachId: string) => {
    const STATIC: Record<string, any> = {
      "sd-bonbon": { id: "sd-bonbon", name: "Bonbon Beach", location: "Brgy. Lonos, Romblon", description: "The crown jewel of Romblon, featuring a world-famous sandbar that appears at low tide.", image_url: "/beach&resorts/bonbon.webp" },
      "sd-peable": { id: "sd-peable", name: "Peable Walk", location: "Brgy. Ginablan, Romblon", description: "A wide, white-sand haven perfect for long stays with cozy cottages and towering palm trees.", image_url: "/beach&resorts/peable.jpg" },
      "sd-tiamban": { id: "sd-tiamban", name: "Tiamban Beach", location: "Brgy. Lonos, Romblon", description: "Crystal clear shallow waters and fine white sand, ideal for families and children.", image_url: "/beach&resorts/tiamban.webp" },
      "sd-talipasak": { id: "sd-talipasak", name: "Talipasak Beach", location: "Brgy. Ginablan, Romblon", description: "A secluded cove offering peace, quiet, and a stunning view of the sunset.", image_url: "/beach&resorts/talipasak.webp" },
      "sd-lamao": { id: "sd-lamao", name: "Lamao Beach Resort", location: "Logbon Island, Romblon", description: "A pristine white beach on Logbon Island with turquoise waters, perfect for island hopping.", image_url: "/beach&resorts/lamao.jpg" },
      "sd-dc-logbon": { id: "sd-dc-logbon", name: "DC Munting Paraiso", location: "Brgy. Agnay, Romblon", description: "A beautiful and relaxing white sand beach located in Brgy. Agnay, Romblon.", image_url: "/beach&resorts/dc.webp" },
      "sd-coco": { id: "sd-coco", name: "Coco Cabana", location: "Logbon Island, Romblon", description: "A peaceful stretch of sand on the other side of Logbon, often less crowded than Bonbon.", image_url: "/beach&resorts/coco.webp" },
      "sd-reggae": { id: "sd-reggae", name: "Reggae Vibes Romblon", location: "Agpanabat, Romblon", description: "A bohemian-style beachfront stay near Tiamban, popular with backpackers and solo travelers.", image_url: "/beach&resorts/reggae.webp" },
      "sd-takot": { id: "sd-takot", name: "Takot Reef & Beach", location: "Romblon Island", description: "A thrilling dive and snorkel spot above a spectacular coral reef, surrounded by untouched tropical shoreline.", image_url: "/beach&resorts/takot.webp" },
      "sd-robinson": { id: "sd-robinson", name: "Robinson's Cove", location: "Brgy. Lonos, Romblon", description: "A picturesque, hidden inlet featuring a small sandbar and a peaceful atmosphere.", image_url: "/beach&resorts/robinson.webp" },
      "sd-horizon": { id: "sd-horizon", name: "Horizon Beach Resort", location: "Brgy. Lonos, Romblon", description: "A stunning beachfront resort offering panoramic sea views, comfortable accommodations, and easy access to the best shores.", image_url: "/beach&resorts/horizon1.jpg" },
      "sd-libtong": { id: "sd-libtong", name: "Libtong Falls", location: "Sablayan Point, Romblon Island", description: "An off-the-beaten-path layered waterfall reached by a 10-15 minute trail that follows the sound of running water upstream, surrounded by dense tropical greenery.", image_url: "/beach&resorts/libtong.jpg" },
      "sd-kipot": { id: "sd-kipot", name: "Kipot River", location: "Southeast Romblon Island", description: "A hidden emerald river canyon carved through rock formations with natural pools perfect for swimming and cliff jumping, located in the south-east of Romblon Island.", image_url: "/beach&resorts/kipot.jpg" },
      "sd-fort-san-andres": { id: "sd-fort-san-andres", name: "Fort San Andres", location: "Town Proper, Romblon", description: "A 17th-century Spanish stone fortress on San Antonio Hill overlooking Romblon harbor, part of the Twin Forts of Romblon declared a National Cultural Treasure.", image_url: "/beach&resorts/fort.jpg" },
      "sd-cathedral": { id: "sd-cathedral", name: "Saint Joseph Cathedral", location: "Town Proper, Romblon", description: "The Cathedral of Saint Joseph, a Baroque fortress-church built in the 17th century largely from local marble, declared a National Cultural Treasure and seat of the Diocese of Romblon.", image_url: "/beach&resorts/cathedral.jpg" },
      "sd-shopping": { id: "sd-shopping", name: "Romblon Shopping Center", location: "Town Proper, Romblon", description: "The main pasalubong hub beside Freedom Park where marble souvenirs, sculptures, furniture, and handcrafted items are sold by local artisans.", image_url: "/beach&resorts/shopping1.jpg" },
    };
    return STATIC[beachId] || null;
  };

  const getStaticDining = (diningId: string) => {
    const STATIC: Record<string, any> = {
      "bistro": { id: "bistro", name: "Marble City Café & Bistro", location: "Town Proper, Romblon", address: "Town Proper, Romblon", category: "Café & Bistro", description: "A cozy café serving artisanal espresso, freshly baked pastries, and local snacks. Free Wi-Fi for travelers.", image_url: "/dining/bistro.jpg", images: ["/dining/bistro.jpg", "/dining/bistro1.jpg", "/dining/bistro2.jpg", "/dining/bistro3.jpg", "/dining/bistro4.jpg"], opening_time: "7:00 AM", closing_time: "10:00 PM" },
      "el": { id: "el", name: "El Hotel & Restaurant", location: "Romblon Town", address: "Romblon Town", category: "Restaurant", description: "Full-service hotel restaurant offering fresh seafood, Filipino favorites, and cold beverages in a spacious setting.", image_url: "/dining/el.jpg", images: ["/dining/el.jpg", "/dining/el1.jpg", "/dining/el2.jpg", "/dining/el3.jpg", "/dining/el4.jpg", "/dining/el5.jpg"], opening_time: "6:00 AM", closing_time: "10:00 PM" },
      "gangnam": { id: "gangnam", name: "Gangnam Korean Grill", location: "Romblon Town", address: "Romblon Town", category: "Korean BBQ", description: "Unlimited Korean BBQ and Samgyeopsal with authentic banchan side dishes. Fun tabletop grill experience for the whole family.", image_url: "/dining/gangnam.jpg", images: ["/dining/gangnam.jpg", "/dining/gangnam1.jpg", "/dining/gangnam2.jpg", "/dining/gangnam3.jpg", "/dining/gangnam4.jpg"], opening_time: "11:00 AM", closing_time: "10:00 PM" },
      "horizon": { id: "horizon", name: "Horizon Seaside Restaurant", location: "Brgy. Lonos, Romblon", address: "Brgy. Lonos", category: "Seafood & Grill", description: "Beachfront dining with panoramic ocean views, fresh grilled seafood, and a relaxing sea breeze atmosphere.", image_url: "/dining/horizon.jpg", images: ["/dining/horizon.jpg", "/dining/horizon1.jpg", "/dining/horizon2.jpg", "/dining/horizon3.jpg"], opening_time: "11:00 AM", closing_time: "9:00 PM" },
      "italian": { id: "italian", name: "Italian Trattoria", location: "Town Proper, Romblon", address: "Town Proper", category: "Italian & Pizza", description: "Authentic wood-fired pizzas, fresh homemade pasta, fine Italian wines, and desserts in a romantic candlelit setting.", image_url: "/dining/italian.jpg", images: ["/dining/italian.jpg", "/dining/italian1.jpg", "/dining/italian2.jpg", "/dining/italian3.jpg", "/dining/italian4.jpg"], opening_time: "12:00 PM", closing_time: "10:00 PM" },
      "mamalois": { id: "mamalois", name: "Mama Lois Kitchen", location: "Brgy. Lonos, Romblon", address: "Brgy. Lonos", category: "Local Eat", description: "Home-cooked Romblon carinderia classics with generous servings at very affordable prices. A popular local favorite.", image_url: "/dining/mamalois.jpg", images: ["/dining/mamalois.jpg", "/dining/mamalois1.jpg", "/dining/mamalois2.jpg", "/dining/mamalois3.jpg"], opening_time: "6:00 AM", closing_time: "8:00 PM" },
      "ocean": { id: "ocean", name: "Ocean View Seafood Grill", location: "Brgy. Ginablan, Romblon", address: "Brgy. Ginablan", category: "Seafood", description: "Catch-of-the-day fresh seafood with panoramic ocean sunset views. Grilled fish, squid, and prawns with ice-cold beers.", image_url: "/dining/ocean.jpg", images: ["/dining/ocean.jpg", "/dining/ocean1.jpg", "/dining/ocean2.jpg", "/dining/ocean3.jpg"], opening_time: "10:00 AM", closing_time: "9:00 PM" },
      "panublion": { id: "panublion", name: "Panublion Heritage Diner", location: "Town Proper, Romblon", address: "Town Proper", category: "Heritage Cuisine", description: "Heritage Romblon recipes and delicacies using traditional island ingredients. A warm, historic cultural dining experience.", image_url: "/dining/panublion.jpg", images: ["/dining/panublion.jpg", "/dining/panublion1.jpg", "/dining/panublion2.jpg", "/dining/panublion3.jpg"], opening_time: "10:00 AM", closing_time: "9:00 PM" },
      "reggae": { id: "reggae", name: "Reggae Bar & Grill", location: "Agpanabat, Romblon", address: "Agpanabat", category: "Bar & Grill", description: "Bohemian beachfront bar and grill with live music, tropical cocktails, grilled BBQ skewers, and chill bonfire nights.", image_url: "/dining/reggae.jpg", images: ["/dining/reggae.jpg", "/dining/reggae1.jpg", "/dining/reggae2.jpg", "/dining/reggae3.jpg", "/dining/reggae4.jpg"], opening_time: "4:00 PM", closing_time: "12:00 AM" },
      "sunbird": { id: "sunbird", name: "Sunbird Cafe & Lounge", location: "Romblon Town", address: "Romblon Town", category: "Café", description: "Specialty coffee and cold brews, healthy breakfast bowls and sandwiches in a peaceful garden lounge setting.", image_url: "/dining/sunbird.jpg", images: ["/dining/sunbird.jpg"], opening_time: "7:00 AM", closing_time: "6:00 PM" },
      "yurich": { id: "yurich", name: "Yurich Food House", location: "Brgy. Ginablan, Romblon", address: "Brgy. Ginablan", category: "Local Restaurant", description: "Hearty local Filipino dishes, fresh fruit shakes, and desserts in a cozy family atmosphere at very affordable prices.", image_url: "/dining/yurich.jpg", images: ["/dining/yurich.jpg", "/dining/yurich1.jpg", "/dining/yurich2.jpg", "/dining/yurich3.jpg", "/dining/yurich4.jpg", "/dining/yurich5.jpg"], opening_time: "8:00 AM", closing_time: "9:00 PM" },
    };
    return STATIC[diningId] || null;
  };

  const handleSubmitReview = async () => {
    if (review.rating === 0) { setError("Please select a star rating."); return; }
    if (!review.reviewer_name.trim()) { setError("Please enter your nickname."); return; }
    setSubmitting(true);
    setError("");
    const payload = {
      item_type: type,
      item_id: id,
      item_name: item?.name || "Unknown",
      rating: review.rating,
      comment: review.comment.trim(),
      reviewer_name: review.reviewer_name.trim(),
      created_at: new Date().toISOString(),
    };
    try {
      // 1. POST to server-side API route — bypasses Supabase RLS completely
      //    This ensures the review lands in the DB regardless of auth state
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        // Server-side insert also failed — log for debugging
        console.warn('Server insert fallback:', result.error);
      }
    } catch (err) {
      console.warn('API route unreachable:', err);
    }
    try {
      // 2. Broadcast to admin via dedicated broadcast channel (instant notification)
      const chan = supabase.channel('admin-live-feed');
      await chan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          chan.send({ type: 'broadcast', event: 'new_review', payload });
          supabase.removeChannel(chan);
        }
      });
    } catch { /* ignore */ }
    // 3. Save to localStorage as local cache
    const existing = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]");
    const localEntry = { ...payload, id: `local_${Date.now()}` };
    existing.unshift(localEntry);
    localStorage.setItem("roam_blon_reviews", JSON.stringify(existing.slice(0, 200)));
    setSubmitted(true);
    fetchReviews();
    setSubmitting(false);
  };



  /* ── Loading ── */
  const handleSetVisitorType = (val: "local" | "foreign") => {
    setVisitorType(val);
    setVisitorPrompt(false);
    try { localStorage.setItem("roam_blon_visitor_classified", val); } catch { /* ignore */ }
    // Rescan records the classification now that visitorType is set
    const scanned = JSON.parse(localStorage.getItem("roam_blon_scanned_qrs") || "[]");
    const key = `${type}:${id}`;
    if (scanned.includes(key)) {
      scanned.splice(scanned.indexOf(key), 1);
      localStorage.setItem("roam_blon_scanned_qrs", JSON.stringify(scanned));
      loggedScans.delete(key);
      logQRScan(type, id, item?.name || "Location");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F6F1ED] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-rose-500" size={40} />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Loading...</p>
      </div>
    </div>
  );

  /* ── No params — show live camera scanner ── */
  if (!type || !id) return <QRScanner />;

  /* ── Item not found after load — show scanner again ── */
  if (!item) return <QRScanner />;

/* ─── DINING MEDIA DATABASE ─────────────────────────────────────────── */
const DINING_MEDIA: Record<string, { images: string[]; highlights: string[]; bestTime: string; activities: string[]; videoId?: string; videoUrl?: string; entranceFee?: string }> = {
  "bistro": {
    images: ["/dining/bistro.jpg", "/dining/bistro1.jpg", "/dining/bistro2.jpg", "/dining/bistro3.jpg", "/dining/bistro4.jpg"],
    highlights: ["Artisanal Romblon espresso & brews", "Cozy air-conditioned ambiance", "Freshly baked pastries & local snacks", "Free high-speed Wi-Fi for travelers"],
    bestTime: "07:00 AM – 10:00 PM",
    activities: ["Coffee & Pastries", "Remote Work", "Snack Break", "Socializing"],
  },
  "el": {
    images: ["/dining/el.jpg", "/dining/el1.jpg", "/dining/el2.jpg", "/dining/el3.jpg", "/dining/el4.jpg", "/dining/el5.jpg"],
    highlights: ["Full-service hotel restaurant", "Fresh seafood & Filipino favorites", "Spacious dining area for groups", "Cocktails & cold beverages"],
    bestTime: "06:00 AM – 10:00 PM",
    activities: ["Buffet Dining", "Group Dinners", "Cocktails", "Breakfast"],
  },
  "gangnam": {
    images: ["/dining/gangnam.jpg", "/dining/gangnam1.jpg", "/dining/gangnam2.jpg", "/dining/gangnam3.jpg", "/dining/gangnam4.jpg"],
    highlights: ["Unlimited Korean BBQ & Samgyeopsal", "Authentic Korean side dishes (Banchan)", "Fun tabletop grill experience", "Great for family & friends"],
    bestTime: "11:00 AM – 10:00 PM",
    activities: ["Korean BBQ", "Samgyeopsal", "Group Dining", "Celebrations"],
  },
  "horizon": {
    images: ["/dining/horizon.jpg", "/dining/horizon1.jpg", "/dining/horizon2.jpg", "/dining/horizon3.jpg"],
    highlights: ["Beachfront ocean views", "Fresh grilled seafood & meat", "Relaxing sea breeze dining", "Sunset dinner setting"],
    bestTime: "11:00 AM – 09:00 PM",
    activities: ["Sunset Dinner", "Seafood Tasting", "Beachfront Dining", "Drinks"],
  },
  "italian": {
    images: ["/dining/italian.jpg", "/dining/italian1.jpg", "/dining/italian2.jpg", "/dining/italian3.jpg", "/dining/italian4.jpg"],
    highlights: ["Wood-fired authentic pizzas", "Fresh homemade pasta dishes", "Fine Italian wines & desserts", "Romantic candlelit atmosphere"],
    bestTime: "12:00 PM – 10:00 PM",
    activities: ["Pizza & Pasta", "Wine Tasting", "Romantic Dinners", "Dessert"],
  },
  "mamalois": {
    images: ["/dining/mamalois.jpg", "/dining/mamalois1.jpg", "/dining/mamalois2.jpg", "/dining/mamalois3.jpg"],
    highlights: ["Home-cooked Romblon carinderia classics", "Affordable budget-friendly meals", "Generous servings & quick service", "Popular local favorite"],
    bestTime: "06:00 AM – 08:00 PM",
    activities: ["Quick Breakfast", "Budget Lunch", "Home-style Meal", "Takeout"],
  },
  "ocean": {
    images: ["/dining/ocean.jpg", "/dining/ocean1.jpg", "/dining/ocean2.jpg", "/dining/ocean3.jpg"],
    highlights: ["Catch-of-the-day fresh seafood", "Panoramic ocean sunset views", "Grilled fish, squid & prawns", "Ice-cold beers"],
    bestTime: "10:00 AM – 09:00 PM",
    activities: ["Seafood Feast", "Sunset Viewing", "Group Lunch", "Chilled Drinks"],
  },
  "panublion": {
    images: ["/dining/panublion.jpg", "/dining/panublion1.jpg", "/dining/panublion2.jpg", "/dining/panublion3.jpg"],
    highlights: ["Heritage Romblon recipes & delicacies", "Traditional island ingredients", "Cultural dining experience", "Warm historic ambiance"],
    bestTime: "10:00 AM – 09:00 PM",
    activities: ["Heritage Food Tasting", "Cultural Dining", "Family Lunch", "Local Delicacies"],
  },
  "reggae": {
    images: ["/dining/reggae.jpg", "/dining/reggae1.jpg", "/dining/reggae2.jpg", "/dining/reggae3.jpg", "/dining/reggae4.jpg"],
    highlights: ["Bohemian beachfront bar & grill", "Live music & tropical cocktails", "Grilled barbecue skewers", "Chill sunset & bonfire night"],
    bestTime: "04:00 PM – 12:00 AM",
    activities: ["Live Music", "Cocktails", "Bonfire", "Beach Barbecue"],
  },
  "sunbird": {
    images: ["/dining/sunbird.jpg"],
    highlights: ["Specialty coffee & cold brews", "Healthy breakfast bowls & sandwiches", "Peaceful garden lounge setting", "Cozy atmosphere"],
    bestTime: "07:00 AM – 06:00 PM",
    activities: ["Morning Coffee", "Healthy Breakfast", "Reading & Relaxing", "Smoothies"],
  },
  "yurich": {
    images: ["/dining/yurich.jpg", "/dining/yurich1.jpg", "/dining/yurich2.jpg", "/dining/yurich3.jpg", "/dining/yurich4.jpg", "/dining/yurich5.jpg"],
    highlights: ["Hearty local Filipino dishes", "Fresh fruit shakes & desserts", "Cozy family atmosphere", "Very affordable prices"],
    bestTime: "08:00 AM – 09:00 PM",
    activities: ["Family Meal", "Fruit Shakes", "Filipino Favorites", "Group Dining"],
  },
  "f1": {
    images: ["/foods/inaslum.webp", "/foods/sarsa.webp", "/foods/gayabon.webp"],
    highlights: ["Authentic Romblon local delicacies", "Fresh seafood brought daily by local fishermen", "Warm beachfront dining vibe", "Must-try Sarsa & Inaslum"],
    bestTime: "11:00 AM – 09:00 PM",
    activities: ["Local Food Tasting", "Seafood Dinner", "Sunset Dining", "Cocktails"],
  },
  "f2": {
    images: ["/foods/balichow.jpg", "/foods/tagilaw.webp", "/foods/sihi.webp"],
    highlights: ["Artisanal Romblon espresso & brews", "Cozy air-conditioned ambiance", "Freshly baked pastries & local snacks", "Free high-speed Wi-Fi for travelers"],
    bestTime: "07:00 AM – 10:00 PM",
    activities: ["Coffee & Pastries", "Remote Work", "Snack Break", "Socializing"],
  },
  "f3": {
    images: ["/foods/tagilaw.webp", "/foods/sihi.webp", "/foods/inaslum.webp"],
    highlights: ["Open-air seaside grill", "Live acoustic music on weekends", "Fresh grilled pork, fish & squid skewers", "Cold local beverages"],
    bestTime: "05:00 PM – 11:00 PM",
    activities: ["Seaside BBQ", "Live Music", "Sunset Drinks", "Group Dining"],
  },
};

  /* ── Destination (Beach) / Dining page ── */
  const isDestination = type === "destination" || type === "landmarks" || type === "fall" || type === "dining";
  const getDiningMediaFallback = (it: any) => {
    const imageUrl = it?.image_url || it?.image || "";
    const baseName = String(imageUrl).split("/").pop()?.split(".")[0]?.toLowerCase() || "";
    const candidateKeys = [String(it?.id || "").toLowerCase(), baseName].filter(Boolean);

    for (const key of candidateKeys) {
      if (DINING_MEDIA[key]) return DINING_MEDIA[key];
    }

    const fallbackImages = Array.isArray(it?.images) && it.images.length > 0
      ? it.images
      : imageUrl ? [imageUrl] : ["/dining/bistro.jpg"];

    return {
      images: fallbackImages,
      highlights: [
        it?.category || "Local Eat",
        "Authentic Romblon Island Flavors",
        "Fresh Local Ingredients",
        "Must-Try Island Specialties"
      ],
      bestTime: (it?.opening_time && it?.closing_time) ? `${it.opening_time} – ${it.closing_time}` : "08:00 AM – 10:00 PM",
      activities: ["Local Dining", "Food Tasting", "Seafood & Grill", "Relaxing"],
      entranceFee: it?.entrance_fee || "Free",
      videoId: undefined,
      videoUrl: undefined,
    };
  };

  const beachMedia = type === "destination" || type === "landmarks" || type === "fall"
    ? (BEACH_MEDIA[item.id] || BEACH_MEDIA[id] || {
        images: [item.image_url || item.image || "/beach&resorts/bonbon.jpg"],
        highlights: ["Pristine tropical views", "White sand shorelines", "Crystal clear island waters", "Unforgettable scenery"],
        bestTime: "Best from December – May",
        activities: ["Swimming", "Beach Walking", "Photography", "Relaxing"],
        entranceFee: "Free",
        videoId: undefined,
        videoUrl: undefined,
      })
    : (type === "dining" ? getDiningMediaFallback(item) : null);

  const imageUrl = item.image_url || item.image || "";
  const allImages = type === "dining"
    ? (Array.isArray(item.images) && item.images.length > 0 ? item.images : beachMedia?.images || (imageUrl ? [imageUrl] : []))
    : (beachMedia ? beachMedia.images : (imageUrl ? [imageUrl] : []));

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-1.5 text-white/60 hover:text-rose-400 transition-colors text-sm font-bold">
          <ChevronLeft size={18} />
        </a>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center">
            {type === "dining" ? <Utensils size={14} className="text-white" /> : isDestination ? <Waves size={14} className="text-white" /> : <Camera size={14} className="text-white" />}
          </div>
          <span className="font-black text-white text-sm uppercase tracking-wider">ROAM-BLON</span>
        </div>
        {isDestination && (
          <a
            href={`https://maps.google.com/maps?q=${encodeURIComponent((item.name || "") + ", Romblon")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-rose-700 transition-all"
          >
            <MapPin size={10} /> Map
          </a>
        )}
      </header>

      {isDestination && beachMedia ? (
        /* ═══════════════════════════════════════════════════════════════
           DESTINATION (BEACH) — FULL MEDIA EXPERIENCE
        ════════════════════════════════════════════════════════════════ */
        <div className="flex-1 text-white">

          {/* Hero strip with beach name */}
          <div className="px-4 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest bg-rose-900/40 px-2.5 py-1 rounded-full border border-rose-800/50">
                {type === "dining" ? "🍽️ Dining Shops" : type === "fall" ? "🌊 Waterfall" : type === "landmarks" ? "🏛️ Landmark" : "🏖️ Tourist Destination"}
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-white mt-2">{item.name}</h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-white/60">
              <MapPin size={12} />
              <span className="text-xs font-bold">{item.location || item.barangay || "Romblon, Philippines"}</span>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="px-4 mb-4">
            <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              {([
                { key: "map", icon: MapPin, label: "Route Map" },
                { key: "gallery", icon: ImageIcon, label: "Photos" },
                { key: "video", icon: Play, label: "Video" },
                { key: "info", icon: Info, label: "Info" },
              ] as const).filter(tab => tab.key !== "video" || beachMedia?.videoId || beachMedia?.videoUrl).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === tab.key
                      ? "bg-rose-600 text-white shadow-lg"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="px-4">

            {/* ROUTE MAP TAB */}
            {activeTab === ("map" as any) && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <LeafletRouteMap destination={item} />
              </div>
            )}

            {/* GALLERY TAB */}
            {activeTab === "gallery" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <PhotoGallery images={allImages} name={item.name} />

                {/* Quick highlights */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">✨ Highlights</p>
                  <div className="grid grid-cols-1 gap-2">
                    {beachMedia.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-white/80">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {(item.description || item.desc) && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">About</p>
                    <p className="text-sm font-medium text-white/75 leading-relaxed">{item.description || item.desc}</p>
                  </div>
                )}
              </div>
            )}

            {/* VIDEO TAB */}
            {activeTab === "video" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <VideoSection videoId={beachMedia.videoId} videoUrl={beachMedia.videoUrl} name={item.name} previewImage={beachMedia.images[0]} />

                {beachMedia.videoUrl && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">📺 Codec Compatibility Fallback</p>
                    <a
                      href={beachMedia.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-3 rounded-2xl transition-all font-black text-sm"
                    >
                      <span>Open / Download Video File</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">📍 More Videos on YouTube</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + " Romblon Philippines")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-2xl transition-all font-black text-sm"
                  >
                    <span>Search more videos</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Activities */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">🏄 Activities</p>
                  <div className="flex flex-wrap gap-2">
                    {beachMedia.activities.map((act, i) => (
                      <span key={i} className="bg-white/10 border border-white/20 text-white/80 text-xs font-black px-3 py-1.5 rounded-full">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INFO TAB */}
            {activeTab === "info" && (
              <div className="space-y-4 animate-in fade-in duration-300">

                {/* Best Time */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun size={16} className="text-amber-400" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Best Time to Visit</p>
                  </div>
                  <p className="text-sm font-bold text-white/80">{beachMedia.bestTime}</p>
                </div>

                {/* Entrance Fee */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet size={16} className="text-emerald-400" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Entrance Fee</p>
                  </div>
                  <p className="text-sm font-bold text-white/80">
                    {beachMedia.entranceFee || item.entrance_fee || item.info?.entranceFee || "Free"}
                  </p>
                </div>

                {/* Activities */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wind size={16} className="text-blue-400" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Things to Do</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {beachMedia.activities.map((act, i) => (
                      <span key={i} className="bg-blue-900/40 border border-blue-700/40 text-blue-300 text-xs font-black px-3 py-1.5 rounded-full">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>

                {/* About */}
                {(item.description || item.desc) && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={16} className="text-slate-400" />
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">About</p>
                    </div>
                    <p className="text-sm font-medium text-white/70 leading-relaxed">{item.description || item.desc}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── REVIEWS DISPLAY FEED (DARK THEME) ── */}
          {(() => {
            const avgRating = existingReviews.length
              ? (existingReviews.reduce((s, r) => s + r.rating, 0) / existingReviews.length).toFixed(1)
              : null;
            return (
              <div className="px-4 mt-6 mb-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        <span>Tourist Reviews ⭐</span>
                      </h2>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                        Visitor feedback & star ratings
                      </p>
                    </div>
                    {avgRating && (
                      <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-2xl">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <span className="font-black text-white text-base">{avgRating}</span>
                        <span className="text-white/40 text-xs font-bold">({existingReviews.length})</span>
                      </div>
                    )}
                  </div>

                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="animate-spin text-rose-500" size={24} />
                    </div>
                  ) : existingReviews.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/10">
                      <Star size={32} className="text-white/20 mx-auto mb-2" />
                      <p className="text-white/60 text-xs font-black uppercase tracking-widest">No reviews yet</p>
                      <p className="text-white/40 text-[11px] font-medium mt-1">Be the first to leave a review below!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {existingReviews.map((r: any, idx: number) => (
                        <div key={r.id || idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-rose-600/30 border border-rose-500/30 flex items-center justify-center text-white font-black text-xs">
                                {(r.reviewer_name || "A")[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="font-black text-white text-sm block leading-tight">{r.reviewer_name}</span>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={12}
                                  className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-white/10 fill-white/5"}
                                />
                              ))}
                            </div>
                          </div>
                          {r.comment && (
                            <p className="text-white/80 text-xs font-medium leading-relaxed pl-1">"{r.comment}"</p>
                          )}
                          <p className="text-white/30 text-[9px] font-bold text-right">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── REVIEW SECTION ── */}
          <div className="px-4 mt-2 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="text-base font-black text-white uppercase tracking-tighter">Leave a Review ⭐</h2>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Your feedback helps other tourists!</p>
              </div>
              <div className="p-5">
                {!submitted ? (
                  <div className="space-y-4">
                    {/* Stars */}
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Your Rating</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setReview(r => ({ ...r, rating: star }))}
                            className="transition-transform hover:scale-125 active:scale-110"
                          >
                            <Star
                              size={34}
                              className={`transition-colors ${
                                star <= (hoveredStar || review.rating)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-white/20 fill-white/10"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-white/40 font-bold mt-1">
                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hoveredStar || review.rating]}
                      </p>
                    </div>

                    <input
                      type="text"
                      value={review.reviewer_name}
                      onChange={e => setReview(r => ({ ...r, reviewer_name: e.target.value }))}
                      placeholder="Your nickname *"
                      className="w-full bg-white/10 border border-white/20 focus:border-rose-500 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none transition-colors"
                    />

                    <textarea
                      value={review.comment}
                      onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                      placeholder="Share your experience here... (optional)"
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 focus:border-rose-500 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none transition-colors resize-none"
                    />

                    {error && <p className="text-rose-400 text-xs font-bold bg-rose-900/30 px-3 py-2 rounded-xl">{error}</p>}

                    <button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                    <p className="font-black text-white text-base">Thank You! 🎉</p>
                    <p className="text-white/50 text-sm font-medium">Your review has been submitted successfully.</p>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={22} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/20 fill-white/10"} />
                      ))}
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mt-1 max-w-sm">
                      <p className="text-emerald-300 text-sm font-bold leading-relaxed">
                        Visit us?
                      </p>
                    </div>
                    <a href="/" className="mt-3 bg-rose-600 text-white font-black px-6 py-3 rounded-xl text-sm hover:bg-rose-700 transition-all">
                      Discover with Roam-Blon
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pb-6">
            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">ROAM-BLON · Romblon Tourism</p>
          </div>
        </div>

      ) : (
        /* ═══════════════════════════════════════════════════════════════
           NON-DESTINATION (Dining / Souvenir) — ORIGINAL LAYOUT
        ════════════════════════════════════════════════════════════════ */
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">

          {/* Type Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${
            type === "dining" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-purple-50 text-purple-600 border-purple-100"
          }`}>
            {type === "dining" ? <Utensils size={14} /> : <Gift size={14} />}
            {type === "dining" ? "Dining Shops" : "Souvenir Shop"}
          </div>

          {/* Main Image */}
          {imageUrl && (
            <div className="rounded-3xl overflow-hidden h-56 border-4 border-white shadow-xl">
              <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Info Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{item.name}</h1>
            {(item.location || item.address || item.barangay) && (
              <div className="flex items-start gap-2 text-rose-500">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span className="text-sm font-bold text-slate-600">{item.location || item.address || item.barangay}</span>
              </div>
            )}
            {(item.opening_time || item.closing_time) && (
              <div className="flex items-center gap-2 text-slate-500">
                <Clock size={14} className="shrink-0" />
                <span className="text-sm font-bold">{item.opening_time} – {item.closing_time}</span>
              </div>
            )}
            {item.description && (
              <p className="text-slate-600 text-sm font-medium leading-relaxed border-t border-slate-100 pt-3">{item.description}</p>
            )}
            {item.price && (
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</span>
                <span className="text-2xl font-black text-rose-500">₱{item.price}</span>
              </div>
            )}
          </div>

          {/* ── REVIEWS DISPLAY FEED (LIGHT THEME) ── */}
          {(() => {
            const avgRating = existingReviews.length
              ? (existingReviews.reduce((s, r) => s + r.rating, 0) / existingReviews.length).toFixed(1)
              : null;
            return (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                      <span>Tourist Reviews ⭐</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      Visitor feedback & star ratings
                    </p>
                  </div>
                  {avgRating && (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-2xl">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      <span className="font-black text-slate-800 text-base">{avgRating}</span>
                      <span className="text-slate-400 text-xs font-bold">({existingReviews.length})</span>
                    </div>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="animate-spin text-rose-500" size={24} />
                  </div>
                ) : existingReviews.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <Star size={32} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No reviews yet</p>
                    <p className="text-slate-400 text-[11px] font-medium mt-1">Be the first to leave a review!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {existingReviews.map((r: any, idx: number) => (
                      <div key={r.id || idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                              {(r.reviewer_name || "A")[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-black text-slate-800 text-sm block leading-tight">{r.reviewer_name}</span>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-slate-600 text-xs font-medium leading-relaxed pl-1">"{r.comment}"</p>
                        )}
                        <p className="text-slate-300 text-[9px] font-bold text-right">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Review Section */}
          {!submitted ? (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Leave a Review</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-5">Your feedback helps other tourists!</p>
              <div className="mb-5">
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Your Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setReview(r => ({ ...r, rating: star }))}
                      className="transition-transform hover:scale-125"
                    >
                      <Star size={36} className={`transition-colors ${star <= (hoveredStar || review.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Nickname</label>
                <input type="text" value={review.reviewer_name}
                  onChange={e => setReview(r => ({ ...r, reviewer_name: e.target.value }))}
                  placeholder="e.g. Juan, Traveler123"
                  className="w-full border-2 border-slate-100 focus:border-rose-400 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="mb-5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Comment <span className="text-slate-300">(optional)</span></label>
                <textarea value={review.comment}
                  onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                  placeholder="Share your experience here..."
                  rows={3}
                  className="w-full border-2 border-slate-100 focus:border-rose-400 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors resize-none bg-slate-50 focus:bg-white"
                />
              </div>
              {error && <p className="text-rose-500 text-xs font-bold mb-3 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}
              <button onClick={handleSubmitReview} disabled={submitting}
                className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Thank You!</h2>
              <p className="text-slate-500 font-bold text-sm">Your review has been submitted. We appreciate your feedback!</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={24} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                ))}
              </div>
              <a href="/" className="mt-2 bg-slate-900 text-white font-black px-6 py-3 rounded-xl text-sm hover:bg-rose-600 transition-all">
                Discover with Roam-Blon
              </a>
            </div>
          )}

          <div className="text-center pb-4">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">ROAM-BLON · Romblon Tourism</p>
          </div>
        </div>
      )}

      {visitorPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto bg-rose-50 rounded-2xl flex items-center justify-center mb-5">
              <QrCode size={30} className="text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">Are you local or foreign?</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-7">Help us understand Romblon's visitors</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSetVisitorType("local")}
                className="bg-emerald-500 text-white font-black py-4 rounded-2xl text-sm hover:bg-emerald-600 transition-all"
              >
                LOCAL
              </button>
              <button
                onClick={() => handleSetVisitorType("foreign")}
                className="bg-rose-500 text-white font-black py-4 rounded-2xl text-sm hover:bg-rose-600 transition-all"
              >
                FOREIGN
              </button>
            </div>
            <button
              onClick={() => setVisitorPrompt(false)}
              className="mt-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600"
            >
              Skip
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function QRScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-500" size={40} />
      </div>
    }>
      <QRScanContent />
    </Suspense>
  );
}
