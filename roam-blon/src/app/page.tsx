"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { resolveCoords } from "@/lib/coordinates";
import {
  Star,
  Utensils,
  Bike,
  ShieldAlert,
  CalendarCheck,
  X,
  Trees,
  Hotel,
  Building2,
  Landmark,
  MessageCircle,
  Sparkles,
  MapPin,
  LogOut,
  Gift,
  Compass,
  ArrowRight,
  Menu,
  Target,
  Eye,
  Twitter,
  Instagram,
  Facebook,
  Map,
  QrCode,
  Trophy,
  Camera,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Images,
  Waves,
  Phone,
  CloudLightning,
  Bell,
} from "lucide-react";

import DiningList from "@/components/DiningList";
import TouristAuthFlow from "@/components/TouristAuthFlow";
import EmergencyHotlines from "@/components/EmergencyButton";
import QRItemModal from "@/components/QRItemModal";
import LeafletRouteMap from "@/components/LeafletRouteMap";
import BookingNotifications from "@/components/BookingNotifications";
import TouristProfile from "@/components/TouristProfile";
import EvaluationForm from "@/components/EvaluationForm";

// Profile icon that shows the avatar photo when set, otherwise the email initial
function TouristAvatar({ tourist }: { tourist: any }) {
  if (tourist?.avatar_url) {
    return <img src={tourist.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />;
  }
  return <>{String(tourist?.email || "R")[0]}</>;
}

// The DESTINATIONS array is now fetched dynamically from Supabase.
// We keep the static ones as a fallback/initial state if needed.
const STATIC_DESTINATIONS = [
  {
    id: "sd-bonbon", name: "Bonbon Beach", barangay: "Brgy. Lonos",
    address: "Bonbon Beach Access Road, Brgy. Lonos, Romblon Island, 5500 Romblon",
    contact: "+63 917 842 1092",
    desc: "The crown jewel of Romblon, featuring a world-famous powdery sandbar that emerges during low tide and stretches toward Bangug Island. Ideal for swimming, snorkeling, sunset watching, and landscape photography.",
    howToGetThere: "Take a 15-minute tricycle ride from Romblon Town Proper to Brgy. Lonos. Follow the walkway signage down to the shore. At low tide (6:00 AM – 9:00 AM), you can walk all the way along the sandbar.",
    tag: "Sandbar", type: "Beach", category: "Beach",
    image: "/beach%26resorts/bonbon.jpg", image_url: "/beach%26resorts/bonbon.jpg",
    images: ["/beach%26resorts/bonbon.jpg", "/beach%26resorts/bonbon1.jpg", "/beach%26resorts/bonbon2.jpg", "/beach%26resorts/bonbon3.jpg", "/beach%26resorts/bonbon4.jpg"],
    info: { type: "Natural Beach", access: "Tricycle / Motorbike", bestTime: "Low Tide (6AM–9AM)", entranceFee: "₱10 public / ₱60 private", visitingHours: "6:00 AM - 6:00 PM", features: ["Famous Sandbar", "Snorkeling", "Swimming", "Sunset View"] }
  },
  {
    id: "sd-peable", name: "Pebble Walk Beach Resort", barangay: "Brgy. Sablayan",
    address: "Sitio Lahong, Brgy. Sablayan, Romblon Island, 5500 Romblon",
    contact: "+63 928 554 9918",
    desc: "A wide, white-sand paradise bordered by lush coconut groves and cozy beachside cottages. Offers clear turquoise waters for snorkeling, beach volleyball, and relaxed weekend stays.",
    howToGetThere: "Hop on a southbound tricycle from Romblon Town Center along the Lamao–Calabogo–Sablayan coastal highway for about 45 minutes until reaching Sitio Lahong, Brgy. Sablayan.",
    tag: "Top Rated", type: "Resort", category: "Resort",
    image: "/beach%26resorts/peabble.jpg", image_url: "/beach%26resorts/peabble.jpg",
    images: ["/beach%26resorts/peabble.jpg", "/beach%26resorts/peabble1.jpg", "/beach%26resorts/peabble2.jpg"],
    info: { type: "Beach Resort", access: "Tricycle", bestTime: "Year-round", entranceFee: "₱100", visitingHours: "8:00 AM - 5:00 PM", features: ["White Sand", "Cottages", "Palm Trees", "Swimming"] }
  },
  {
    id: "sd-tiamban", name: "Tiamban Beach", barangay: "Brgy. Lonos",
    address: "Tiamban Beach Shoreline, Brgy. Lonos, Romblon Island, 5500 Romblon",
    contact: "+63 919 772 3014",
    desc: "Crystal clear shallow waters and fine white sand make Tiamban an ideal haven for families and young children. Offers shaded bamboo huts and peaceful swimming areas.",
    howToGetThere: "Located just past Bonbon Beach. Take a 12-minute tricycle ride from Town Proper (₱30 fare per head) directly to the Tiamban entrance path.",
    tag: "Family Friendly", type: "Beach", category: "Beach",
    image: "/beach%26resorts/tiamban.jpg", image_url: "/beach%26resorts/tiamban.jpg",
    images: ["/beach%26resorts/tiamban.jpg", "/beach%26resorts/tiamban2.jpg", "/beach%26resorts/tiamban3.jpg", "/beach%26resorts/tiamban4.jpg"],
    info: { type: "Natural Beach", access: "Tricycle", bestTime: "Morning", entranceFee: "₱50 adult / ₱30 kids", visitingHours: "8:00 AM - 5:00 PM", features: ["Shallow Waters", "Family Friendly", "Fine White Sand"] }
  },
  {
    id: "sd-talipasak", name: "Talipasak Beach", barangay: "Brgy. Ginablan",
    address: "Talipasak Cove, Brgy. Ginablan, Romblon Island, 5500 Romblon",
    contact: "+63 920 411 7088",
    desc: "A quiet, secluded cove framed by lush rock formations and serene clear waters. Known for spectacular golden sunsets, peaceful kayaking, and marine biodiversity.",
    howToGetThere: "From the town center, you may hire a tricycle to take you to San Pedro Beach Resort. The fare starts at P200 for 2-3 pax. The travel time is 30-45 minutes.",
    tag: "Hidden Gem", type: "Beach", category: "Beach",
    image: "/beach%26resorts/talipasak.jpg", image_url: "/beach%26resorts/talipasak.jpg",
    images: ["/beach%26resorts/talipasak.jpg", "/beach%26resorts/talipasak2.jpg", "/beach%26resorts/talipasak3.jpg"],
    info: { type: "Natural Beach", access: "Tricycle + Walk", bestTime: "Sunset (5PM–6PM)", entranceFee: "₱50 adult / ₱30 kids", visitingHours: "8:00 AM - 5:00 PM", features: ["Secluded Cove", "Sunset View", "Peaceful", "Photography"] }
  },
  {
    id: "sd-lamao", name: "Lamao Beach Resort", barangay: "Brgy. Lamao",
    address: "Lamao–Calabogo–Sablayan Road, Brgy. Lamao, Romblon Island, 5500 Romblon",
    contact: "+63 917 630 1145",
    desc: "A pristine tropical island escape featuring soft white sand, calm turquoise waters, and thriving coral reefs. A mandatory highlight on Romblon island hopping trips.",
    howToGetThere: "A 45-minute drive from Romblon Town Proper along the Lamao–Calabogo–Sablayan coastal road to the opposite (east) side of Romblon Island.",
    tag: "Pristine", type: "Resort", category: "Resort",
    image: "/beach%26resorts/lamao.jpg", image_url: "/beach%26resorts/lamao.jpg",
    images: ["/beach%26resorts/lamao.jpg", "/beach%26resorts/lamao1.jpg", "/beach%26resorts/lamao2.jpg", "/beach%26resorts/lamao3.jpg"],
    info: { type: "Island Resort", access: "Outrigger Boat", bestTime: "Dry Season (Nov–May)", entranceFee: "₱100 adult / ₱70 kids", visitingHours: "8:00 AM - 5:00 PM", features: ["Island Hopping", "Turquoise Waters", "White Sand", "Snorkeling"] }
  },
  {
    id: "sd-dc-logbon", name: "DC Munting Paraiso", barangay: "Brgy. Agnay",
    address: "Munting Paraiso Beach, Brgy. Agnay, Romblon, 5500 Romblon",
    contact: "+63 939 912 4055",
    desc: "A serene hideaway in Brgy. Agnay where fine white sand meets calm turquoise water. Fringed by swaying coconut palms and shaded day cottages, DC Munting Paraiso is the perfect spot to unwind, swim, and feast on fresh seafood grilled right by the shore — served with warm island hospitality.",
    howToGetThere: "A short tricycle ride from Romblon Town Proper toward Brgy. Agnay (near the Lonos/Sawang road), about 10–15 minutes by land.",
    tag: "Island Favorite", type: "Resort", category: "Resort",
    image: "/beach%26resorts/dc.jpg", image_url: "/beach%26resorts/dc.jpg",
    images: ["/beach%26resorts/dc.jpg", "/beach%26resorts/dc1.jpg", "/beach%26resorts/dc2.jpg", "/beach%26resorts/dc3.jpg"],
    info: { type: "Beach Resort", access: "Tricycle", bestTime: "Morning", entranceFee: "₱50 adult / ₱30 kids", visitingHours: "8:00 AM - 5:00 PM", features: ["White Sand", "Coastal Retreat", "Swimming", "Relaxation"] }
  },
  {
    id: "sd-coco", name: "Coco Cabana", barangay: "Brgy. Palje",
    address: "Bantigue–Sablayan Road, Brgy. Palje, Romblon Island, 5500 Romblon",
    contact: "+63 918 204 8831",
    desc: "A tranquil beachfront guest house on the southern coast of Romblon Island. Perfect for hammocks under palm trees, swimming, snorkeling, and unplugging from city life.",
    howToGetThere: "A 20–25 minute tricycle ride from Romblon Town Proper along the coastal road to Bantigue, Brgy. Palje (about 10 km from the town center).",
    tag: "Quiet Retreat", type: "Resort", category: "Resort",
    image: "/beach%26resorts/coco.jpg", image_url: "/beach%26resorts/coco.jpg",
    images: ["/beach%26resorts/coco.jpg", "/beach%26resorts/coco1.jpg", "/beach%26resorts/coco2.jpg", "/beach%26resorts/coco3.jpg", "/beach%26resorts/coco4.jpg", "/beach%26resorts/coco5.jpg", "/beach%26resorts/coco6.jpg"],
    info: { type: "Beachfront Resort", access: "Tricycle", bestTime: "Morning to Noon", entranceFee: "₱100 adult / ₱50 kids", visitingHours: "8:00 AM - 5:00 PM", features: ["Less Crowded", "Privacy", "Palm Shade", "Swimming"] }
  },
  {
    id: "sd-reggae", name: "Reggae Vibes Romblon", barangay: "Agpanabat",
    address: "Agpanabat Coastal Road, Brgy. Agpanabat, Romblon, 5500 Romblon",
    contact: "+63 927 348 1190",
    desc: "A bohemian beachfront accommodation and lounge popular among backpackers. Features acoustic reggae music, beach bonfires, and cold local craft beverages.",
    howToGetThere: "18-minute tricycle ride from Town Proper heading towards Agpanabat along the coastal road.",
    tag: "Budget Stay", type: "Hotel", category: "Hotel",
    image: "/beach%26resorts/reggae.jpg", image_url: "/beach%26resorts/reggae.jpg",
    images: ["/beach%26resorts/reggae.jpg", "/beach%26resorts/reggae1.jpg", "/beach%26resorts/reggae2.jpg", "/beach%26resorts/reggae3.jpg", "/beach%26resorts/reggae4.jpg", "/beach%26resorts/reggae5.jpg"],
    info: { type: "Backpacker Hotel", access: "Tricycle", bestTime: "Year-round", entranceFee: "₱50 adult / ₱30 kids (free if dine-in)", visitingHours: "8:00 AM - 5:00 PM", features: ["Backpacker Friendly", "Affordable", "Beachfront", "Chill Vibe"] }
  },
  {
    id: "sd-robinson", name: "Robinson's Cove", barangay: "Brgy. Lonos",
    address: "Robinson Inlet, Brgy. Lonos, Romblon Island, 5500 Romblon",
    contact: "+63 917 500 2234",
    desc: "A picturesque hidden inlet featuring a mini sandbar, calm waters, and dramatic rock formations. An ideal spot for drone videography and romantic strolls.",
    howToGetThere: "12 minutes by tricycle from Town Proper to Brgy. Lonos turnout, followed by a 3-minute walking path to the cove.",
    tag: "Photogenic", type: "Beach", category: "Beach",
    image: "/beach%26resorts/robinson.jpg", image_url: "/beach%26resorts/robinson.jpg",
    images: ["/beach%26resorts/robinson.jpg", "/beach%26resorts/robinson1.jpg", "/beach%26resorts/robinson2.jpg", "/beach%26resorts/robinson3.jpg", "/beach%26resorts/robinson4.jpg"],
    info: { type: "Natural Cove", access: "Tricycle + Walk", bestTime: "Golden Hour", entranceFee: "₱50 adult / ₱30 kids", visitingHours: "8:00 AM - 5:00 PM", features: ["Sandbar", "Photography", "Hidden Inlet", "Peaceful"] }
  },
  {
    id: "sd-horizon", name: "Horizon Hotel Romblon", barangay: "Brgy. Lonos",
    address: "Lonos Beachfront, Brgy. Lonos, Romblon Island, 5500 Romblon",
    contact: "+63 918 392 7041",
    desc: "A stunning seaside resort offering elevated oceanfront rooms, infinity views, fresh seafood dining, and direct access to pristine swimming waters.",
    howToGetThere: "Take a tricycle from Romblon Town Proper along Lonos main road (approx. 10-15 minutes).",
    tag: "Sea View", type: "Hotel", category: "Hotel",
    image: "/beach%26resorts/horizon1.jpg", image_url: "/beach%26resorts/horizon1.jpg",
    images: ["/beach%26resorts/horizon1.jpg", "/beach%26resorts/horizon2.jpg", "/beach%26resorts/horizon.jpg"],
    info: { type: "Beachfront Hotel", access: "Tricycle", bestTime: "Year-round", entranceFee: "Free (Dine-in)", visitingHours: "8:00 AM - 5:00 PM", features: ["Sea View", "Accommodations", "Swimming", "Dining"] }
  },
  {
    id: "sd-fort-san-andres", name: "Fort San Andres", barangay: "Town Proper",
    address: "Consolacion Hill, Town Proper, Romblon, 5500 Romblon",
    contact: "+63 42 567 5012",
    desc: "A 17th-century Spanish stone fortress overlooking Romblon harbor. Built by Spanish recollection friars to defend the island against pirate raids. Offers unmatched panoramic views of the entire town.",
    howToGetThere: "Located right in Town Proper. Ascend the stone staircase (around 200 steps) behind the municipal hall or take a 3-minute tricycle up Consolacion Hill.",
    tag: "Heritage", type: "Landmark", category: "Landmark",
    image: "/beach%26resorts/fort.jpg", image_url: "/beach%26resorts/fort.jpg",
    images: ["/beach%26resorts/fort.jpg", "/beach%26resorts/fort1.jpg"],
    info: { type: "Historical Landmark", access: "Walk / Tricycle", bestTime: "Sunset", entranceFee: "Free (Donation)", visitingHours: "8:00 AM - 5:00 PM", features: ["Spanish Fortress", "Panoramic Harbor View", "Historical Site"] }
  },
  {
    id: "sd-stevejoy", name: "Stevejoy Beach House", barangay: "Brgy. Ginablan",
    address: "Brgy. Ginablan, Romblon Island, 5500 Romblon",
    contact: "0976 305 9118",
    desc: "A peaceful beachfront accommodation in Romblon, Romblon, offering guests a relaxing island getaway with beautiful sea views and a quiet atmosphere. Ideal for travelers looking to unwind, watch the sunset, and explore Romblon Island.",
    howToGetThere: "Ride a tricycle from Freedom Park and tell the driver you're going to Stevejoy Beach House in Ginablan (5–10 mins). If driving or riding a motorcycle, follow the main coastal road toward Barangay Ginablan.",
    tag: "Beachfront", type: "Resort", category: "Resort",
    image: "/beach%26resorts/peabble.jpg", image_url: "/beach%26resorts/peabble.jpg",
    images: ["/beach%26resorts/peabble.jpg", "/beach%26resorts/peabble1.jpg", "/beach%26resorts/peabble2.jpg"],
    info: { type: "Beach House / Resort", access: "Tricycle / Motorbike", bestTime: "Sunset", entranceFee: "₱50", visitingHours: "8:00 AM - 5:00 PM", features: ["Beachfront", "Sea Views", "Quiet Atmosphere", "Sunset Watch"] }
  },
  {
    id: "sd-libtong", name: "Libtong Falls", barangay: "Sablayan Point",
    address: "Sablayan Point, Brgy. Apunan, Romblon Island, 5500 Romblon",
    contact: "+63 917 842 1092",
    desc: "An off-the-beaten-path layered waterfall reached by a 10-15 minute trail that follows the sound of running water upstream, descending below the forest canopy to reveal cascades set against dense tropical greenery.",
    howToGetThere: "Rent a moped or hire a tricycle in Poblacion and drive about 30-40 minutes to Apunan Point. Continue past the big church until you cross a small river, then stop and follow the stream-side path for 10-15 minutes.",
    tag: "Waterfall", type: "Falls", category: "Falls",
    image: "/beach%26resorts/libtong.jpg", image_url: "/beach%26resorts/libtong.jpg",
    images: ["/beach%26resorts/libtong.jpg", "/beach%26resorts/libtong1.jpg"],
    info: { type: "Waterfall", access: "Motorbike + Trek", bestTime: "Morning", entranceFee: "Free", visitingHours: "6:00 AM - 5:00 PM", features: ["Layered Cascades", "Forest Trail", "Natural Pool", "Photography"] }
  },
  {
    id: "sd-kipot", name: "Kipot River", barangay: "Southeast Romblon",
    address: "Kipot River, Southeast Romblon Island, 5500 Romblon",
    contact: "+63 917 842 1092",
    desc: "A hidden emerald river canyon carved through centuries of flowing water. Walk a short steep trail down to natural rock pools where you can swim through narrow slots and jump into the refreshing water.",
    howToGetThere: "From Romblon Town, ride a motorbike or tricycle about 20-30 minutes south-east past Agpanabat. The entrance is through a private yard; the steep trail then winds down to the river canyon.",
    tag: "River Canyon", type: "Falls", category: "Falls",
    image: "/beach%26resorts/kipot.jpg", image_url: "/beach%26resorts/kipot.jpg",
    images: ["/beach%26resorts/kipot.jpg", "/beach%26resorts/kipot2.jpg", "/beach%26resorts/kipot3.jpg"],
    info: { type: "River / Natural Pool", access: "Motorbike + Trek", bestTime: "Morning", entranceFee: "₱10", visitingHours: "6:00 AM - 5:00 PM", features: ["Emerald Canyon", "Natural Pools", "Cliff Jump", "Swimming"] }
  },
  {
    id: "sd-cathedral", name: "Saint Joseph Cathedral", barangay: "Town Proper",
    address: "Plaza Rizal, Town Proper, Romblon, 5500 Romblon",
    contact: "+63 42 567 4011",
    desc: "The Cathedral of Saint Joseph, a Baroque fortress-church built in the 17th century largely from local marble. It is the seat of the Diocese of Romblon and one of the 26 colonial churches declared a National Cultural Treasure in 2001.",
    howToGetThere: "Located right in the Town Proper plaza, a short walk from the port and Freedom Park. It is within 10-15 minutes on foot from anywhere in the town center.",
    tag: "National Treasure", type: "Landmark", category: "Landmark",
    image: "/beach%26resorts/cathedral.jpg", image_url: "/beach%26resorts/cathedral.jpg",
    images: ["/beach%26resorts/cathedral.jpg", "/beach%26resorts/cathedral1.jpg", "/beach%26resorts/cathedral2.jpg"],
    info: { type: "Historical Landmark", access: "Walk", bestTime: "Morning Mass", entranceFee: "Free", visitingHours: "5:00 AM - 7:00 PM", features: ["Baroque Architecture", "Marble Interior", "National Cultural Treasure", "Heritage"] }
  },
  {
    id: "sd-shopping", name: "Romblon Shopping Center", barangay: "Town Proper",
    address: "Freedom Park, Town Proper, Romblon, 5500 Romblon",
    contact: "+63 42 567 4088",
    desc: "The main pasalubong hub of Romblon, located in front of Freedom Park. Browse marble souvenirs, sculptures, furniture, decor, and handcrafted items made by local artisans — with on-site engraving services.",
    howToGetThere: "Just outside the port, directly in front of Freedom Park in the Town Proper. Walk from the pier or ride a tricycle from anywhere in town (3-5 mins).",
    tag: "Marble Souvenirs", type: "Landmark", category: "Landmark",
    image: "/beach%26resorts/shopping1.jpg", image_url: "/beach%26resorts/shopping1.jpg",
    images: ["/beach%26resorts/shopping1.jpg", "/shopping.avif"],
    info: { type: "Shopping Center", access: "Walk / Tricycle", bestTime: "Morning", entranceFee: "Free", visitingHours: "8:00 AM - 6:00 PM", features: ["Marble Souvenirs", "Engraving Services", "Local Crafts", "Pasalubong"] }
  }
];




const NAV_ITEMS = [
  { id: 'welcome', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'dining', label: 'Dining Spots' },
];

interface BeachReview {
  id: string;
  item_type: string;
  item_id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

export default function Home() {
  const [view, setView] = useState("welcome");
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialScreen, setAuthInitialScreen] = useState<"landing" | "signin">("signin");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [tourist, setTourist] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showDestinations, setShowDestinations] = useState(false);
  const [showGuideBooking, setShowGuideBooking] = useState(false);
  const [destCategoryFilter, setDestCategoryFilter] = useState<string>("ALL");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [destinations, setDestinations] = useState<any[]>(STATIC_DESTINATIONS);
  const [selectedQRItem, setSelectedQRItem] = useState<any>(null);
  const [beachReviews, setBeachReviews] = useState<Record<string, BeachReview[]>>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  // Gallery / Lightbox state
  const [activeGallery, setActiveGallery] = useState<any>(null); // destination object for fullscreen lightbox
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [cardPhotoIdx, setCardPhotoIdx] = useState<Record<string, number>>({}); // per-card carousel index
  const router = useRouter();

  /* ── QR Camera Scanner state ─────────────────────────────────────── */
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [scanError, setScanError] = useState("");
  const [scanFacing, setScanFacing] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<any>(null);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === 3) await scannerRef.current.stop();
        scannerRef.current.clear?.();
        scannerRef.current = null;
      }
    } catch { /* ignore */ }
  }, []);

  const startScanner = useCallback(async (facing: "environment" | "user") => {
    await stopScanner();
    setScanStatus("idle");
    setScanError("");

    try {
      // 1. Request camera permission via navigator.mediaDevices if available
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(track => track.stop());
        } catch (permErr: any) {
          const errName = permErr?.name || "";
          const errMessage = permErr?.message || "";
          if (errName === "NotAllowedError" || /permission|denied/i.test(errMessage)) {
            throw new Error("Camera permission denied. Please allow camera access in browser settings.");
          } else if (errName === "NotFoundError" || /not found|no camera/i.test(errMessage)) {
            throw new Error("No camera device found on this system.");
          } else if (errName === "NotReadableError" || /in use|already/i.test(errMessage)) {
            throw new Error("Camera is in use by another application. Please close other camera apps.");
          }
        }
      }

      const { Html5Qrcode } = await import("html5-qrcode");

      const container = document.getElementById("qr-scanner-viewport");
      if (!container) return;

      const scanner = new Html5Qrcode("qr-scanner-viewport", { verbose: false });
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 };
      const onScanSuccess = (decoded: string) => handleQRScan(decoded);
      const onScanFailure = () => {};

      // 2. Get list of available cameras
      let selectedDeviceId: string | null = null;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          if (facing === "environment") {
            const backCam = cameras.find(c => /back|rear|environment/i.test(c.label));
            selectedDeviceId = backCam ? backCam.id : cameras[cameras.length - 1].id;
          } else {
            const frontCam = cameras.find(c => /front|user/i.test(c.label));
            selectedDeviceId = frontCam ? frontCam.id : cameras[0].id;
          }
        }
      } catch (camErr) {
        console.warn("Could not list cameras via getCameras, falling back to facingMode constraint", camErr);
      }

      // 3. Start scanning with deviceId or facingMode constraint
      if (selectedDeviceId) {
        await scanner.start(selectedDeviceId, config, onScanSuccess, onScanFailure);
      } else {
        await scanner.start({ facingMode: facing }, config, onScanSuccess, onScanFailure);
      }

      setScanStatus("scanning");
    } catch (err: any) {
      console.error("Camera scanner error:", err);
      const msg = err?.message || "Could not start camera. Please try again.";
      setScanError(msg);
      setScanStatus("error");
    }
  }, [stopScanner]);

  const handleQRScan = async (raw: string) => {
    await stopScanner();
    setScanStatus("success");
    setTimeout(() => {
      try {
        const url = new URL(raw);
        setShowQRScanner(false);
        setScanStatus("idle");
        if (url.origin === window.location.origin) {
          router.push(url.pathname + url.search);
        } else {
          window.location.href = raw;
        }
      } catch {
        if (raw.startsWith("/")) {
          setShowQRScanner(false);
          setScanStatus("idle");
          router.push(raw);
        } else {
          setScanError(`Not a valid URL: "${raw}"`);
          setScanStatus("error");
        }
      }
    }, 700);
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
    setScanStatus("idle");
    setScanError("");
    // small delay to let the overlay render before we try to attach the scanner
    setTimeout(() => startScanner(scanFacing), 150);
  };

  const closeQRScanner = async () => {
    await stopScanner();
    setShowQRScanner(false);
    setScanStatus("idle");
    setScanError("");
  };

  const flipScanCamera = async () => {
    const next = scanFacing === "environment" ? "user" : "environment";
    setScanFacing(next);
    setScanStatus("idle");
    await startScanner(next);
  };

  const isOverlayOpen = showMap || showDestinations || showLogoutConfirm || showAuth;

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore — always clear local state */ }
    localStorage.removeItem("roam_blon_tourist_user");
    localStorage.removeItem("roam_blon_active_role");
    setTourist(null);
    setView("welcome");
    setShowAuth(false);
    setShowLogoutConfirm(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    async function checkSession() {
      try {
        // Fast restore from localStorage on refresh
        const cachedUser = localStorage.getItem("roam_blon_tourist_user");
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            if (parsed && parsed.email) {
              setTourist(parsed);
              setShowAuth(false);
              setView('welcome');
            }
          } catch {}
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userEmail = user.email?.toLowerCase().trim() || "";

          // Admin and guide sessions live in their own separate storage keys, so a
          // profile found here means a stale session from before the separation.
          // Never bounce the visitor to an admin/guide login — just clear the stale
          // session and show the tourist welcome page.
          const [{ data: adminProfile }, { data: guideProfile }] = await Promise.all([
            supabase.from('admins').select('email').ilike('email', userEmail).maybeSingle(),
            supabase.from('tour_guides').select('email').ilike('email', userEmail).maybeSingle(),
          ]);
          if (adminProfile || guideProfile) {
            await supabase.auth.signOut();
            localStorage.removeItem("roam_blon_tourist_user");
            localStorage.removeItem("roam_blon_active_role");
            setTourist(null);
            setShowAuth(false);
            setView('welcome');
            return;
          }

          // Always show the tourist dashboard for any logged-in tourist. The admin and
          // guide dashboards are only opened through their own login links, so
          // opening the site never bounces anyone to /admin/dashboard or /guide/dashboard.
          const { data: tProfile } = await supabase.from('tourists').select('*').ilike('email', userEmail).maybeSingle();
          const touristData = tProfile || {
            email: user.email,
            gender: "",
            age: "",
            nationality: "local",
          };
          setTourist(touristData);
          localStorage.setItem("roam_blon_tourist_user", JSON.stringify(touristData));
          setShowAuth(false);
          setView('welcome');
        } else {
          localStorage.removeItem("roam_blon_tourist_user");
          localStorage.removeItem("roam_blon_active_role");
          setTourist(null);
          setShowAuth(false);
          setView('welcome');
        }
        const { data: dbDests } = await supabase.from('destinations').select('*');
        if (dbDests && dbDests.length > 0) {
          const mapped = dbDests.map(d => {
            const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
            const baseName = (s: string) => normName(s).replace(/\s(parish|church)\s?$/, '').trim();
            const staticMatch = STATIC_DESTINATIONS.find(s =>
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
              howToGetThere: d.description?.includes("How To Get There:") ? d.description.split("How To Get There:")[1].trim() : `Take a tricycle from Romblon Town Proper to ${d.name}.`,
              tag: d.category === 'Beaches' ? 'Natural' : d.category || 'Featured',
              type: d.category === 'Resort' ? 'Resort' : 'Natural',
              category: d.category || 'Beach',
              image: d.image_url || '/beach%26resorts/peabble.jpg',
              image_url: d.image_url || '/beach%26resorts/peabble.jpg',
              images: d.image_url ? [d.image_url] : ['/beach%26resorts/peabble.jpg', '/beach%26resorts/peabble1.jpg', '/beach%26resorts/peabble2.jpg'],
              info: { type: d.category || 'Tourist Spot', access: 'Tricycle', bestTime: 'Daytime', entranceFee: d.entrance_fee || 'Contact for details', visitingHours: d.visiting_hours || '8:00 AM - 5:00 PM', features: ['Scenic Spot', 'Island Destination'] }
            };
          });

          setDestinations(mapped);
        }
      } catch (err) {
        console.error("Session check logic failed", err);
      }
    }
    checkSession();
  }, [router]);

  // Fetch all destination reviews and subscribe in real-time
  useEffect(() => {
    const fetchBeachReviews = async () => {
      setReviewsLoading(true);
      try {
        let remoteReviews: BeachReview[] = [];
        
        // Try fetching via server-side API route first (bypasses RLS)
        try {
          const res = await fetch('/api/reviews');
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              remoteReviews = json.data.filter((r: any) => r.item_type === "destination") as BeachReview[];
            }
          } else {
            throw new Error("API response not ok");
          }
        } catch {
          // Fallback to direct Supabase query
          const { data } = await supabase
            .from("reviews")
            .select("*")
            .eq("item_type", "destination")
            .order("created_at", { ascending: false });
          if (data) remoteReviews = data as BeachReview[];
        }

        const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]") as BeachReview[];
        const localReviews = stored.filter(r => r.item_type === "destination");

        const allReviews = [...remoteReviews];
        localReviews.forEach(lr => {
          if (!allReviews.some(ar => ar.id === lr.id || (ar.reviewer_name === lr.reviewer_name && ar.comment === lr.comment))) {
            allReviews.push(lr);
          }
        });

        const grouped: Record<string, BeachReview[]> = {};
        allReviews.forEach((r: BeachReview) => {
          if (r.item_id) {
            if (!grouped[r.item_id]) grouped[r.item_id] = [];
            grouped[r.item_id].push(r);
          }
          if ((r as any).item_name) {
            const nameKey = (r as any).item_name;
            if (!grouped[nameKey]) grouped[nameKey] = [];
            if (!grouped[nameKey].some(item => item.id === r.id)) {
              grouped[nameKey].push(r);
            }
          }
        });
        setBeachReviews(grouped);
      } catch {
        const stored = JSON.parse(localStorage.getItem("roam_blon_reviews") || "[]") as BeachReview[];
        const destReviews = stored.filter(r => r.item_type === "destination");
        const grouped: Record<string, BeachReview[]> = {};
        destReviews.forEach((r) => {
          if (r.item_id) {
            if (!grouped[r.item_id]) grouped[r.item_id] = [];
            grouped[r.item_id].push(r);
          }
          if ((r as any).item_name) {
            const nameKey = (r as any).item_name;
            if (!grouped[nameKey]) grouped[nameKey] = [];
            if (!grouped[nameKey].some(item => item.id === r.id)) {
              grouped[nameKey].push(r);
            }
          }
        });
        setBeachReviews(grouped);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchBeachReviews();

    // Real-time: re-fetch on INSERT or UPDATE
    const channel = supabase
      .channel('destination-reviews-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: 'item_type=eq.destination' }, () => { fetchBeachReviews(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reviews', filter: 'item_type=eq.destination' }, () => { fetchBeachReviews(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getDestReviews = (d: any) => {
    const byId = beachReviews[d.id] || [];
    const byName = beachReviews[d.name] || [];
    const combined = [...byId];
    byName.forEach(r => {
      if (!combined.some(c => c.id === r.id)) combined.push(r);
    });
    return combined;
  };

  // Handle AI Chat visibility
  useEffect(() => {
    if (showAuth || view === "landing") {
      document.body.classList.add("hide-ai-chat");
    } else {
      document.body.classList.remove("hide-ai-chat");
    }
    return () => document.body.classList.remove("hide-ai-chat");
  }, [showAuth, view]);

  // Lock body scroll when the mobile hamburger menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileMenuOpen]);

  const handleAuthComplete = (touristData: any) => {
    setTourist(touristData);
    setShowAuth(false);
    if (touristData) {
      localStorage.setItem("roam_blon_active_role", touristData?.role || "tourist");
      // Admin/guide sessions are kept separate and must never appear as a tourist profile
      if (touristData?.role === 'admin' || touristData?.role === 'tour_guide') {
        localStorage.removeItem("roam_blon_tourist_user");
      } else {
        localStorage.setItem("roam_blon_tourist_user", JSON.stringify(touristData));
      }
    }

    if (touristData?.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (touristData?.role === 'tour_guide') {
      router.push('/guide/dashboard');
    } else {
      setView('welcome');
    }
  };

  const handleViewLocation = (dest: any) => {
    setSelectedLocation(dest);
    setShowDestinations(false);
    setShowMap(true);
  };

  const handleNavClick = (targetView: string) => {
    setMobileMenuOpen(false);
    if (targetView === "about") {
      setView("welcome");
      setTimeout(() => {
        const aboutSection = document.getElementById("about-section");
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      setView(targetView);
    }
  };

  const openProfile = () => {
    setMobileMenuOpen(false);
    if (!tourist) {
      setAuthInitialScreen('signin');
      setShowAuth(true);
    } else {
      handleNavClick("profile");
    }
  };

  const openLogin = () => {
    setMobileMenuOpen(false);
    setAuthInitialScreen('signin');
    setShowAuth(true);
  };

  return (
    <main className={`min-h-screen bg-[#F6F1ED] flex flex-col relative text-sm overflow-x-clip ${isOverlayOpen ? 'h-screen overflow-hidden' : ''}`}>

      {/* ───────────── QR CAMERA SCANNER OVERLAY ───────────── */}
      {showQRScanner && (
        <div className="fixed inset-0 z-[1100] bg-black flex flex-col" style={{ touchAction: "none" }}>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10">
            <button
              onClick={closeQRScanner}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X size={18} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-rose-600 rounded-md flex items-center justify-center">
                <QrCode size={12} className="text-white" />
              </div>
              <span className="font-black text-white text-sm uppercase tracking-widest">QR Scanner</span>
            </div>
            <button
              onClick={flipScanCamera}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              title="Flip camera"
            >
              <SwitchCamera size={18} className="text-white" />
            </button>
          </div>

          {/* Camera area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6">

            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.25em]">Point at a ROAM-BLON QR Code</p>

            {/* Viewport */}
            <div className="relative w-full max-w-sm">
              {/* html5-qrcode mounts here */}
              <div
                id="qr-scanner-viewport"
                className="w-full rounded-3xl overflow-hidden bg-slate-950 border-2 border-white/10 shadow-2xl"
                style={{ minHeight: 300 }}
              />

              {/* Animated scan frame — only while scanning */}
              {scanStatus === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  {/* Vignette */}
                  <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 68%)" }} />

                  {/* Scan box */}
                  <div className="relative w-56 h-56">
                    {/* Animated scan line */}
                    <div
                      className="absolute left-3 right-3 h-0.5 bg-rose-500 rounded-full shadow-[0_0_14px_rgba(225,29,72,0.9)]"
                      style={{ animation: "qrscanline 2s ease-in-out infinite" }}
                    />
                    {/* Corner brackets */}
                    {(["tl","tr","bl","br"] as const).map(c => (
                      <div key={c} className="absolute w-9 h-9" style={{
                        top: c[0]==="t" ? 0 : "auto", bottom: c[0]==="b" ? 0 : "auto",
                        left: c[1]==="l" ? 0 : "auto", right: c[1]==="r" ? 0 : "auto",
                        borderTop: c[0]==="t" ? "3px solid #e11d48" : "none",
                        borderBottom: c[0]==="b" ? "3px solid #e11d48" : "none",
                        borderLeft: c[1]==="l" ? "3px solid #e11d48" : "none",
                        borderRight: c[1]==="r" ? "3px solid #e11d48" : "none",
                        borderRadius: c==="tl"?"8px 0 0 0":c==="tr"?"0 8px 0 0":c==="bl"?"0 0 0 8px":"0 0 8px 0",
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {scanStatus === "success" && (
                <div className="absolute inset-0 bg-emerald-900/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-300">
                  <CheckCircle2 size={52} className="text-emerald-400" />
                  <p className="font-black text-white text-lg">QR Detected!</p>
                  <p className="text-emerald-300 text-sm font-bold">Redirecting…</p>
                </div>
              )}

              {/* Error overlay */}
              {scanStatus === "error" && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 px-6">
                  <div className="w-14 h-14 bg-rose-900/50 rounded-2xl flex items-center justify-center">
                    <AlertCircle size={32} className="text-rose-400" />
                  </div>
                  <p className="font-black text-white text-base text-center">Scanner Error</p>
                  <p className="text-white/60 text-xs font-medium text-center leading-relaxed">{scanError}</p>
                  <button
                    onClick={() => { setScanError(""); startScanner(scanFacing); }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black px-5 py-2.5 rounded-xl text-sm uppercase tracking-widest transition-all mt-1"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Idle / starting overlay */}
              {scanStatus === "idle" && (
                <div className="absolute inset-0 bg-slate-900/80 rounded-3xl flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="text-rose-400 animate-spin" />
                  <p className="text-white/60 text-sm font-bold">Starting camera…</p>
                </div>
              )}
            </div>

            {/* Hint */}
            {scanStatus === "scanning" && (
              <p className="text-white/40 text-xs font-bold text-center max-w-xs">
                Hold steady - auto-detects ROAM-BLON destination &amp; dining spot QR codes
              </p>
            )}
          </div>

          {/* Keyframes */}
          <style>{`
            @keyframes qrscanline {
              0%   { top: 12px; opacity:1; }
              50%  { top: calc(100% - 12px); opacity:1; }
              100% { top: 12px; opacity:1; }
            }
          `}</style>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-[999] overflow-y-auto overflow-x-hidden">
          <TouristAuthFlow
            onComplete={handleAuthComplete}
            onCancel={() => setShowAuth(false)}
            initialScreen={authInitialScreen}
            onOpenQRScanner={openQRScanner}
          />
        </div>
      )}

      {/* 3D MAP OVERLAY */}
      {showMap && (
        <div className="fixed inset-0 z-[600] bg-slate-900/90 backdrop-blur-md flex flex-col animate-in fade-in duration-500">
          <div className="absolute top-4 right-4 z-[610]">
            <Button
              onClick={() => {
                setShowMap(false);
                setSelectedLocation(null);
              }}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-full p-2 h-9 w-9 shadow-2xl border border-slate-200 transition-all"
            >
              <X size={18} />
            </Button>
          </div>


          <div className="flex-1 w-full h-full p-4 md:p-10 pt-20">
            <div className="w-full h-full max-w-5xl mx-auto">
              {selectedLocation ? (
                <LeafletRouteMap destination={selectedLocation} />
              ) : (
                <LeafletRouteMap allDestinations={destinations} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* BEACH & RESORT EXPLORER OVERLAY */}
      {showDestinations && (
        <div className="fixed inset-0 z-[550] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden text-base">
          <div className="p-5 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">Tourist Destinations</h3>
              <p className="text-rose-500 font-bold text-sm tracking-widest uppercase">Explore the Marble Capital's Top Destinations</p>
              <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">This Is a Capstone Project of 4th Year BSIT Student of RSU-Romblon Campus</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGuideBooking(true)}
                className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all shadow-sm"
                title="Booking Notifications"
              >
                <Bell size={18} />
              </button>
              <Button
                onClick={() => setShowDestinations(false)}
                className="rounded-full h-10 w-10 bg-slate-900 text-white hover:scale-110 transition-transform shadow-lg"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[#FAEEED]/20">
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
                  onClick={() => { setDestCategoryFilter(cat.id); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    destCategoryFilter === cat.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
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
                }).map((dest, index) => {
                const photos: string[] = dest.images || [dest.image];
                const currentPhotoIdx = cardPhotoIdx[dest.id] || 0;
                const goNextPhoto = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setCardPhotoIdx(prev => ({ ...prev, [dest.id]: (currentPhotoIdx + 1) % photos.length }));
                };
                const goPrevPhoto = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setCardPhotoIdx(prev => ({ ...prev, [dest.id]: (currentPhotoIdx - 1 + photos.length) % photos.length }));
                };
                return (
                <div key={index} className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-slate-100 group hover:shadow-md transition-all flex flex-col">
                  {/* Photo Carousel */}
                  <div className="h-52 overflow-hidden relative bg-slate-100">
                    {/* Classification & Tag Badges */}
                    <div className="flex items-center gap-1.5 absolute top-3 left-3 z-10">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md text-white ${
                        dest.classification === 'Hotel' ? 'bg-purple-600' :
                        dest.classification === 'Resort' ? 'bg-blue-600' :
                        dest.classification === 'Landmark' ? 'bg-amber-600' :
                        dest.classification === 'Falls' ? 'bg-cyan-600' :
                        'bg-rose-500'
                      }`}>
                        {dest.classification === 'Hotel' && <Building2 size={10} />}
                        {dest.classification === 'Resort' && <Hotel size={10} />}
                        {dest.classification === 'Landmark' && <Landmark size={10} />}
                        {dest.classification === 'Falls' && <Waves size={10} />}
                        {dest.classification === 'Beach' && <Trees size={10} />}
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
                    {/* Expand to gallery button */}
                    <button
                      onClick={() => { setActiveGallery(dest); setGalleryIdx(currentPhotoIdx); }}
                      className="absolute bottom-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-lg px-2 py-1 flex items-center gap-1 text-[10px] font-black backdrop-blur-sm transition-all"
                    >
                      <Images size={11} /> {photos.length} Photo{photos.length > 1 ? 's' : ''}
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
                              onClick={(e) => { e.stopPropagation(); setCardPhotoIdx(prev => ({ ...prev, [dest.id]: i })); }}
                              className={`rounded-full transition-all ${
                                i === currentPhotoIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
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
                        onClick={() => { setSelectedLocation(dest); setShowMap(true); }}
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
                        const avg = reviews.length
                          ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                          : null;
                        const fiveStarCount = reviews.filter(r => r.rating === 5).length;
                        return (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
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
                              {avg ? (
                                <span className="text-[11px] font-black text-slate-700">{avg}</span>
                              ) : null}
                              <span className="text-[10px] font-bold text-slate-400">
                                {reviews.length === 0
                                  ? "No reviews yet"
                                  : `${reviews.length} review${reviews.length > 1 ? "s" : ""}`}
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
                                <p className="text-[10px] text-slate-400 font-medium italic">
                                  Be the first to leave a review!
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {reviews.slice(0, 2).map((r, i) => (
                                    <div key={i} className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-black text-slate-700 truncate">{r.reviewer_name}</span>
                                        <div className="flex gap-0.5 ml-auto flex-shrink-0">
                                          {[1,2,3,4,5].map(s => (
                                            <Star key={s} size={8} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                                          ))}
                                        </div>
                                      </div>
                                      {r.comment && (
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">{r.comment}</p>
                                      )}
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
        </div>
      )}

      {/* ── FULLSCREEN PHOTO LIGHTBOX ── */}
      {activeGallery && (() => {
        const photos: string[] = activeGallery.images || [activeGallery.image];
        const total = photos.length;
        const goPrev = () => setGalleryIdx(i => (i - 1 + total) % total);
        const goNext = () => setGalleryIdx(i => (i + 1) % total);
        return (
          <div
            className="fixed inset-0 z-[800] bg-black/95 flex flex-col animate-in fade-in duration-300"
            onClick={() => setActiveGallery(null)}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 bg-black/60 backdrop-blur-md z-10 flex-shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">{activeGallery.barangay}</p>
                <h3 className="text-white font-black text-lg tracking-tight leading-tight">{activeGallery.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-black">{galleryIdx + 1} / {total}</span>
                <button
                  onClick={() => setActiveGallery(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center relative px-2" onClick={e => e.stopPropagation()}>
              <img
                src={photos[galleryIdx]}
                alt={`${activeGallery.name} - Photo ${galleryIdx + 1}`}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl select-none"
                style={{ maxHeight: 'calc(100vh - 220px)' }}
              />
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
              <div className="px-5 py-3 bg-black/60 backdrop-blur-md flex-shrink-0" onClick={e => e.stopPropagation()}>
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
                      <span key={i} className="text-[10px] font-black text-white/70 bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Strip */}
            {total > 1 && (
              <div className="flex gap-2 px-5 py-3 overflow-x-auto bg-black/80 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === galleryIdx ? 'border-rose-500 scale-105' : 'border-white/10 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={src} alt={`thumb ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* QR ITEM MODAL - DESTINATION */}
      {selectedQRItem && (
        <QRItemModal
          item={selectedQRItem}
          type="destination"
          tourist={tourist}
          onClose={() => setSelectedQRItem(null)}
        />      )}

      {/* TOUR GUIDE BOOKING NOTIFICATIONS OVERLAY (opened via the Bell beside the X) */}
      {showGuideBooking && (
        <div className="fixed inset-0 z-[900] bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) setShowGuideBooking(false); }}>
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

      {/* 1. THE HERO LANDING */}
      {view === "landing" && (
        <section className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-[#FAEEED] text-slate-800 pt-12 md:pt-20 text-center overflow-y-auto no-scrollbar relative">
          
          {/* Transparent Background Image */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none opacity-15 bg-cover bg-center bg-no-repeat fixed"
            style={{ backgroundImage: "url('/romblon.jpg')" }}
          ></div>

          {/* Subtle background floating circle */}
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-20 h-20 bg-white rounded-3xl mb-8 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/50 animate-bounce relative z-10 flex-shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-14 h-14 object-cover rounded-xl" />
          </div>

          <div className="max-w-xl w-full px-6 animate-in fade-in zoom-in duration-1000 relative z-10">
            <div className="text-rose-600 font-black text-xs md:text-sm tracking-[0.3em] uppercase mb-6 drop-shadow-sm">Welcome to the Marble Capital</div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-[#1a2236] leading-none">ROAM-BLON</h1>
            <div className="text-[11px] md:text-xs font-black text-slate-900 uppercase tracking-[0.25em] mb-3">Your AI Integrated Travel Buddy</div>
            <p className="text-[10px] md:text-[11px] font-black text-slate-400 tracking-wide mb-12 uppercase">This is a Capstone Project of 4th year BSIT Students of RSU - Romblon Campus</p>

            <div className="bg-[#fdf9f7]/90 backdrop-blur-md p-6 md:p-8 rounded-[3rem] border-2 border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] mb-12 text-slate-800 relative group overflow-hidden max-w-lg mx-auto">
              {/* Decorative icon */}
              <div className="text-3xl mb-4 flex flex-col items-center gap-3 transition-transform group-hover:scale-105 duration-500">
                <div className="text-lg font-black text-slate-900 tracking-tight">Discover Romblon Island <br />like never before.</div>
                <span className="text-2xl">🏛️</span>
              </div>

              <div className="w-10 h-0.5 bg-rose-500/20 mx-auto mb-6 rounded-full"></div>

              <p className="text-[13px] md:text-sm font-bold leading-relaxed text-slate-900 max-w-sm mx-auto">
                Roam-Blon is your AI Integrated Travel Buddy designed to elevate the tourism experience in Romblon, Philippines.
              </p>
            </div>
          </div>

          <div className="w-full max-w-xl px-6 mx-auto mb-12 z-10 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                if (tourist) {
                  setView('welcome');
                } else {
                  setAuthInitialScreen('signin');
                  setShowAuth(true);
                }
              }}
              className="w-full text-white bg-[#1a2236] hover:bg-[#e05a6b] font-black px-12 py-9 text-2xl shadow-[0_20px_40px_rgba(26,34,54,0.3)] transition-all duration-300 rounded-[2rem] flex items-center justify-center gap-4 border-none group active:scale-[0.98]"
            >
              Get Started <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </div>

            {/* ─── FEATURES SECTION ─── */}
            <div className="w-full max-w-[1800px] px-4 md:px-12 xl:px-24 mx-auto mb-12 mt-4 z-10">
              <div className="text-center mb-8">
                <div className="text-[10px] font-black tracking-[0.25em] text-sky-500 uppercase mb-3">Features</div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-3 tracking-tight">
                  Everything you need to travel smarter
                </h2>
                <p className="text-sm text-slate-900 font-medium max-w-md mx-auto leading-relaxed">
                  From AI itineraries to interactive maps — Roam-Blon handles the planning so you can enjoy every moment of your journey.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: "✨",
                    title: "AI Chatbot powered by Gemini 2.5",
                    desc: "Experience smart day-by-day trip generation tailored to your interests and budget. Disclaimer: AI responses may occasionally be inaccurate or outdated.",
                  },
                  {
                    icon: "🗺️",
                    title: "Interactive Maps",
                    desc: "Visualize your entire trip on a live map. See distances, routes, and nearby hidden gems at a glance.",
                  },
                  {
                    icon: "⚡",
                    title: "Smart Suggestions",
                    desc: "Discover local favourites, optimal routes, and money-saving tips powered by real traveller data.",
                  },
                  {
                    icon: "🌐",
                    title: "Share & Collaborate",
                    desc: "Share your trip with friends or travel companions. Everyone stays in sync with real-time updates.",
                  },
                  {
                    icon: "📷",
                    title: "QR-Powered Discovery",
                    desc: "Scan QR codes at any establishment for instant menus, reviews, real photos, and contact info.",
                  },
                  {
                    icon: "🍽️",
                    title: "Dining Spots & Guides",
                    desc: "Browse rated restaurants and book accredited tour guides — all verified by the local tourism office.",
                  },
                  {
                    icon: "🚨",
                    title: "Emergency Hub",
                    desc: "One-tap access to police, coast guard, medical, and tourism emergency contacts — anytime, anywhere.",
                  },
                  {
                    icon: "💬",
                    title: "Tourism Officer Chat",
                    desc: "Get real-time support and verified local information by chatting directly with a tourism officer.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-xl flex-shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-[12px] font-black text-slate-900 mb-1 leading-tight">{f.title}</div>
                      <div className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── MUNICIPAL TOURISM HIGHLIGHTS ─── */}
            <div className="w-full max-w-[1800px] px-4 md:px-12 xl:px-24 mx-auto mt-16 mb-4 z-10">
              <div className="text-center mb-10">
                <div className="text-[10px] font-black tracking-[0.25em] text-rose-500 uppercase mb-3">Municipal Tourism</div>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-3 tracking-tighter uppercase italic">
                  Romblon <span className="text-rose-600">Highlights</span>
                </h2>
                <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                  Three icons define the Marble Capital — a sacred festival, a legendary sandbar, and world-class marble artistry.
                </p>
                <div className="w-16 h-1 bg-rose-500 rounded-full mx-auto mt-5"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    img: "/biniray.webp",
                    badge: "🎭 Festival",
                    badgeColor: "bg-rose-600",
                    title: "Biniray Festival",
                    desc: "Romblon's grandest celebration, held every January in honor of the Sto. Niño. The name comes from the local word 'binira' (to turn). A colorful fluvial boat procession carries the Holy Child around the island's waters, followed by vibrant street dancing, live music, and a townwide feast that welcomes the new year.",
                    stat: "Every January",
                    statIcon: "📅",
                  },
                  {
                    img: "/beach%26resorts/bonbon.jpg",
                    badge: "🏖️ Beach",
                    badgeColor: "bg-sky-600",
                    title: "Bonbon Beach",
                    desc: "The crown jewel of Romblon — a world-famous powdery sandbar at Brgy. Lonos that emerges during low tide and stretches toward Bangug Island. Perfect for swimming, snorkeling, sunset watching, and unforgettable landscape photography.",
                    stat: "Low Tide Sandbar",
                    statIcon: "🌊",
                  },
                  {
                    img: "/products.avif",
                    badge: "🪨 Marble",
                    badgeColor: "bg-amber-600",
                    title: "Marble Products",
                    desc: "Romblon is hailed as the Marble Capital of the Philippines. Local artisans handcraft everything from elegant tableware, furniture, and statues to fine jewelry and keepsakes — using the island's famously fine-grained, colorful marble prized around the world.",
                    stat: "Marble Capital",
                    statIcon: "✨",
                  },
                ].map((h, idx) => (
                  <div
                    key={h.title}
                    className="group relative bg-white rounded-[1.75rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <img
                        src={h.img}
                        alt={h.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                      <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md ${h.badgeColor}`}>
                        {h.badge}
                      </span>
                      <span className="absolute bottom-4 left-4 right-4 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow">
                        {h.statIcon} {h.stat}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-3">{h.title}</h3>
                      <p className="text-[13px] text-slate-500 font-medium leading-relaxed flex-1">{h.desc}</p>
                      <div className="mt-5 pt-4 border-t border-dashed border-slate-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="text-base">{h.statIcon}</span>
                        <span className="text-rose-600">{h.stat}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW IT WORKS SECTION (COMPACT) */}
            <div className="w-full px-4 md:px-12 xl:px-24 mx-auto max-w-[1800px] animate-in slide-in-from-bottom duration-1000 delay-300 text-left mt-8 mb-4">
              <div className="mb-5 text-center">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter italic">How Roam-Blon Works</h2>
                <div className="w-8 h-1 bg-rose-500 rounded-full mx-auto mt-2"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { step: "01", title: "Role & Setup", desc: "Sign in or register as Tourist with fast 1-step setup.", icon: MapPin },
                  { step: "02", title: "Scan QR & Explore", desc: "Scan QR codes at local dining spots and destinations for instant menus, reviews, and location details.", icon: QrCode },
                  { step: "03", title: "Book Services", desc: "Reserve accredited tour guides and track bookings.", icon: CalendarCheck },
                  { step: "04", title: "AI & Emergency", desc: "Get 24/7 personalized travel advice from your AI Buddy and direct emergency responder contacts.", icon: Sparkles }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-[#FAEEED] shadow-sm relative group hover:shadow-md transition-all flex flex-col items-center text-center w-full min-h-[220px]">
                    <div className="absolute top-0 right-0 bg-[#FAEEED]/50 text-rose-600 font-black text-[10px] px-3 py-1.5 rounded-bl-[1rem] rounded-tr-[2rem] group-hover:bg-rose-600 group-hover:text-white transition-all z-10 hidden md:block">
                       STEP {item.step}
                    </div>
                    
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform flex-shrink-0">
                      <item.icon size={26} />
                    </div>
                    
                    <div className="flex flex-col w-full">
                      <h4 className="text-[16px] font-black text-slate-900 mb-2 uppercase tracking-tighter w-full">{item.title}</h4>
                      <p className="text-slate-500 text-[12px] font-medium leading-relaxed w-full whitespace-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>



          {/* Comprehensive Landing Footer */}
          <div className="mt-24 pb-12 w-full max-w-4xl mx-auto px-6 border-t border-slate-300/60 pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              {/* Contact Us Column */}
              <div className="flex flex-col items-center md:items-start">
                <div className="text-[11px] font-black text-[#1a2236] uppercase tracking-[0.25em] mb-6">Contact Us</div>
                <div className="flex flex-col gap-y-3">
                  <div className="flex items-center gap-3 group">
                    <MessageCircle size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-500 transition-colors hover:text-rose-600">support@roam-blon.com</span>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <MapPin size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-500 transition-colors hover:text-rose-600">Romblon, Philippines</span>
                  </div>
                </div>
              </div>

              {/* Social Column */}
              <div className="flex flex-col items-center md:items-end">
                <div className="text-[11px] font-black text-[#1a2236] uppercase tracking-[0.25em] mb-6">Follow Our Journey</div>
                <div className="flex gap-10">
                  {[
                    { icon: Instagram, href: "#", label: "Instagram" },
                    { icon: Facebook, href: "#", label: "Facebook" },
                    { icon: Twitter, href: "#", label: "Twitter" }
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      className="text-slate-400 hover:text-rose-600 transition-all group flex flex-col items-center gap-2"
                      aria-label={social.label}
                    >
                      <social.icon size={22} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{social.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-200 pt-10 flex flex-col items-center gap-4">
              <div className="flex gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <a href="#" className="hover:text-rose-600 transition-colors">Terms and Condition</a>
                <a href="#" className="hover:text-rose-600 transition-colors">Privacy Policy</a>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#1a2236] font-black tracking-[0.1em] uppercase">
                  @2026 Roam-Blon: An AI Integrated Travel Buddy
                </p>
              </div>
            </div>
          </div>
          {/* Floating QR scan icon — bottom right */}
          <button
            onClick={openQRScanner}
            title="Scan QR Code"
            className="fixed bottom-6 right-6 z-[120] w-12 h-12 bg-[#1a2236] hover:bg-[#e05a6b] text-white rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(26,34,54,0.35)] transition-all duration-300 hover:scale-110 active:scale-95 group"
          >
            <QrCode size={20} className="transition-transform duration-300 group-hover:rotate-6" />
          </button>
        </section>
      )}

      {/* 2. THE APP HEADER - RESPONSIVE WITH HAMBURGER MENU FOR MOBILE */}
      {view !== "landing" && (
        <header className="fixed top-0 left-0 right-0 z-[60] flex flex-col lg:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-white border-b-4 border-[#FAEEED] shadow-lg gap-3 md:gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView("welcome")}>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FAEEED] rounded-xl flex items-center justify-center border-2 border-rose-200 overflow-hidden shadow-inner">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl md:text-3xl text-slate-900 uppercase tracking-tighter leading-none">ROAM-BLON</span>
                <span className="text-[10px] md:text-xs font-bold text-rose-500 tracking-[0.2em] uppercase">AI Integrated Travel Buddy</span>
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 tracking-wide uppercase" style={{ maxWidth: 300 }}>This is a Capstone Project of 4th year BSIT Students of RSU - Romblon Campus</span>
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all"
              >
                {mobileMenuOpen ? <X size={24} className="text-slate-900" /> : <Menu size={24} className="text-slate-900" />}
              </button>
              <button
                onClick={openProfile}
                title={tourist ? "My Profile" : "Login"}
                className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm uppercase transition-all shadow-sm ${
                  view === 'profile' ? 'bg-rose-600 ring-2 ring-rose-200' : 'bg-slate-900 hover:bg-rose-600'
                }`}
              >
                <TouristAvatar tourist={tourist} />
              </button>
            </div>
          </div>

          {/* Desktop: Navigation + Profile on the right side */}
          <div className="hidden lg:flex items-center gap-2">
            <nav className="flex items-center gap-1 bg-slate-100/50 p-2 rounded-xl border-2 border-slate-200 whitespace-nowrap">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-black transition-all ${view === item.id ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                >
                  {item.label}
                </button>
              ))}
              <button onClick={() => handleNavClick("emergency")} className="px-3 py-2 rounded-lg text-sm font-black text-red-600 hover:bg-red-50 transition-all uppercase tracking-widest">EMERGENCY</button>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              {tourist ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Logout"
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-9 h-9"
                >
                  <LogOut size={18} />
                </Button>
              ) : (
                <button
                  onClick={openLogin}
                  className="px-4 py-2 rounded-lg text-sm font-black text-white bg-slate-900 hover:bg-rose-600 transition-all uppercase tracking-widest"
                >
                  Login
                </button>
              )}
            </nav>
            <button
              onClick={openProfile}
              title={tourist ? "My Profile" : "Login"}
              className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm uppercase transition-all shadow-sm ${
                view === 'profile' ? 'bg-rose-600 ring-2 ring-rose-200' : 'bg-slate-900 hover:bg-rose-600'
              }`}
            >
              <TouristAvatar tourist={tourist} />
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 top-20 md:top-28 z-50 bg-white animate-in slide-in-from-top duration-300 overflow-y-auto pb-8">
              <div className="flex flex-col p-6 gap-3">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full px-6 py-4 rounded-xl text-lg font-black transition-all text-left ${view === item.id ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => handleNavClick("emergency")}
                  className="w-full px-6 py-4 rounded-xl text-lg font-black text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-all text-left uppercase tracking-widest"
                >
                  EMERGENCY
                </button>
                <div className="border-t-2 border-slate-100 my-3"></div>
                <button
                  onClick={openProfile}
                  className={`w-full px-6 py-4 rounded-xl text-lg font-black transition-all text-left flex items-center gap-3 ${view === 'profile' ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100'}`}
                >
                  <span className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm uppercase ${view === 'profile' ? 'bg-rose-600' : 'bg-slate-900'}`}>
                    <TouristAvatar tourist={tourist} />
                  </span>
                  {tourist ? 'My Profile' : 'Login / Sign Up'}
                </button>
                {tourist && (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full px-6 py-4 rounded-xl text-lg font-black text-slate-500 bg-slate-50 border-2 border-slate-100 hover:bg-red-50 hover:text-red-600 transition-all text-left flex items-center gap-3"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* 3. DYNAMIC CONTENT AREA */}
      <div className="flex-1 pt-20 md:pt-28">
        {view === "welcome" && (
          <section className="max-w-7xl mx-auto py-6 px-6 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row gap-10 items-center mb-8 relative">
              <div className="flex-1 space-y-4">
                {/* System evaluation survey checklist */}
                <EvaluationForm />

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                  <Sparkles size={12} className="text-rose-500" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Experience More</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tighter">
                  ROMBLON IS <br /><span className="text-rose-600 relative">CALLING.</span>
                </h2>
                <p className="leading-relaxed text-slate-600 font-medium text-base max-w-lg">
                  Explore the "Marble Capital of the Philippines" like a local. From the surreal sandbars of Bonbon to the heritage-rich streets.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowMap(true)} className="flex items-center gap-2 text-[13px] font-black bg-slate-900 text-white px-5 py-3 rounded-lg hover:bg-slate-800 transition-all">
                    <Compass size={18} /> OPEN MAP
                  </button>
                  <button onClick={() => setShowDestinations(true)} className="flex items-center gap-2 text-[13px] font-black border-2 border-rose-100 text-rose-600 px-5 py-3 rounded-lg hover:bg-rose-50 transition-all">
                    <Star size={18} /> TOURIST DESTINATIONS
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full relative">
                <div className="relative rounded-[2rem] h-[250px] md:h-[350px] overflow-hidden border-[6px] border-white shadow-lg">
                  <img src="/romblon.jpg" className="w-full h-full object-cover" alt="Romblon" />
                </div>
              </div>
            </div>

            <div id="about-section" className="bg-white px-5 py-6 md:px-8 md:py-8 rounded-[2rem] border-2 border-[#FAEEED] shadow-sm mb-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 text-center tracking-tighter uppercase italic mb-6">About Roam-Blon Project</h2>

              <div className="mb-8 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100 mb-3">
                  <Sparkles size={12} className="text-rose-500" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Our Story</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-bold text-base max-w-3xl">
                  Roam-Blon is Your AI Integrated Travel Buddy designed to elevate the tourism experience in Romblon, Philippines.
                </p>
                <p className="text-slate-500 leading-relaxed font-bold text-sm mt-2 max-w-3xl">
                  By combining hyper-local insights with intelligent agentic assistance, we help travelers discover pristine beaches, savor authentic dining spots, and navigate the marble capital with ease and safety.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                      <Target size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Our Mission</h3>
                  </div>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    To empower travelers with intelligent, local insights to discover the authentic beauty of Romblon through seamless AI integration and sustainable tourism practices.
                  </p>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                      <Eye size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Our Vision</h3>
                  </div>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    To transform Romblon into a world-class smart-tourism destination where technology and island tradition coexist harmoniously, fostering a thriving local digital economy.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                { id: 'dining', icon: Utensils, label: 'Dining Spots', bgColor: 'bg-rose-50', iconColor: 'text-rose-500', desc: 'Savor local delicacies.' },
                { id: 'destinations', icon: MapPin, label: 'Destinations', bgColor: 'bg-sky-50', iconColor: 'text-sky-500', desc: 'Explore beaches, resorts & falls.' },
                { id: 'guide', icon: Compass, label: 'Book a Guide', bgColor: 'bg-orange-50', iconColor: 'text-orange-500', desc: 'Tour with a verified local expert.' },
                { id: 'emergency', icon: ShieldAlert, label: 'Emergency', bgColor: 'bg-red-50', iconColor: 'text-red-500', desc: 'One-tap help, 24/7 responders.' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'destinations' || item.id === 'guide') {
                      setShowDestinations(true);
                    } else {
                      setView(item.id);
                    }
                  }}
                  className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div className={`${item.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className={item.iconColor} size={20} />
                  </div>
                  <h4 className="font-black text-base text-slate-900 mb-1">{item.label}</h4>
                  <p className="text-slate-500 text-[12px] font-medium leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {view === "dining" && <section className="py-8 px-6 max-w-7xl mx-auto"><DiningList onLocate={handleViewLocation} /></section>}
        {view === "profile" && tourist && <TouristProfile tourist={tourist} onUpdate={setTourist} />}
        {view === "profile" && !tourist && (
          <section className="max-w-3xl mx-auto py-20 px-6 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 mb-2">Please Log In</h3>
            <p className="text-slate-500 font-bold mb-8">Sign in to view and manage your tourist profile.</p>
            <button
              onClick={openLogin}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[12px] px-8 py-4 rounded-2xl transition-all shadow-lg"
            >
              Login / Sign Up
            </button>
          </section>
        )}
        {view === "emergency" && (
          <section className="py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HERO */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-600 via-rose-600 to-red-700 p-8 md:p-12 text-center shadow-2xl shadow-red-200">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/25 mb-5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.25em]">
                      24/7 Responders On Standby
                    </span>
                  </div>
                  <div className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-xl mb-5">
                    <ShieldAlert size={40} className="text-red-600" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-3 uppercase italic tracking-tighter">
                    Emergency Hub
                  </h2>
                  <p className="text-red-100 font-bold text-sm md:text-base max-w-md mx-auto leading-relaxed">
                    Verified local responders at your fingertips. One tap dials the right number — stay calm, we've got you covered.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <EmergencyHotlines />
            </div>

            {/* SAFETY TIPS */}
            <div className="max-w-3xl mx-auto mt-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-[1px] flex-1 bg-slate-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Safety Tips
                </span>
                <div className="h-[1px] flex-1 bg-slate-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Phone, title: "Save These Numbers", desc: "Add the hotlines to your phone now so you can reach help instantly, even offline." },
                  { icon: MapPin, title: "Share Your Location", desc: "Always tell someone where you are going. Share your live route from the maps section." },
                  { icon: ShieldAlert, title: "Stay With Your Group", desc: "When exploring remote beaches or trails, never wander alone — especially after dark." },
                  { icon: CloudLightning, title: "Weather Aware", desc: "Check PAG-ASA updates before island hopping. Avoid the sea when a weather advisory is up." },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                      <tip.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{tip.title}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-1 leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>



      {(!showAuth && view !== "landing") && (
        <footer className="py-12 bg-slate-900 text-white mt-auto border-t-8 border-rose-600">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 overflow-hidden">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">ROAM-BLON</h3>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">AI Travel Buddy</p>
              </div>
            </div>

            <div className="flex gap-6">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Twitter, href: "#", label: "Twitter" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-600 transition-all group"
                  aria-label={social.label}
                >
                  <social.icon size={18} className="text-white group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>

            <div className="w-full h-px bg-white/10 max-w-2xl"></div>

            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">@2026 Roam-Blon: An AI Integrated Travel Buddy</p>
            </div>
          </div>
        </footer>
      )}
      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full relative z-10 shadow-2xl border-t-8 border-rose-500 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500">
                <LogOut size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-tight">Ready to leave?</h3>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest leading-relaxed px-4">Are you sure you want to log out from <span className="text-rose-500 uppercase">Roam-Blon</span>?</p>
              </div>
              <div className="flex flex-col w-full gap-3">
                <Button
                  onClick={handleLogout}
                  className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black italic uppercase py-6 rounded-2xl transition-all shadow-xl shadow-slate-200"
                >
                  Yes, Log Me Out
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
                >
                  Stay on the island
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}