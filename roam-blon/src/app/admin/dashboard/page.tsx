"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Building,
  ClipboardList,
  Settings,
  TrendingUp,
  BellDot,
  Rocket,
  CalendarClock,
  ChevronRight,
  AlertCircle,
  LogOut,
  X,
  Menu,
  PlusCircle,
  Clock,
  Phone,
  FileText,
  MessageSquare,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Package,
  Sparkles,
  Headset,
  QrCode,
  Star,
  Trophy,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";
import UnifiedAuthFlow from "@/components/TouristAuthFlow";
import QRItemModal from "@/components/QRItemModal";
import { QRCodeSVG } from "qrcode.react";

// --- TYPES ---
interface Tourist {
  email: string;
  firstName: string;
  lastName: string;
  age: string;
  nationality: string;
  role?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // State management
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTourist, setCurrentTourist] = useState<Tourist | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTourists: 0,
    destinations: 0,
    diningSpots: 0,
    avgRating: 4.8
  });
  const [totalScans, setTotalScans] = useState(0);  const [touristStats, setTouristStats] = useState<{
    newThisWeek: number;
    topNationalities: { nationality: string; count: number }[];
  }>({
    newThisWeek: 0,
    topNationalities: []
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Tab-specific data
  const [tourists, setTourists] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<{dining: any[], souvenirs: any[], emergency: any[], tourGuides: any[]}>({
    dining: [], souvenirs: [], emergency: [], tourGuides: []
  });
  const [guideBookings, setGuideBookings] = useState<any[]>([]);
  const [guideReviews, setGuideReviews] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  // Chat/Messages states
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeChatRoom, setActiveChatRoom] = useState<any | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<any[]>([]);
  const [unreadRooms, setUnreadRooms] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState("");
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<string>("all");

  // Real-time notification state
  const [liveToasts, setLiveToasts] = useState<{id: string; reviewer: string; item: string; rating: number; comment: string; type: 'review' | 'guide_review' | 'scan' | 'booking'}[]>([]);
  const [newReviewCount, setNewReviewCount] = useState(0);
  const [liveScanCount, setLiveScanCount] = useState(0);
  const [scanVisits, setScanVisits] = useState<Record<string, number>>({});
  const [scanTypes, setScanTypes] = useState<Record<string, string>>({});
  const [reviewTabPulse, setReviewTabPulse] = useState(false);

  // True while the one-time seed is inserting rows, so realtime scan events from
  // the seed's own inserts don't double-inflate the totals.
  const suppressScanBump = useRef(false);

  const addLiveToast = (toast: {reviewer: string; item: string; rating: number; comment: string; type: 'review' | 'guide_review' | 'scan' | 'booking'}) => {
    const id = Date.now().toString();
    setLiveToasts(prev => [{ id, ...toast }, ...prev].slice(0, 5));
    setTimeout(() => {
      setLiveToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  const dismissToast = (id: string) => setLiveToasts(prev => prev.filter(t => t.id !== id));

  const recordScanVisit = (name: string, itemType?: string) => {
    if (!name) return;
    setScanVisits(prev => {
      const key = Object.keys(prev).find(k => k.toLowerCase() === name.toLowerCase()) || name;
      const next = { ...prev, [key]: (prev[key] || 0) + 1 };
      try { localStorage.setItem('roam_blon_scan_visits', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (itemType) setScanTypes(prev => ({ ...prev, [name]: itemType }));
  };

  // Modal & Editing states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: string; id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrItem, setQrItem] = useState<any>(null);

  const openAddModal = (modalType: string) => {
    setEditingItem(null);
    setActiveModal(modalType);
  };

  const handleEditResource = (type: string, item: any) => {
    setEditingItem({ type, id: item.id });
    if (type === 'destination') {
      setDestinationForm({
        name: item.name || '',
        description: item.description || '',
        location: item.location || '',
        category: item.category || 'Beaches',
        image_url: item.image_url || '',
        contact: item.contact || '',
        howToGetThere: item.howToGetThere || ''
      } as any);
      setActiveModal('destination');
    } else if (type === 'dining') {
      setDiningForm({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Local Eat',
        address: item.address || item.location || '',
        image_url: item.image_url || '',
        opening_time: item.opening_time || '08:00 AM',
        closing_time: item.closing_time || '10:00 PM'
      });
      setActiveModal('dining');
    } else if (type === 'emergency') {
      setEmergencyForm({
        label: item.label || item.name || '',
        phone: item.phone || item.contact || '',
        icon_key: item.icon_key || 'ShieldAlert',
        color_key: item.color_key || 'rose'
      });
      setActiveModal('emergency');
    }
  };

  // Form states
  const [destinationForm, setDestinationForm] = useState({ name: "", description: "", location: "", category: "Beaches", image_url: "" });
  const [diningForm, setDiningForm] = useState({ name: "", description: "", category: "Local Eat", address: "", image_url: "", opening_time: "08:00 AM", closing_time: "10:00 PM" });
  const [souvenirForm, setSouvenirForm] = useState({ name: "", category: "SOUVENIR", price: "", image_url: "" });
  const [emergencyForm, setEmergencyForm] = useState({ label: "", phone: "", icon_key: "ShieldAlert", color_key: "rose" });

  // Top items computation
  const getTopItems = (type: string) => {
    const itemStats: Record<string, { name: string, type: string, count: number, totalRating: number }> = {};
    
    reviews.forEach(r => {
      if (r.item_type === type) {
        if (!itemStats[r.item_name]) {
          itemStats[r.item_name] = { name: r.item_name, type: r.item_type, count: 0, totalRating: 0 };
        }
        itemStats[r.item_name].count += 1;
        itemStats[r.item_name].totalRating += (r.rating || 0);
      }
    });

    return Object.values(itemStats)
      .map(item => ({
        ...item,
        avgRating: Number((item.totalRating / item.count).toFixed(1))
      }))
      .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
      .slice(0, 5);
  };

  const topDestinations = getTopItems('destination');
  const topDining = getTopItems('dining');
  // Top tour guides — computed from guide reviews (guide_reviews table/localStorage),
  // not the QR reviews table (which never stores guide-type reviews).
  const topGuides = (() => {
    const itemStats: Record<string, { name: string, count: number, totalRating: number }> = {};
    guideReviews.forEach((r: any) => {
      const name = r.guide_name || r.item_name || "Tour Guide";
      if (!itemStats[name]) itemStats[name] = { name, count: 0, totalRating: 0 };
      itemStats[name].count += 1;
      itemStats[name].totalRating += (r.rating || 0);
    });
    return Object.values(itemStats)
      .map(item => ({ ...item, type: 'guide', avgRating: Number((item.totalRating / item.count).toFixed(1)) }))
      .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
      .slice(0, 5);
  })();

  // Most-visited analytics (ranked by visit/review count)
  const getMostVisited = (type: string, byCount = false) => {
    const itemStats: Record<string, { name: string, type: string, count: number, totalRating: number }> = {};
    reviews.forEach(r => {
      if (r.item_type === type) {
        if (!itemStats[r.item_name]) {
          itemStats[r.item_name] = { name: r.item_name, type: r.item_type, count: 0, totalRating: 0 };
        }
        itemStats[r.item_name].count += 1;
        itemStats[r.item_name].totalRating += (r.rating || 0);
      }
    });
    return Object.values(itemStats)
      .map(item => ({ ...item, avgRating: Number((item.totalRating / item.count).toFixed(1)) }))
      .sort((a, b) => byCount ? (b.count - a.count || b.avgRating - a.avgRating) : (b.avgRating - a.avgRating || b.count - a.count))
      .slice(0, 5);
  };

  const mostVisitedDestinations = getMostVisited('destination');
  const mostVisitedDining = getMostVisited('dining');

  // Visit-based rankings for the Logs tab (most scanned/visited places)
  const scannedDestinations = getMostVisited('destination', true);
  const scannedDining = getMostVisited('dining', true);

  // All-destinations series for the analytics graph — every destination on the X-axis,
  // counting live QR scan reviews, sorted by most visited. Dining spot scans are
  // excluded using the scan's own item_type (authoritative), with a name fallback.
  const allDestinationsSeries = (() => {
    // Dining spot names must never appear on the destination panel. Match flexibly
    // (short-form scan names like "Panublion" must match "Panublion Heritage Diner").
    const DINING_NAMES = [
      "Marble City Café & Bistro", "El Krimphoff Resort", "Horizon Seaside Restaurant",
      "Italian Trattoria", "Mama Lois Kitchen", "Seaview Restobar",
      "Panublion Heritage Diner", "Reggae Bar & Grill", "Sunbird Cafe & Lounge",
      "Yurich Food House", "Gangnam Korean Grill", "El Hotel & Restaurant"
    ].map(n => n.toLowerCase());
    const isDiningName = (n: string) => {
      const lower = n.toLowerCase();
      return DINING_NAMES.some(d =>
        lower === d ||
        (lower.length >= 4 && (lower.includes(d) || d.includes(lower)))
      );
    };
    const isDiningScan = (n: string) => {
      const t = scanTypes[n] || scanTypes[Object.keys(scanTypes).find(k => k.toLowerCase() === n.toLowerCase()) || ''];
      if (t === 'dining') return true;
      if (t === 'destination') return false;
      return isDiningName(n);
    };
    // Start from every registered destination (X-axis includes all of them)
    const names = destinations.map((d: any) => d.name).filter((n: any) => n && !isDiningScan(n));
    // Also include destinations that were scanned but aren't in the list yet
    Object.keys(scanVisits).forEach(n => {
      if (!names.some((x: string) => x.toLowerCase() === n.toLowerCase()) && !isDiningScan(n)) names.push(n);
    });
    return names.map(name => {
      const scanKey = Object.keys(scanVisits).find(k => k.toLowerCase() === name.toLowerCase());
      const scanCount = scanKey ? scanVisits[scanKey] : 0;
      return { name, count: scanCount, avgRating: 0 };
    }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  })();

  // All-dining series for the analytics graph — every registered dining spot on the
  // X-axis (including Gangnam Korean Grill & El Hotel & Restaurant), counting live
  // QR scan reviews, sorted by most visited.
  const allDiningSeries = (() => {
    // Start from every registered dining spot (X-axis includes all of them)
    const STATIC_DINING = [
      "Marble City Café & Bistro", "El Krimphoff Resort", "Horizon Seaside Restaurant",
      "Italian Trattoria", "Mama Lois Kitchen", "Seaview Restobar",
      "Panublion Heritage Diner", "Reggae Bar & Grill", "Sunbird Cafe & Lounge",
      "Yurich Food House"
    ];
    const names = allServices.dining.length > 0
      ? allServices.dining.map((d: any) => d.name).filter((n: any) => n)
      : STATIC_DINING;
    // Force-include Gangnam Korean Grill if a dining list is present without it
    if (!names.some((x: string) => x.toLowerCase() === "gangnam korean grill")) names.unshift("Gangnam Korean Grill");
    // Fold scanned names into the known-dining set so dining scans count on this panel
    const known = new Set(names.map((n: string) => n.toLowerCase()));
    const scannedDiningNames = Object.keys(scanVisits).filter(n => {
      const t = scanTypes[n] || scanTypes[Object.keys(scanTypes).find(k => k.toLowerCase() === n.toLowerCase()) || ''];
      if (t === 'dining') return true;
      if (t === 'destination') return false;
      return known.has(n.toLowerCase()) ||
        /restaur|grill|bistro|caf|diner|lois|trattoria|bar &|food house|seafood|lounge|kitchen/i.test(n);
    });
    scannedDiningNames.forEach(n => {
      if (!known.has(n.toLowerCase())) names.push(n);
    });
    return names.map(name => {
      const scanKey = Object.keys(scanVisits).find(k => k.toLowerCase() === name.toLowerCase());
      const scanCount = scanKey ? scanVisits[scanKey] : 0;
      return { name, count: scanCount, avgRating: 0 };
    }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  })();

  // Toggle guide availability in admin dashboard
  const toggleGuideAvailability = async (guideId: string, currentAvailable?: boolean) => {
    const newStatus = !(currentAvailable !== false);
    try {
      await supabase.from('tour_guides').update({ is_available: newStatus }).eq('id', guideId);
    } catch (err) {
      console.warn("Could not update guide availability in DB, fallback to state update", err);
    }
    setAllServices(prev => ({
      ...prev,
      tourGuides: prev.tourGuides.map(g => g.id === guideId ? { ...g, is_available: newStatus } : g)
    }));
  };

  // Status update for tour guide bookings
  const handleGuideBookingStatus = async (bookingId: string, newStatus: string) => {
    let updatedBooking: any = null;
    try {
      const { data } = await supabase.from('tour_guide_bookings').update({ status: newStatus }).eq('id', bookingId).select();
      if (data && data[0]) updatedBooking = data[0];
    } catch (err) {
      console.warn("Status update fallback", err);
    }
    setGuideBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    
    // Update local storage
    const stored = JSON.parse(localStorage.getItem('roam_blon_tour_guide_bookings') || '[]');
    const updated = stored.map((b: any) => b.id === bookingId ? { ...b, status: newStatus } : b);
    localStorage.setItem('roam_blon_tour_guide_bookings', JSON.stringify(updated));

    // Find the full booking from state for the broadcast payload
    const full = updatedBooking || stored.find((b: any) => b.id === bookingId) || guideBookings.find((b: any) => b.id === bookingId);
    if (full) {
      try {
        const chan = supabase.channel('admin-live-feed');
        await chan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chan.send({
              type: 'broadcast',
              event: 'booking_status',
              payload: { ...full, status: newStatus },
            });
            supabase.removeChannel(chan);
          }
        });
      } catch { /* ignore */ }
    }
  };

  // Fetch initial data & recent activity
  const fetchDashboardData = async () => {
    try {
      // 1. Stats
      const { data: tCountData } = await supabase.from('tourists').select('id');
      const tCount = tCountData?.length || 0;
      
      const { data: dCountData } = await supabase.from('destinations').select('id');
      const dCount = dCountData?.length || 0;

      const { data: diningCountData } = await supabase.from('dining_hubs').select('id');
      const diningCount = diningCountData?.length || 0;

      const { data: scanCountData } = await supabase.from('qr_scans').select('id, nationality, visitor_type, item_name, item_type');
      const scanDbCount = scanCountData?.length || 0;

      // Rebuild graph visit counters directly from the qr_scans rows so the charts
      // always equal the total scan count (each scan = 1 visit).
      const visitsFromDb: Record<string, number> = {};
      const typesFromDb: Record<string, string> = {};
      (scanCountData || []).forEach((s: any) => {
        if (!s.item_name) return;
        const key = Object.keys(visitsFromDb).find(k => k.toLowerCase() === s.item_name.toLowerCase()) || s.item_name;
        visitsFromDb[key] = (visitsFromDb[key] || 0) + 1;
        if (s.item_type) typesFromDb[key] = s.item_type;
      });
      setScanVisits(visitsFromDb);
      setScanTypes(typesFromDb);

      // Merge tourists table with localStorage (catches any offline/broadcast-only signups)
      const localTourists = JSON.parse(localStorage.getItem('roam_blon_tourists') || '[]');
      const combinedTouristCount = tCount + localTourists.filter((lt: any) =>
        !(tCountData || []).some((td: any) => td.id === lt.id || (lt.email && td.email === lt.email))
      ).length;

      // Visitor logs = QR scans only (new account signups do NOT count as logs)
      const scanCount = scanDbCount;
      setTotalScans(scanCount);

      setStats(prev => ({ ...prev, totalTourists: combinedTouristCount, destinations: dCount, diningSpots: diningCount }));

      // 2. Tab Data
      const [ {data: tData}, {data: destData}, {data: dining}, {data: souvenirs}, {data: hotlines}, {data: tourGuides}, {data: gBookingsData}, {data: evalData} ] = await Promise.all([
        supabase.from('tourists').select('*').order('id', { ascending: false }),
        supabase.from('destinations').select('*').order('name'),
        supabase.from('dining_hubs').select('*').order('name'),
        supabase.from('souvenirs').select('*').order('name'),
        supabase.from('emergency_hotlines').select('*').order('label'),
        supabase.from('tour_guides').select('*').order('id', { ascending: false }),
        supabase.from('tour_guide_bookings').select('*').order('id', { ascending: false }),
        supabase.from('evaluations').select('*').order('id', { ascending: false })
      ]);
      if (evalData) setEvaluations(evalData);

      const combinedTourists = [...(tData || [])];
      localTourists.forEach((lt: any) => {
        if (!combinedTourists.some((ct: any) => ct.id === lt.id || (lt.email && ct.email === lt.email))) {
          combinedTourists.unshift(lt);
        }
      });
      setTourists(combinedTourists);

      // Compute new tourists this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newThisWeek = combinedTourists.filter(
        t => t.created_at && new Date(t.created_at) >= oneWeekAgo
      ).length;

      // Compute top nationalities from QR scan visitors only
      const natMap: Record<string, number> = {};
      // Merge in every scan's recorded nationality so scanned Local/Foreign visitors count too
      let scanNatData: any[] = [];
      try {
        const { data: sNat } = await supabase.from('qr_scans').select('nationality');
        scanNatData = sNat || [];
      } catch { /* ignore if table absent */ }
      scanNatData.forEach(s => {
        if (s && s.nationality) {
          const n = s.nationality.toLowerCase() === 'local' ? 'Local' : 'Foreign';
          natMap[n] = (natMap[n] || 0) + 1;
        }
      });
      const topNationalities = Object.entries(natMap)
        .map(([nationality, count]) => ({ nationality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTouristStats({ newThisWeek, topNationalities });
      setDestinations(destData || []);

      // Merge Supabase tour_guide_bookings with localStorage
      const localGuideBookings = JSON.parse(localStorage.getItem('roam_blon_tour_guide_bookings') || '[]');
      const combinedGuideBookings = [...(gBookingsData || [])];
      localGuideBookings.forEach((lb: any) => {
        if (!combinedGuideBookings.some(cb => cb.id === lb.id || (cb.guide_name === lb.guide_name && cb.booking_date === lb.booking_date && cb.tourist_email === lb.tourist_email))) {
          combinedGuideBookings.push(lb);
        }
      });
      setGuideBookings(combinedGuideBookings);

      setAllServices({ 
        dining: dining || [], 
        souvenirs: souvenirs || [], 
        emergency: hotlines || [], 
        tourGuides: (tourGuides || []).map((g: any) => ({
          ...g,
          is_available: g.is_available !== undefined ? g.is_available : true
        })) 
      });

      // 3. Recent Activity
      const activities: any[] = [];
      tData?.slice(0, 5).forEach(t => activities.push({ type: 'registration', name: `${t.first_name} ${t.last_name}`, action: `Registered from ${t.nationality}`, time: 'Recently' }));
      combinedGuideBookings.slice(0, 5).forEach(gb => activities.push({ type: 'booking', name: gb.tourist_name || gb.tourist_email, action: `Booked Tour Guide: ${gb.guide_name}`, time: 'Recently' }));
      setRecentActivities(activities.sort((a,b) => 0.5 - Math.random()).slice(0, 8));

      // 4. Fetch Chat Rooms (Filter out AI conversations)
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .not('tourist_email', 'ilike', '%_ai')
        .order('updated_at', { ascending: false });
      setChatRooms(rooms || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    loadReviews();
    loadGuideReviews();
  }, []);

  const loadGuideReviews = async () => {
    try {
      let remote: any[] = [];
      try {
        const res = await fetch('/api/guide-reviews');
        if (res.ok) {
          const json = await res.json();
          if (json.data) remote = json.data;
        }
      } catch {
        const { data } = await supabase.from('guide_reviews').select('*').order('created_at', { ascending: false });
        if (data) remote = data;
      }

      const stored = JSON.parse(localStorage.getItem('roam_blon_guide_reviews') || '[]');
      const combined = [...remote];
      stored.forEach((lr: any) => {
        if (!combined.some(c => c.id === lr.id || (c.booking_id && lr.booking_id && c.booking_id === lr.booking_id && c.tourist_email === lr.tourist_email))) {
          combined.push(lr);
        }
      });
      setGuideReviews(combined);
    } catch { /* ignore */ }
  };

  const loadReviews = async () => {
    try {
      let remote: any[] = [];

      // Primary: fetch via API route (server-side, bypasses RLS)
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const json = await res.json();
          if (json.data) remote = json.data;
        }
      } catch {
        // Fallback: direct Supabase query
        const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (data) remote = data;
      }

      // Merge with localStorage (catches any offline/broadcast-only reviews)
      const stored = JSON.parse(localStorage.getItem('roam_blon_reviews') || '[]');
      const combined = [...remote];
      stored.forEach((lr: any) => {
        if (!combined.some(c => c.id === lr.id || (c.reviewer_name === lr.reviewer_name && c.comment === lr.comment && c.item_name === lr.item_name))) {
          combined.push(lr);
        }
      });
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviews(combined);
    } catch {
      const stored = JSON.parse(localStorage.getItem('roam_blon_reviews') || '[]');
      setReviews(stored);
    }
  };


  const clearAllReviews = async () => {
    if (!confirm('Clear ALL reviews (set to 0) so you can add new ratings?')) return;
    try {
      // Clear localStorage cache
      localStorage.removeItem('roam_blon_reviews');

      // Attempt to clear any DB reviews via API (one by one)
      const dbReviews = reviews.filter(r => r.id && !String(r.id).startsWith('local_'));
      for (const r of dbReviews) {
        try {
          await fetch(`/api/reviews?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
        } catch { /* ignore */ }
      }

      setReviews([]);
      alert('All reviews have been cleared! You can now add new ratings.');
    } catch (err: any) {
      alert(`Error clearing reviews: ${err.message}`);
    }
  };

  const deleteReview = async (r: any) => {
    if (!confirm(`Remove review by ${r.reviewer_name || 'Anonymous'} for "${r.item_name}"?`)) return;
    try {
      // 1. Remove from localStorage cache (handles offline/broadcast-only reviews)
      const stored = JSON.parse(localStorage.getItem('roam_blon_reviews') || '[]');
      const filtered = stored.filter((lr: any) =>
        lr.id !== r.id &&
        !(lr.reviewer_name === r.reviewer_name && lr.comment === r.comment && lr.item_name === r.item_name)
      );
      localStorage.setItem('roam_blon_reviews', JSON.stringify(filtered));

      // 2. Remove from Supabase via API route if it's a DB review
      if (r.id && !String(r.id).startsWith('local_')) {
        try {
          await fetch(`/api/reviews?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
        } catch { /* ignore */ }
      }

      setReviews(prev => prev.filter((x: any) =>
        x.id !== r.id &&
        !(x.reviewer_name === r.reviewer_name && x.comment === r.comment && x.item_name === r.item_name)
      ));
      alert(`${r.reviewer_name || 'Anonymous'}'s review has been removed!`);
    } catch (err: any) {
      alert(`Error removing review: ${err.message}`);
    }
  };

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Only the single official admin account is allowed
        if ((user.email || "").toLowerCase() !== "admin@roam-blon.com") {
          setLoading(false);
          setUnauthorized(true);
          return;
        }
        // Fetch Admin profile
        const { data: admin } = await supabase
          .from('admins')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (admin) {
          // Check for verification status in session storage
          const isVerified = sessionStorage.getItem(`verified_${user.email}`) === 'true';
          
          setCurrentTourist({
            email: admin.email,
            firstName: admin.first_name,
            lastName: admin.last_name,
            age: "—", 
            nationality: "Local/Verified",
            role: "admin"
          });
          await fetchDashboardData();
        } else {
          // Logged in but not an admin -> route to admin login
          router.push('/login?role=admin');
          return;
        }
      } else {
        // Not logged in at all -> route to admin login
        router.push('/login?role=admin');
        return;
      }
      setLoading(false);
    }
    checkUser();
  }, [router]);

  // Real-time Chat subscriptions
  useEffect(() => {
    // 1. Listen for new chat rooms and global messages
    const roomChannel = supabase
      .channel('admin-chat-monitoring')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_rooms' }, (payload) => {
        const newRoom = payload.new as any;
        // Only add if it's NOT an AI room
        if (newRoom.tourist_email && !newRoom.tourist_email.endsWith('_ai')) {
          setChatRooms(prev => [newRoom, ...prev]);
          setUnreadRooms(prev => new Set(prev).add(newRoom.id));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_rooms' }, (payload) => {
        const updated = payload.new as any;
        setChatRooms(prev => 
          prev.map(r => r.id === updated.id ? updated : r)
          .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const msg = payload.new as any;
        
        setChatRooms(prev => {
          const roomExists = prev.some(r => r.id === msg.room_id);
          
          if (roomExists) {
            // Update existing room preview
            return prev.map(r => 
              r.id === msg.room_id ? { ...r, latest_message: msg.content, updated_at: msg.created_at } : r
            ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          } else {
            // Room doesn't exist in local state (maybe it was just created), trigger a refresh of rooms
            fetchDashboardData();
            return prev;
          }
        });

        if (msg.sender_role === 'tourist') {
          setUnreadRooms(prev => new Set(prev).add(msg.room_id));
        }
      })
      .subscribe();

    // --- Polling fallback: check for new messages every 4 seconds ---
    let lastKnownMessageIds: Record<string, string> = {};

    const pollInterval = setInterval(async () => {
      // Fetch officer/support chat rooms (not AI)
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .not('tourist_email', 'ilike', '%_ai')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (rooms && rooms.length > 0) {
        setChatRooms(rooms);

        // For each room, check latest message to detect new tourist messages
        for (const room of rooms) {
          const { data: latestMsgs } = await supabase
            .from('chat_messages')
            .select('id, sender_role')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (latestMsgs && latestMsgs.length > 0) {
            const latest = latestMsgs[0];
            const prev = lastKnownMessageIds[room.id];

            if (latest.sender_role === 'tourist' && String(latest.id) !== prev) {
              // New tourist message detected — mark as unread
              setUnreadRooms(p => new Set(p).add(room.id));
            }
            lastKnownMessageIds[room.id] = String(latest.id);
          }
        }
      }
    }, 4000);

    return () => {
      supabase.removeChannel(roomChannel);
      clearInterval(pollInterval);
    };
  }, []);

  // Real-time: Tourist registrations
  useEffect(() => {
    const touristChannel = supabase
      .channel('admin-tourist-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tourists' }, (payload) => {
        const newTourist = payload.new as any;
        // Count the account (total tourists) but NOT as a visitor log (scans only)
        setStats(prev => ({ ...prev, totalTourists: prev.totalTourists + 1 }));
        // Prepend to list
        setTourists(prev => [newTourist, ...prev]);
        // Update insight stats
        setTouristStats(prev => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const isThisWeek = newTourist.created_at && new Date(newTourist.created_at) >= oneWeekAgo;
          const touristNat = newTourist.nationality && newTourist.nationality.toLowerCase() === 'local' ? 'Local' : 'Foreign';
          const existing = prev.topNationalities.find(n => n.nationality === touristNat);
          const updatedNats = existing
            ? prev.topNationalities
                .map(n => n.nationality === touristNat ? { ...n, count: n.count + 1 } : n)
                .sort((a, b) => b.count - a.count)
            : [...prev.topNationalities, { nationality: touristNat, count: 1 }]
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
          return {
            newThisWeek: isThisWeek ? prev.newThisWeek + 1 : prev.newThisWeek,
            topNationalities: updatedNats
          };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(touristChannel); };
  }, []);

  // Real-time: Reviews & QR Scans monitoring
  useEffect(() => {
    const reviewsChannel = supabase
      .channel('admin-reviews-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, (payload) => {
        const r = payload.new as any;
        // Show live toast notification
        addLiveToast({
          type: 'review',
          reviewer: r.reviewer_name || 'A Tourist',
          item: r.item_name || 'a location',
          rating: r.rating || 0,
          comment: r.comment || ''
        });
        // Increment new review badge counter
        setNewReviewCount(prev => prev + 1);
        // Pulse the reviews tab
        setReviewTabPulse(true);
        setTimeout(() => setReviewTabPulse(false), 3000);
        // Update activity feed
        setRecentActivities(prev => [
          {
            type: 'review',
            name: r.reviewer_name || 'Tourist',
            action: `Rated ${r.item_name} ${r.rating}★`,
            time: 'Just now'
          },
          ...prev
        ].slice(0, 10));
        loadReviews();
        fetchDashboardData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reviews' }, () => {
        loadReviews();
        fetchDashboardData();
      })
      .subscribe();

    const scansChannel = supabase
      .channel('admin-scans-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qr_scans' }, (payload) => {
        const s = payload.new as any;
        if (!suppressScanBump.current) setLiveScanCount(prev => prev + 1);
        if (!suppressScanBump.current) recordScanVisit(s.item_name, s.item_type);
        if (!suppressScanBump.current) {
          setTotalScans(prev => {
            const next = prev + 1;
            localStorage.setItem('roam_blon_total_scans', String(next));
            return next;
          });
        }
        // Keep Top Nationalities aligned with the scan count
        const scanNat = s.nationality && String(s.nationality).toLowerCase() === 'local' ? 'Local' : 'Foreign';
        if (!suppressScanBump.current) {
        setTouristStats(prev => {
          const existing = prev.topNationalities.find(n => n.nationality === scanNat);
          const updatedNats = existing
            ? prev.topNationalities.map(n => n.nationality === scanNat ? { ...n, count: n.count + 1 } : n)
                .sort((a, b) => b.count - a.count)
            : [...prev.topNationalities, { nationality: scanNat, count: 1 }]
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
          return { ...prev, topNationalities: updatedNats };
        });
        // Show scan toast
        addLiveToast({
          type: 'scan',
          reviewer: 'Tourist',
          item: s.item_name || 'a location',
          rating: 0,
          comment: ''
        });
        setRecentActivities(prev => [
          {
            type: 'scan',
            name: s.item_name || 'QR Code',
            action: `Scanned ${s.item_type || 'location'} QR Code`,
            time: 'Just now'
          },
          ...prev
        ].slice(0, 10));
        }
      })
      .subscribe();

    // Broadcast fallback channel — catches reviews sent from QR page even if RLS blocks DB insert
    const broadcastChannel = supabase
      .channel('admin-live-feed')
      .on('broadcast', { event: 'new_review' }, ({ payload: r }: any) => {
        // Only show toast if this wasn't already caught by postgres_changes
        addLiveToast({
          type: 'review',
          reviewer: r.reviewer_name || 'A Tourist',
          item: r.item_name || 'a location',
          rating: r.rating || 0,
          comment: r.comment || ''
        });
        setNewReviewCount(prev => prev + 1);
        setReviewTabPulse(true);
        setTimeout(() => setReviewTabPulse(false), 3000);
        setRecentActivities(prev => [
          {
            type: 'review',
            name: r.reviewer_name || 'Tourist',
            action: `Rated ${r.item_name} ${r.rating}★ via QR`,
            time: 'Just now'
          },
          ...prev
        ].slice(0, 10));
        // Reload reviews in case the DB insert succeeded but we missed the postgres_changes event
        setTimeout(() => loadReviews(), 1500);
      })
      .on('broadcast', { event: 'new_scan' }, ({ payload: s }: any) => {
        // Fallback — catches QR scans broadcast from the QR page if RLS blocks the DB insert
        if (!suppressScanBump.current) setLiveScanCount(prev => prev + 1);
        if (!suppressScanBump.current) recordScanVisit(s.item_name, s.item_type);
        if (!suppressScanBump.current) {
          setTotalScans(prev => {
            const next = prev + 1;
            localStorage.setItem('roam_blon_total_scans', String(next));
            return next;
          });
        }
        const scanNat = s.nationality && String(s.nationality).toLowerCase() === 'local' ? 'Local' : 'Foreign';
        if (!suppressScanBump.current) {
          setTouristStats(prev => {
            const existing = prev.topNationalities.find(n => n.nationality === scanNat);
            const updatedNats = existing
              ? prev.topNationalities.map(n => n.nationality === scanNat ? { ...n, count: n.count + 1 } : n)
                  .sort((a, b) => b.count - a.count)
              : [...prev.topNationalities, { nationality: scanNat, count: 1 }]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);
            return { ...prev, topNationalities: updatedNats };
          });
        }
        addLiveToast({
          type: 'scan',
          reviewer: 'Tourist',
          item: s.item_name || 'a location',
          rating: 0,
          comment: ''
        });
        setRecentActivities(prev => [
          {
            type: 'scan',
            name: s.item_name || 'QR Code',
            action: `Scanned ${s.item_type || 'location'} QR Code`,
            time: 'Just now'
          },
          ...prev
        ].slice(0, 10));
      })
      .on('broadcast', { event: 'new_tourist' }, ({ payload: t }: any) => {
        // Fallback — catches tourist signups broadcast from the signup flow if RLS blocks the DB insert
        setStats(prev => ({ ...prev, totalTourists: prev.totalTourists + 1 }));
        setTourists(prev => {
          if (prev.some(x => (t.email && x.email === t.email))) return prev;
          return [{ ...t, id: t.id || `local_${Date.now()}` }, ...prev];
        });
        setTouristStats(prev => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const isThisWeek = t.created_at && new Date(t.created_at) >= oneWeekAgo;
          const touristNat = t.nationality && t.nationality.toLowerCase() === 'local' ? 'Local' : 'Foreign';
          const existing = prev.topNationalities.find(n => n.nationality === touristNat);
          const updatedNats = existing
            ? prev.topNationalities
                .map(n => n.nationality === touristNat ? { ...n, count: n.count + 1 } : n)
                .sort((a, b) => b.count - a.count)
            : [...prev.topNationalities, { nationality: touristNat, count: 1 }]
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
          return {
            newThisWeek: isThisWeek ? prev.newThisWeek + 1 : prev.newThisWeek,
            topNationalities: updatedNats
          };
        });
        // Persist locally so the count survives refresh even without a DB policy
        try {
          const stored = JSON.parse(localStorage.getItem('roam_blon_tourists') || '[]');
          if (!stored.some((x: any) => (t.email && x.email === t.email))) {
            stored.unshift({ ...t, created_at: t.created_at || new Date().toISOString(), id: t.id || `local_${Date.now()}` });
            localStorage.setItem('roam_blon_tourists', JSON.stringify(stored.slice(0, 500)));
          }
        } catch { /* ignore */ }
      })
      .on('broadcast', { event: 'new_booking' }, ({ payload: b }: any) => {
        // Live toast for new tour guide bookings
        addLiveToast({
          type: 'booking',
          reviewer: b.tourist_name || b.tourist_email || 'A Tourist',
          item: b.guide_name || 'a tour guide',
          rating: 0,
          comment: b.destinations || ''
        });
        setRecentActivities(prev => [
          {
            type: 'booking',
            name: b.tourist_name || b.tourist_email || 'Tourist',
            action: `Booked Tour Guide: ${b.guide_name}`,
            time: 'Just now'
          },
          ...prev
        ].slice(0, 10));
        setGuideBookings(prev => {
          if (prev.some(x => (x.reference_code && x.reference_code === b.reference_code) || x.id === b.id)) return prev;
          return [{ ...b, id: b.id || b.reference_code }, ...prev];
        });
        setTimeout(() => fetchDashboardData(), 1200);
      })
      .on('broadcast', { event: 'new_guide_review' }, ({ payload: r }: any) => {
        // Live guide review — show toast + update the reviews list instantly
        addLiveToast({
          type: 'guide_review',
          reviewer: r.tourist_name || r.tourist_email || 'A Tourist',
          item: r.guide_name || 'Tour Guide',
          rating: r.rating || 0,
          comment: r.comment || ''
        });
        setGuideReviews(prev => {
          const rest = prev.filter((x: any) => !(x.booking_id && r.booking_id && x.booking_id === r.booking_id));
          return [{ ...r, id: r.id || `live_${Date.now()}` }, ...rest];
        });
      })
      .on('broadcast', { event: 'new_evaluation' }, () => {
        // Live evaluation — refresh the survey responses instantly
        supabase.from('evaluations').select('*').order('id', { ascending: false }).then(({ data }) => {
          if (data) setEvaluations(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(scansChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, []);

  useEffect(() => {
    if (!activeChatRoom) return;

    const roomId = activeChatRoom.id;

    // Fetch full message history when room is opened
    const fetchRoomMsgs = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      setActiveChatMessages(data || []);
    };
    fetchRoomMsgs();

    // Realtime subscription with server-side filter
    const msgChannel = supabase
      .channel(`admin-room-${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const newMessage = payload.new as any;
        setActiveChatMessages(prev => {
          if (newMessage.id && prev.some(m => String(m.id) === String(newMessage.id))) return prev;
          const optIdx = prev.findIndex(
            m => !m.id && m.content === newMessage.content && m.sender_role === newMessage.sender_role
          );
          if (optIdx !== -1) {
            const updated = [...prev];
            updated[optIdx] = newMessage;
            return updated;
          }
          return [...prev, newMessage];
        });
      })
      .subscribe();

    // Polling fallback — re-fetch every 3s to guarantee tourist messages appear
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (data) {
        setActiveChatMessages(prev => {
          if (data.length > prev.filter(m => m.id).length) return data;
          const lastPrev = prev.filter(m => m.id).at(-1);
          const lastDb = data.at(-1);
          if (lastDb && (!lastPrev || String(lastPrev.id) !== String(lastDb.id))) return data;
          return prev;
        });
      }
    }, 3000);

    return () => {
      supabase.removeChannel(msgChannel);
      clearInterval(pollInterval);
    };
  }, [activeChatRoom]);

  // Clear unread when visiting a room
  useEffect(() => {
    if (activeChatRoom && unreadRooms.has(activeChatRoom.id)) {
      setUnreadRooms(prev => {
        const next = new Set(prev);
        next.delete(activeChatRoom.id);
        return next;
      });
    }
  }, [activeChatRoom, unreadRooms]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeChatRoom || !currentTourist) return;

    const content = chatInput.trim();
    const newMsg = {
      room_id: activeChatRoom.id,
      sender_email: currentTourist.email,
      sender_role: 'admin',
      content: content
    };

    // Optimistic update
    setActiveChatMessages(prev => [...prev, { ...newMsg, created_at: new Date().toISOString() }]);
    setChatInput("");

    const { error } = await supabase.from('chat_messages').insert([newMsg]);
    if (error) console.error("Error sending message:", error);

    // Update room with latest message and timestamp
    await supabase.from('chat_rooms').update({ 
      latest_message: content,
      updated_at: new Date().toISOString() 
    }).eq('id', activeChatRoom.id);
  };

  const handleAuthComplete = async (userData: Tourist) => {
    setCurrentTourist(userData);
    if (userData.role !== 'admin') {
      alert(`Access Denied: Admin Only.`);
      processLogout();
    } else {
      await fetchDashboardData();
    }
  };

  const handleAddResource = async (type: string) => {
    setIsSubmitting(true);
    try {
      let table = "";
      let payload = {};

      switch (type) {
        case "destination":
          table = "destinations";
          const formAny = destinationForm as any;
          let fullDesc = destinationForm.description || "";
          if (formAny.contact) fullDesc += `\n\nContact: ${formAny.contact}`;
          if (formAny.howToGetThere) fullDesc += `\n\nHow To Get There:\n${formAny.howToGetThere}`;

          payload = {
            name: destinationForm.name,
            description: fullDesc.trim(),
            location: destinationForm.location,
            category: destinationForm.category || "Beaches",
            image_url: destinationForm.image_url
          };
          break;
        case "dining":
          table = "dining_hubs";
          payload = diningForm;
          break;
        case "souvenir":
          table = "souvenirs";
          payload = souvenirForm;
          break;
        case "emergency":
          table = "emergency_hotlines";
          payload = emergencyForm;
          break;
      }

      if (editingItem && editingItem.type === type) {
        // --- UPDATE EXISTING ITEM ---
        const { error } = await supabase.from(table).update(payload).eq('id', editingItem.id);
        
        if (error) {
          console.warn(`Supabase update notice (${table}):`, error.message);
          // RLS / Local state fallback for edit
          if (type === "destination") {
            setDestinations(prev => prev.map(d => String(d.id) === String(editingItem.id) ? { ...d, ...payload } : d));
          } else if (type === "dining") {
            setAllServices(prev => ({
              ...prev,
              dining: prev.dining.map(item => String(item.id) === String(editingItem.id) ? { ...item, ...payload } : item)
            }));
          } else if (type === "emergency") {
            setAllServices(prev => ({
              ...prev,
              emergency: prev.emergency.map(item => String(item.id) === String(editingItem.id) ? { ...item, ...payload } : item)
            }));
          }
        } else {
          await fetchDashboardData();
        }
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
      } else {
        // --- ADD NEW ITEM ---
        const { error } = await supabase.from(table).insert([payload]);
        if (error) {
          console.warn(`Supabase insert notice (${table}):`, error.message);
          const newItem = { id: `item-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
          if (type === "destination") {
            setDestinations(prev => [newItem, ...prev]);
          } else if (type === "dining") {
            setAllServices(prev => ({ ...prev, dining: [newItem, ...prev.dining] }));
          } else if (type === "emergency") {
            setAllServices(prev => ({ ...prev, emergency: [newItem, ...prev.emergency] }));
          }
        } else {
          await fetchDashboardData();
        }
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
      }

      setActiveModal(null);
      setEditingItem(null);
      
      // Reset forms
      setDestinationForm({ name: "", description: "", location: "", category: "Beaches", image_url: "" });
      setDiningForm({ name: "", description: "", category: "Local Eat", address: "", image_url: "", opening_time: "08:00 AM", closing_time: "10:00 PM" });
      setSouvenirForm({ name: "", category: "SOUVENIR", price: "", image_url: "" });
      setEmergencyForm({ label: "", phone: "", icon_key: "ShieldAlert", color_key: "rose" });

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (type: string, id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"? This will delete it from the system.`)) return;

    setIsSubmitting(true);
    try {
      let table = "";
      switch (type) {
        case "destination": table = "destinations"; break;
        case "dining": table = "dining_hubs"; break;
        case "souvenir": table = "souvenirs"; break;
        case "emergency": table = "emergency_hotlines"; break;
      }

      if (table) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
          console.warn(`Supabase delete notice (${table}):`, error.message);
        }
      }

      if (type === "destination") {
        setDestinations(prev => prev.filter(d => String(d.id) !== String(id)));
      } else if (type === "dining") {
        setAllServices(prev => ({
          ...prev,
          dining: prev.dining.filter(item => String(item.id) !== String(id))
        }));
      } else if (type === "emergency") {
        setAllServices(prev => ({
          ...prev,
          emergency: prev.emergency.filter(item => String(item.id) !== String(id))
        }));
      }

      alert(`${name} has been removed successfully!`);
      setActiveModal(null);
      setEditingItem(null);
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const processLogout = async () => {
    await supabase.auth.signOut();
    setCurrentTourist(null);
    setIsLogoutModalOpen(false);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F6F1ED]">
         <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Verifying Session...</p>
         </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-[#F6F1ED] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 text-center shadow-xl border border-slate-100 max-w-md w-full">
          <div className="w-20 h-20 mx-auto bg-rose-50 rounded-[1.75rem] flex items-center justify-center mb-6">
            <AlertCircle size={38} className="text-rose-500" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 mb-3">Access Denied</h3>
          <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8">
            The admin console is restricted to the official account<br />
            <span className="text-rose-600">admin@roam-blon.com</span>.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { supabase.auth.signOut(); router.push('/'); }}
              className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTourist && !loading) {
    return <UnifiedAuthFlow onComplete={handleAuthComplete} initialRole="admin" initialScreen="signin" />;
  }

  // Visitor log total = QR scans only (account signups are tracked separately and
  // do NOT count as logs). All three widgets read this single source of truth.
  const totalVisitorLogs = Math.max(0, totalScans);

  return (
    <div className="flex h-screen bg-[#F6F1ED] text-[#222] relative overflow-hidden">

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">Wait a minute!</h3>
            <p className="text-slate-500 font-medium mb-8">Are you sure you want to end your session?</p>
            <div className="flex gap-4">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">No, Stay</button>
              <button onClick={processLogout} className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-rose-200">Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE REAL-TIME TOAST NOTIFICATIONS --- */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {liveToasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-500"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(244,63,94,0.1)' }}
          >
            {/* Colored top bar */}
            <div className={`h-1.5 w-full ${toast.type === 'review' || toast.type === 'guide_review' ? 'bg-gradient-to-r from-amber-400 to-rose-500' : toast.type === 'booking' ? 'bg-gradient-to-r from-orange-400 to-rose-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${toast.type === 'review' || toast.type === 'guide_review' ? 'bg-amber-50 text-amber-500' : toast.type === 'booking' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                    {toast.type === 'review' || toast.type === 'guide_review' ? (
                      <Star size={18} className="fill-amber-400 text-amber-400" />
                    ) : toast.type === 'booking' ? (
                      <BellDot size={18} />
                    ) : (
                      <QrCode size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                        {toast.type === 'review' ? '⚡ New Review' : toast.type === 'guide_review' ? '⭐ Guide Review' : toast.type === 'booking' ? '🔔 New Booking' : '📱 QR Scanned'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">LIVE</span>
                    </div>
                    <p className="font-black text-slate-900 text-sm leading-tight truncate">
                      {toast.type === 'booking' ? toast.item : toast.reviewer}
                    </p>
                    <p className="text-slate-500 text-xs font-medium mt-0.5 truncate">
                      {toast.type === 'review' || toast.type === 'guide_review' ? `Rated "${toast.item}"` : toast.type === 'booking' ? `Booked by ${toast.reviewer}` : `Scanned: ${toast.item}`}
                    </p>
                    {(toast.type === 'review' || toast.type === 'guide_review') && toast.rating > 0 && (
                      <div className="flex gap-0.5 mt-1.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={11} className={s <= toast.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                        ))}
                      </div>
                    )}
                    {toast.comment && (
                      <p className="text-slate-400 text-[10px] font-medium mt-1.5 italic line-clamp-1">"{toast.comment}"</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors"
                >
                  <X size={10} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- SIDEBAR (Desktop Only) --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#1A1D2D] p-10 shrink-0 text-white h-full relative overflow-y-auto scrollbar-hide">
        <div className="mb-14">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#FAEEED] rounded-xl flex items-center justify-center border border-rose-200 overflow-hidden shadow-inner">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-xl font-black uppercase text-white leading-none tracking-tighter">ROAM-BLON</h1>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none mt-0.5">Officer Dashboard</p>
             </div>
          </div>
        </div>
        <nav className="flex-1 space-y-3">
          <SidebarLink icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarLink icon={<MapPin />} label="Destinations" active={activeTab === 'destinations'} onClick={() => setActiveTab('destinations')} />
          <SidebarLink icon={<Users />} label="Logs" active={activeTab === 'tourists'} onClick={() => setActiveTab('tourists')} />
          <SidebarLink icon={<Building />} label="Services" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
          <SidebarLink icon={<ClipboardList />} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <div className="relative">
            <SidebarLink icon={<MessageSquare />} label="Live Support" active={activeTab === 'live_chats'} onClick={() => setActiveTab('live_chats')} />
            {unreadRooms.size > 0 && (
              <div className="absolute top-4 right-6 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#1A1D2D] animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            )}
          </div>
          <SidebarLink icon={<Star />} label="Reviews" active={activeTab === 'reviews'} onClick={() => { setActiveTab('reviews'); setNewReviewCount(0); loadReviews(); }} />
          {/* Reviews badge */}
          {(newReviewCount > 0 || reviewTabPulse) && (
            <div className="absolute -top-1 right-4 flex items-center gap-1 pointer-events-none">
              {newReviewCount > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm min-w-[18px] text-center">
                  +{newReviewCount}
                </span>
              )}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
          <SidebarLink icon={<QrCode />} label="QR Generator" active={activeTab === 'qr_generator'} onClick={() => setActiveTab('qr_generator')} />
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-800 space-y-3">
          <SidebarLink icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <button 
            onClick={() => { setIsLogoutModalOpen(true); setIsSidebarOpen(false); }} 
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-slate-300 hover:text-white hover:bg-white/5"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="sticky top-0 z-50 bg-white border-b-4 border-[#FAEEED] shadow-sm shrink-0 lg:hidden">
          <div className="h-20 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FAEEED] rounded-xl flex items-center justify-center border-2 border-rose-200 overflow-hidden shadow-inner">
                     <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                     <span className="font-black text-xl md:text-2xl text-slate-900 uppercase tracking-tighter leading-none">ROAM-BLON</span>
                     <span className="text-[9px] md:text-[10px] font-bold text-rose-500 tracking-[0.2em] uppercase">Officer Dashboard</span>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
                className="p-3.5 bg-slate-100 text-slate-900 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* MOBILE MENU DROPDOWN OVERLAY */}
          {isSidebarOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 w-full max-h-[calc(100vh-6rem)] overflow-y-auto z-40 bg-white/95 backdrop-blur-3xl animate-in slide-in-from-top duration-300 pointer-events-auto border-b-2 border-slate-100 pb-10 shadow-2xl">
               <div className="flex flex-col p-6 gap-3 font-sans">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/> },
                  { id: 'destinations', label: 'Destinations', icon: <MapPin size={20}/> },
                  { id: 'tourists', label: 'Logs', icon: <Users size={20}/> },
                  { id: 'services', label: 'Services', icon: <Building size={20}/> },
                  { id: 'bookings', label: 'Bookings', icon: <ClipboardList size={20}/> },
                  { id: 'live_chats', label: 'Messages', icon: <MessageSquare size={20}/>, hasBadge: unreadRooms.size > 0 },
                  { id: 'reviews', label: 'Reviews', icon: <Star size={20}/>, hasBadge: newReviewCount > 0 || reviewTabPulse },
                  { id: 'qr_generator', label: 'QR Generator', icon: <QrCode size={20}/> },
                  { id: 'settings', label: 'Settings', icon: <Settings size={20}/> }
                ].map((item: any) => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                    className={`w-full px-6 py-5 rounded-2xl text-lg font-black transition-all text-left flex items-center justify-between gap-4 ${activeTab === item.id ? 'bg-rose-50 text-rose-600 border-2 border-rose-200 shadow-sm' : 'bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={activeTab === item.id ? "text-rose-500" : "text-slate-400"}>{item.icon}</span>
                      {item.label}
                    </div>
                    {item.hasBadge && <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>}
                  </button>
                ))}
                
                <div className="border-t-2 border-slate-100 my-4 opacity-50"></div>
                
                <button 
                  onClick={() => { setIsLogoutModalOpen(true); setIsSidebarOpen(false); }}
                  className="w-full px-6 py-5 rounded-2xl text-lg font-black text-rose-500 bg-rose-50 border-2 border-rose-100 hover:bg-rose-100 transition-all text-left flex items-center gap-4"
                >
                  <LogOut size={20}/> Logout
                </button>
             </div>
          </div>
        )}
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-14 bg-[#F6F1ED]">
          <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatCard label="Total Number of Visitor Logs" value={totalVisitorLogs} icon={<Users />} color="bg-rose-100 text-rose-700" onClick={() => setActiveTab('tourists')} />
                  <StatCard label="Total Number of Destinations" value={destinations.length > 0 ? destinations.length : stats.destinations} icon={<MapPin />} color="bg-orange-100 text-orange-700" onClick={() => setActiveTab('destinations')} />
                  <StatCard label="Total Number of Dining Spots" value={allServices.dining.length > 0 ? allServices.dining.length : stats.diningSpots} icon={<Building />} color="bg-violet-100 text-violet-700" onClick={() => setActiveTab('services')} />
                  <StatCard label="Booked Tour Guides" value={guideBookings.filter((b: any) => !b.status || b.status === 'pending').length} icon={<Users />} color="bg-blue-100 text-blue-700" onClick={() => setActiveTab('bookings')} />
                </div>

                {/* --- TOURIST INSIGHTS PANEL --- */}
                <div className="grid grid-cols-1 gap-8">
                  {/* Top Nationalities */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-[#EBEBEB] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-[#111]">Top Nationalities</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tourist origin breakdown</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Live</span>
                      </div>
                    </div>
                    {touristStats.topNationalities.length === 0 ? (
                      <p className="text-slate-300 text-xs italic text-center py-8">No tourist data yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {touristStats.topNationalities.map((nat, idx) => {
                          const maxCount = touristStats.topNationalities[0]?.count || 1;
                          const pct = Math.round((nat.count / maxCount) * 100);
                          const barColors = [
                            'bg-rose-500', 'bg-orange-400', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'
                          ];
                          return (
                            <div key={nat.nationality} className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase text-slate-400 w-5">{idx + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-700">{nat.nationality}</span>
                                  <span className="text-[10px] font-black text-slate-400">{nat.count} tourist{nat.count !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${barColors[idx] || 'bg-slate-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Visitors</span>
                      <span className="text-xl font-black italic text-emerald-600">{totalVisitorLogs}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 items-start">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-[#EBEBEB] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <Rocket className="text-rose-500" size={24} />
                      <h3 className="text-2xl font-black italic uppercase text-[#111]">Quick actions</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <QuickActionButton onClick={() => openAddModal("destination")} label="Add Tourist Destination" icon={<MapPin size={18} />} />
                      <QuickActionButton onClick={() => openAddModal("dining")} label="Add Dining Restaurants" icon={<Building size={18} />} />
                      <QuickActionButton onClick={() => openAddModal("emergency")} label="Add Emergency Contacts" icon={<AlertCircle size={18} />} />
                    </div>
                  </div>
                </div>

                {/* --- TOP RATED & MOST VISITED --- */}
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center">
                        <Trophy className="text-amber-500" size={26} />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Top Rated & Most Visited</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ranked by avg rating · updated live from QR reviews</p>
                      </div>
                    </div>
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live · {reviews.length} reviews</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <TopRatedCard
                      title="Top Destinations"
                      icon={<MapPin size={18} />}
                      items={topDestinations}
                      accentColor="rose"
                    />
                    <TopRatedCard
                      title="Top Dining Spots"
                      icon={<Building size={18} />}
                      items={topDining}
                      accentColor="orange"
                    />
                    <TopRatedCard
                      title="Top Tour Guides"
                      icon={<Users size={18} />}
                      items={topGuides}
                      accentColor="blue"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'destinations' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Official Destinations</h2>
                      <span className="bg-rose-100 text-rose-600 px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                        {destinations.length} Total
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Manage public tourist spots and landmarks ({destinations.length} total destinations)</p>
                  </div>
                  <button onClick={() => openAddModal("destination")} className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-slate-200">New Destination</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...destinations].sort((a, b) => {
                    const aR = reviews.filter(r => r.item_type === 'destination' && (r.item_id === a.id || r.item_name?.toLowerCase() === a.name?.toLowerCase()));
                    const bR = reviews.filter(r => r.item_type === 'destination' && (r.item_id === b.id || r.item_name?.toLowerCase() === b.name?.toLowerCase()));
                    const avgA = aR.length ? aR.reduce((s, r) => s + (r.rating || 0), 0) / aR.length : 0;
                    const avgB = bR.length ? bR.reduce((s, r) => s + (r.rating || 0), 0) / bR.length : 0;
                    const diff = avgB - avgA;
                    return diff !== 0 ? diff : bR.length - aR.length;
                  }).map((d, index) => {
                    const dReviews = reviews.filter(r => r.item_type === 'destination' && (r.item_id === d.id || r.item_name?.toLowerCase() === d.name?.toLowerCase()));
                    const avg = dReviews.length ? (dReviews.reduce((s, r) => s + (r.rating || 0), 0) / dReviews.length).toFixed(1) : null;
                    return (
                      <div key={d.id} className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm group hover:shadow-2xl transition-all flex flex-col">
                        <div className="h-60 bg-slate-100 overflow-hidden relative">
                          <img
                            src={d.image_url || destinationImageFallback(d.id, d.name)}
                            alt={d.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => {
                              const fb = destinationImageFallback(d.id, d.name);
                              if ((e.currentTarget.src && !e.currentTarget.src.endsWith(fb))) {
                                e.currentTarget.src = fb;
                              }
                            }}
                          />
                          <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase text-slate-900">{d.category}</div>
                          {/* Rank badge */}
                          <div className={`absolute bottom-4 left-6 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md ${
                            index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-500 text-white' : 'bg-white/90 text-slate-700'
                          }`}>
                            🏆 #{index + 1} Ranked
                          </div>
                          <div className="absolute top-6 right-6 flex items-center gap-2">
                            <button 
                              onClick={() => handleEditResource("destination", d)} 
                              className="p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-900 hover:text-rose-500 transition-colors shadow-lg"
                              title="Edit Destination"
                            >
                               <Edit size={16}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteResource("destination", d.id, d.name)} 
                              className="p-2 bg-white/90 backdrop-blur-md rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-lg"
                              title="Remove Destination"
                            >
                               <Trash2 size={16}/>
                            </button>
                            <button 
                              onClick={() => setQrItem({ type: "destination", data: d })} 
                              className="p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-900 hover:text-rose-500 transition-colors shadow-lg"
                              title="View QR Code"
                            >
                               <QrCode size={16}/>
                            </button>
                          </div>
                        </div>
                        <div className="p-8 relative flex-1 flex flex-col">
                          <div className="absolute top-8 right-8 p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 hidden md:block hover:scale-150 transition-transform origin-top-right cursor-pointer" onClick={() => setQrItem({ type: "destination", data: d })}>
                             <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : "https://roam-blon.vercel.app"}/qr?type=destination&id=${d.id || encodeURIComponent(d.name)}`} size={60} />
                          </div>
                          <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-2 pr-0 md:pr-20">{d.name}</h4>
                          <div className="flex items-center gap-3 text-slate-400 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin size={14}/>
                              <span className="text-[10px] font-bold uppercase tracking-widest">{d.location}</span>
                            </div>
                            {avg && (
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-md text-[10px] font-black">
                                <Star size={11} className="fill-amber-400 text-amber-400"/> {avg} ({dReviews.length})
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mt-auto">{d.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tourists' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-700"><Users size={120}/></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-4">Visitor Logs</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tracking and managing visitor safety data</p>
                    </div>
                    <div className="flex gap-8 flex-wrap">
                      <div className="text-right">
                        <p className="text-4xl font-black text-emerald-500 italic leading-none mb-1">{totalVisitorLogs}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total QR Scans</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System evaluation survey responses */}
                <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-[#111]">System Evaluations</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Likert survey answers from the evaluation form</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-[9px] font-black uppercase tracking-widest">
                      {evaluations.length} responses
                    </span>
                  </div>

                  {evaluations.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-10">
                      No evaluations yet — waiting for tourists to submit the form
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {/* Average scores per dimension */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Average Scores per Dimension</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { label: "Effectiveness", key: "effectiveness" },
                            { label: "Efficiency", key: "efficiency" },
                            { label: "Usefulness", key: "usefulness" },
                            { label: "Trust", key: "trust" },
                            { label: "Pleasure", key: "pleasure" },
                            { label: "Comfort", key: "comfort" },
                            { label: "Economic Risk", key: "economic_risk" },
                            { label: "Health & Safety Risk", key: "health_safety_risk" },
                            { label: "Environmental Risk", key: "environmental_risk" },
                            { label: "Context Completeness", key: "context_completeness" },
                            { label: "Flexibility", key: "flexibility" },
                          ].map(dim => {
                            const vals = evaluations.map(e => Number(e[dim.key]) || 0).filter(v => v > 0);
                            const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                            const pct = (avg / 5) * 100;
                            return (
                              <div key={dim.key} className="rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{dim.label}</p>
                                  <p className="text-sm font-black text-violet-600">{avg ? avg.toFixed(2) : "—"}</p>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Individual responses */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Individual Responses</h4>
                        <div className="space-y-4">
                          {evaluations.slice(0, 20).map((e, i) => (
                            <div key={e.id || i} className="rounded-2xl border border-slate-100 p-5">
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-xs font-black">{i + 1}</span>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{e.name || "Anonymous"}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.age ? `Age ${e.age}` : ""} {e.gender ? `· ${e.gender}` : ""} {e.nationality ? `· ${e.nationality}` : ""}</span>
                                {e.email && <span className="text-[10px] font-bold text-slate-400">{e.email}</span>}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {[
                                  { label: "Effectiveness", key: "effectiveness" },
                                  { label: "Efficiency", key: "efficiency" },
                                  { label: "Usefulness", key: "usefulness" },
                                  { label: "Trust", key: "trust" },
                                  { label: "Pleasure", key: "pleasure" },
                                  { label: "Comfort", key: "comfort" },
                                  { label: "Economic Risk", key: "economic_risk" },
                                  { label: "Health & Safety", key: "health_safety_risk" },
                                  { label: "Environmental", key: "environmental_risk" },
                                  { label: "Context Completeness", key: "context_completeness" },
                                  { label: "Flexibility", key: "flexibility" },
                                ].map(dim => (
                                  <div key={dim.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{dim.label}</span>
                                    <span className={`text-sm font-black ${Number(e[dim.key]) >= 4 ? 'text-emerald-600' : Number(e[dim.key]) >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                                      {e[dim.key] || "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {evaluations.length > 20 && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Showing 20 of {evaluations.length} responses</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Most visited places (based on scans) */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-[#111]">Most Visited Destinations</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">All tourist destinations ranked by QR scan visits</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                      Live
                    </span>
                  </div>
                  <AnalyticsGraph
                    title="Top 10 Most Visited Destinations"
                    subtitle="Top 10 tourist destinations ranked by QR scan visits"
                    items={allDestinationsSeries.slice(0, 10)}
                    accentColor="rose"
                    byVisits
                    hideLegend
                  />
                  <div className="mt-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Top 10 Most Visited Destinations</h4>
                    <div className="space-y-3">
                      {allDestinationsSeries.slice(0, 10).map((d: any, idx: number) => (
                        <div key={d.name} className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                          <span className="w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm shrink-0 text-white" style={{ background: POINT_COLORS[idx % POINT_COLORS.length] }}>{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{d.name}</p>
                          </div>
                          <span className="text-sm font-black text-rose-500 shrink-0">{d.count} <span className="text-[10px] font-bold text-slate-400 uppercase">scans</span></span>
                        </div>
                      ))}
                      {allDestinationsSeries.slice(0, 10).length === 0 && (
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-6">No destination scans yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Most visited dining spots (based on scans) */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-[#111]">Most Visited Dining Spots</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dining spots ranked by QR scan visits</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                      Live
                    </span>
                  </div>
                  <AnalyticsGraph
                    title="Top 10 Most Visited Dining Spots"
                    subtitle="Top 10 dining spots ranked by QR scan visits"
                    items={allDiningSeries.slice(0, 10)}
                    accentColor="orange"
                    byVisits
                    hideLegend
                  />
                  <div className="mt-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Top 10 Most Visited Dining Spots</h4>
                    <div className="space-y-3">
                      {allDiningSeries.slice(0, 10).map((d: any, idx: number) => (
                        <div key={d.name} className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                          <span className="w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm shrink-0 text-white" style={{ background: POINT_COLORS[idx % POINT_COLORS.length] }}>{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{d.name}</p>
                          </div>
                          <span className="text-sm font-black text-orange-500 shrink-0">{d.count} <span className="text-[10px] font-bold text-slate-400 uppercase">scans</span></span>
                        </div>
                      ))}
                      {allDiningSeries.slice(0, 10).length === 0 && (
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-6">No dining scans yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {/* Dining Summary */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-rose-200 transition-all">
                       <div className="h-14 w-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6"><Building size={24}/></div>
                       <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-4">Dining Hubs</h4>
                       <p className="text-3xl font-black text-slate-900 italic mb-6">{allServices.dining.length} Establishments</p>
                       <button onClick={() => openAddModal("dining")} className="w-full py-4 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Manage Directory</button>
                    </div>

                    {/* Tour Guides Summary */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                       <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><Users size={24}/></div>
                       <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-4">Tour Guides</h4>
                       <p className="text-3xl font-black text-slate-900 italic mb-6">{allServices.tourGuides?.length || 0} Active Guides</p>
                       <button onClick={() => router.push('/admin/guides')} className="w-full py-4 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Manage Approvals</button>
                    </div>

                    {/* Emergency Summary */}
                    <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10"><AlertCircle size={64}/></div>
                       <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-4 text-rose-500">Safety Lines</h4>
                       <p className="text-3xl font-black text-white italic mb-6">{allServices.emergency.length} Active Hotlines</p>
                       <button onClick={() => openAddModal("emergency")} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Update Emergency Contacts</button>
                    </div>
                 </div>

                 {/* --- DINING DIRECTORY LIST --- */}
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <div>
                          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Dining Establishments Directory</h3>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manage, edit, or add food hubs and restaurants</p>
                       </div>
                       <button onClick={() => openAddModal("dining")} className="px-6 py-3 bg-slate-900 hover:bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all">
                          + Add Dining Restaurant
                       </button>
                    </div>

                    {allServices.dining.length === 0 ? (
                       <p className="text-slate-400 text-sm italic py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">No dining establishments registered yet.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {allServices.dining.map((item: any) => (
                             <div key={item.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between gap-4">
                                <div className="flex items-start justify-between gap-4">
                                   <div>
                                      <span className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 bg-orange-100 text-orange-700">
                                         {item.category || 'Dining'}
                                      </span>
                                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight italic">{item.name}</h4>
                                      <p className="text-slate-400 text-[11px] font-medium mt-1">{item.address || item.location || 'Romblon'}</p>
                                   </div>
                                   <button
                                      onClick={() => handleEditResource("dining", item)}
                                      className="p-3 bg-white hover:bg-rose-500 hover:text-white rounded-2xl border border-slate-200 text-slate-700 transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                                      title="Edit Dining Establishment"
                                   >
                                      <Edit size={16} />
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* --- EMERGENCY CONTACTS DIRECTORY LIST --- */}
                 <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <div>
                          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-rose-500">Emergency Hotlines &amp; Safety Lines</h3>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Official safety lines and emergency contacts</p>
                       </div>
                       <button onClick={() => openAddModal("emergency")} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all">
                          + Add Emergency Contact
                       </button>
                    </div>

                    {allServices.emergency.length === 0 ? (
                       <p className="text-slate-400 text-sm italic py-8 text-center border-2 border-dashed border-white/10 rounded-2xl">No emergency contacts registered yet.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {allServices.emergency.map((item: any) => (
                             <div key={item.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col justify-between gap-4">
                                <div className="flex items-start justify-between gap-4">
                                   <div>
                                      <h4 className="font-black text-white text-lg uppercase tracking-tight italic">{item.label || item.name}</h4>
                                      <p className="text-rose-400 text-sm font-bold mt-1.5">📞 {item.phone || item.contact || 'No hotline number'}</p>
                                   </div>
                                   <button
                                      onClick={() => handleEditResource("emergency", item)}
                                      className="p-3 bg-white/10 hover:bg-rose-500 text-white rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                                      title="Edit Emergency Contact"
                                   >
                                      <Edit size={16} />
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* --- TOUR GUIDES AVAILABILITY MANAGEMENT --- */}
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <div>
                          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Tour Guide Roster &amp; Availability</h3>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Set guide availability status for tourist bookings</p>
                       </div>
                       <button onClick={() => router.push('/admin/guides')} className="px-6 py-3 bg-slate-900 hover:bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all">
                          Full Approvals Portal →
                       </button>
                    </div>

                    {allServices.tourGuides.length === 0 ? (
                       <p className="text-slate-400 text-sm italic py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">No registered tour guides found.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {allServices.tourGuides.map((g: any) => {
                             const isAvailable = g.is_available !== false;
                             return (
                                <div key={g.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between gap-4">
                                   <div className="flex items-start justify-between gap-4">
                                      <div>
                                         <span className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 ${
                                            g.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                         }`}>
                                            {g.status || 'approved'}
                                         </span>
                                         <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight italic">{g.full_name || g.name}</h4>
                                         <p className="text-slate-400 text-[11px] font-medium">{g.email}</p>
                                      </div>
                                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                                         <img src={g.profile_image_url || g.photo_url || "/placeholder-user.png"} alt={g.full_name || g.name} className="w-full h-full object-cover" />
                                      </div>
                                   </div>

                                   <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                                      <div className="flex items-center gap-2">
                                         <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                         <span className={`text-[10px] font-black uppercase tracking-widest ${isAvailable ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {isAvailable ? 'Available' : 'Unavailable'}
                                         </span>
                                      </div>
                                      
                                      <button
                                         onClick={() => toggleGuideAvailability(g.id, g.is_available)}
                                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isAvailable 
                                               ? 'bg-slate-900 text-white hover:bg-rose-500' 
                                               : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                         }`}
                                      >
                                         Set {isAvailable ? 'Unavailable' : 'Available'}
                                      </button>
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'live_chats' && (
              <div className="h-[calc(100vh-14rem)] lg:h-[700px] flex flex-col lg:flex-row gap-4 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                {/* Conversations Sidebar */}
                <div className={`w-full lg:w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden ${activeChatRoom ? 'hidden lg:flex' : 'flex'}`}>
                  <div className="p-6 border-b border-slate-50">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Conversations</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chatRooms.length > 0 ? chatRooms.map(room => (
                      <button 
                        key={room.id}
                        onClick={() => setActiveChatRoom(room)}
                        className={`w-full p-4 rounded-2xl text-left transition-all relative ${activeChatRoom?.id === room.id ? 'bg-rose-50 border-2 border-rose-200' : 'hover:bg-slate-50 border-2 border-transparent'}`}
                      >
                        {unreadRooms.has(room.id) && (
                          <div className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-lg animate-bounce"></div>
                        )}
                        <p className={`font-black text-sm uppercase tracking-tight truncate pr-4 ${unreadRooms.has(room.id) ? 'text-rose-600' : 'text-slate-900'}`}>{room.tourist_name || 'Guest Explorer'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {room.tourist_email?.endsWith('_ai') ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Sparkles size={8}/> AI Buddy</span>
                          ) : room.tourist_email?.endsWith('_officer') ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Headset size={8}/> Live Officer</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Headset size={8}/> Live Support</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold truncate mt-2">{room.latest_message || "No messages yet"}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${room.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{room.status}</span>
                          <span className="text-[8px] text-slate-300 uppercase font-bold">{new Date(room.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </button>
                    )) : (
                      <p className="text-center text-slate-300 text-xs italic py-10 px-4">No active chat requests from tourists yet.</p>
                    )}
                  </div>
                </div>

                {/* Message Thread */}
                <div className={`flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden ${activeChatRoom ? 'flex' : 'hidden lg:flex'}`}>
                  {activeChatRoom ? (
                    <>
                      <div className="p-4 lg:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveChatRoom(null)}
                            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black">
                            {activeChatRoom.tourist_name?.[0].toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tighter">{activeChatRoom.tourist_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">In-App Live Chat</p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            await supabase.from('chat_rooms').update({ status: 'closed' }).eq('id', activeChatRoom.id);
                            setActiveChatRoom(null);
                            await fetchDashboardData();
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all"
                        >
                          Close Session
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {activeChatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className="flex flex-col gap-1 max-w-[70%]">
                              {msg.sender_role === 'assistant' && (
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 mb-1">
                                  <Rocket size={10} className="rotate-45" /> AI Assistant
                                </span>
                              )}
                              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                                msg.sender_role === 'admin' 
                                  ? 'bg-slate-900 text-white rounded-tr-none' 
                                  : msg.sender_role === 'assistant'
                                    ? 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none font-medium italic'
                                    : 'bg-rose-50 border border-rose-100 text-slate-800 rounded-tl-none font-medium'
                              }`}>
                                {msg.content}
                                <p className={`text-[8px] mt-1 font-bold uppercase ${msg.sender_role === 'admin' ? 'text-slate-400' : 'text-rose-400'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                            placeholder="Type an official response..."
                            className="flex-1 px-4 py-2 outline-none text-sm font-medium bg-transparent"
                          />
                          <button 
                            onClick={handleSendChat}
                            disabled={!chatInput.trim()}
                            className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition-all disabled:opacity-50"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                      <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6">
                        <MessageSquare size={48} />
                      </div>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Message Center</h4>
                      <p className="text-slate-400 text-sm font-medium max-w-xs">Select a conversation from the left to start providing official assistance.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Global Bookings</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Monitoring active bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-emerald-500 italic leading-none mb-1">
                      ₱{guideBookings.reduce((acc,b) => acc + (Number(b.total_price) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Tour Guide Revenue
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-md">
                    🧭 Tour Guide Bookings ({guideBookings.length})
                    {guideBookings.filter((b: any) => !b.status || b.status === 'pending').length > 0 && (
                      <span className="ml-1 bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {guideBookings.filter((b: any) => !b.status || b.status === 'pending').length}
                      </span>
                    )}
                  </span>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-slate-50">
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Ref Code / ID</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Tourist</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Booked Tour Guide</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Destination</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Tour Date &amp; Pax</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Notes</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Total Price</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Rating &amp; Review</th>
                              <th className="pb-6 px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">Status &amp; Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {guideBookings.length > 0 ? guideBookings.map((b: any) => (
                              <tr key={b.id} className="hover:bg-slate-50 transition-all">
                                 <td className="py-6 px-4 text-[11px] font-black text-rose-500 uppercase tracking-widest">
                                    {b.reference_code || (typeof b.id === 'string' ? b.id.slice(0, 8) : `#${b.id}`)}
                                 </td>
<td className="py-6 px-4">
                                        <p className="font-black text-slate-900 uppercase text-sm">{b.tourist_name || "Guest Explorer"}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{b.tourist_email || "N/A"}</p>
                                        {b.tourist_nationality ? (
                                           <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                              {String(b.tourist_nationality).toLowerCase() === "local" ? "🇵🇭 Local" : String(b.tourist_nationality)}
                                           </span>
                                        ) : null}
                                     </td>
                                 <td className="py-6 px-4">
                                    <div className="flex items-center gap-2">
                                       <span className="w-2 h-2 bg-orange-500 rounded-full" />
                                       <p className="font-black text-slate-900 uppercase text-sm italic">{b.guide_name || "Assigned Guide"}</p>
                                    </div>
                                 </td>
                                 <td className="py-6 px-4">
                                    {b.destinations ? (
                                       <p className="font-black text-rose-600 uppercase text-sm">{b.destinations}</p>
                                    ) : (
                                       <span className="text-[10px] text-slate-300 font-bold">—</span>
                                    )}
                                 </td>
                                 <td className="py-6 px-4">
                                    <p className="font-black text-slate-900 text-sm">{b.booking_date || b.tour_date || "Upcoming"}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.pax || 1} Guest(s)</p>
                                 </td>
                                 <td className="py-6 px-4 max-w-[160px]">
                                    {b.notes ? (
                                      <p className="text-[11px] text-slate-600 font-medium italic leading-snug line-clamp-2" title={b.notes}>{b.notes}</p>
                                    ) : (
                                      <span className="text-[10px] text-slate-300 font-bold">—</span>
                                    )}
                                 </td>
                                 <td className="py-6 px-4 font-black text-slate-900 text-sm">₱{Number(b.total_price || 1500).toLocaleString()}</td>
                                 <td className="py-6 px-4">
                                    {(() => {
                                       const review = guideReviews.find((r: any) =>
                                         (r.booking_id && b.id && String(r.booking_id) === String(b.id)) ||
                                         (r.reference_code && b.reference_code && String(r.reference_code) === String(b.reference_code)) ||
                                         (r.guide_name === b.guide_name && r.tourist_email === b.tourist_email && (r.booking_date || r.tour_date) === b.booking_date)
                                       );
                                       if (!review) {
                                         return <span className="text-[10px] text-slate-300 font-bold">—</span>;
                                       }
                                       return (
                                         <div className="max-w-[200px]">
                                           <div className="flex gap-0.5">
                                             {[1,2,3,4,5].map((s: number) => (
                                               <Star key={s} size={12} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                                             ))}
                                           </div>
                                           {review.comment && (
                                             <p className="text-[11px] text-slate-600 italic mt-1.5 leading-snug line-clamp-2" title={review.comment}>"{review.comment}"</p>
                                           )}
                                           {review.tourist_name && (
                                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">by {review.tourist_name}</p>
                                           )}
                                         </div>
                                       );
                                    })()}
                                 </td>
                                 <td className="py-6 px-4">
                                    <div className="flex items-center gap-3">
                                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                          b.status === 'approved' || b.status === 'confirmed' ? 'bg-emerald-500 text-white' : 
                                          b.status === 'declined' || b.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'
                                       }`}>{b.status || 'pending'}</span>
                                       
                                       <div className="flex gap-1">
                                          {(b.status === undefined || b.status === null || b.status === 'pending') && (
                                             <>
                                             <button 
                                                onClick={() => handleGuideBookingStatus(b.id, 'approved')}
                                                className="px-3 py-1 bg-slate-900 hover:bg-emerald-600 text-white text-[9px] font-black uppercase rounded-lg transition-all"
                                             >
                                                ✓ Accept
                                             </button>
                                             <button 
                                                onClick={() => handleGuideBookingStatus(b.id, 'declined')}
                                                className="px-3 py-1 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 text-[9px] font-black uppercase rounded-lg transition-all"
                                             >
                                                ✗ Decline
                                             </button>
                                             </>
                                          )}
                                       </div>
                                    </div>
                                 </td>
                              </tr>
                           )) : (
                              <tr>
                                 <td colSpan={9} className="py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                                    No tour guide bookings recorded yet.
                                 </td>
                              </tr>
                           )}
                         </tbody>
                      </table>
                   </div>
               </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-3xl">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic mb-10">Officer Profile</h2>
                  <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center gap-8 mb-4">
                      <div className="h-28 w-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black italic shadow-2xl">AD</div>
                      <div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">{currentTourist?.firstName} {currentTourist?.lastName}</h4>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Authorized Tourism Officer | Romblon</p>
                        <div className="flex gap-2 mt-4">
                          <span className="px-4 py-1 bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-rose-100">Verified Badge</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormInput label="Official Email" value={currentTourist?.email || ""} onChange={() => {}} placeholder="admin@roam-blon.com" />
                       <FormInput label="Current Title" value="Tourism Officer" onChange={() => {}} placeholder="Admin" />
                    </div>
                    <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
                       <button className="flex-1 lg:flex-none bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 hover:bg-rose-500 transition-all">Save Profile Updates</button>
                       <button 
                         onClick={() => setIsLogoutModalOpen(true)}
                         className="flex-1 lg:flex-none px-10 py-5 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                       >
                         Sign Out
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Tourist Reviews</h2>
                      {/* LIVE badge */}
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Real-time feedback & star ratings from QR scans</p>
                    {/* Live session stats */}
                    <div className="flex items-center gap-3 mt-3">
                      {liveScanCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <QrCode size={10} />
                          {liveScanCount} scan{liveScanCount !== 1 ? 's' : ''} this session
                        </span>
                      )}
                      {newReviewCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                          <Star size={10} className="fill-amber-400" />
                          +{newReviewCount} new review{newReviewCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3">
                      <Star size={18} className="text-amber-400 fill-amber-400" />
                      <span className="font-black text-slate-800 text-lg">
                        {reviews.length > 0 ? (reviews.reduce((s,r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—'}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">avg · {reviews.length} total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={clearAllReviews} className="bg-rose-500 text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all">
                        Clear All Reviews
                      </button>
                      <button onClick={() => { loadReviews(); setNewReviewCount(0); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 transition-all">
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ratings & Visit Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AnalyticsGraph
                    title="Destinations Analytics"
                    subtitle="Most visited tourist destinations"
                    items={mostVisitedDestinations}
                    accentColor="rose"
                    byCount
                    hideLegend
                  />
                  <AnalyticsGraph
                    title="Dining Analytics"
                    subtitle="Most visited dining spots"
                    items={mostVisitedDining}
                    accentColor="orange"
                    byCount
                    hideLegend
                  />
                </div>

                {/* Top rated tourist destinations */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-[#111]">Top Rated Tourist Destinations</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ranked by average star rating</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                      Live
                    </span>
                  </div>
                  {mostVisitedDestinations.length === 0 ? (
                    <p className="text-slate-300 text-xs italic text-center py-8">No reviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {mostVisitedDestinations.slice(0, 10).map((d: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0"
                            style={{
                              background: POINT_COLORS[idx % POINT_COLORS.length],
                              color: '#fff',
                            }}>
                            {idx + 1}
                          </span>
                          <span className="font-black text-sm text-slate-800 uppercase tracking-tight flex-1 min-w-0 truncate">{d.name}</span>
                          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex-shrink-0">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="text-[11px] font-black text-slate-900">{d.avgRating}</span>
                          </div>
                          <div className="w-40 hidden sm:block h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min((d.avgRating / 5) * 100, 100)}%`,
                                background: POINT_COLORS[idx % POINT_COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-black text-slate-500 w-14 text-right flex-shrink-0">
                            {d.count} review{d.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Rated Dining Spots */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-[#111]">Top 10 Rated Dining Spots</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top 10 dining spots ranked by average star rating</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                      Live
                    </span>
                  </div>
                  {mostVisitedDining.length === 0 ? (
                    <p className="text-slate-300 text-xs italic text-center py-8">No reviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {mostVisitedDining.slice(0, 10).map((d: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0"
                            style={{
                              background: POINT_COLORS[idx % POINT_COLORS.length],
                              color: '#fff',
                            }}>
                            {idx + 1}
                          </span>
                          <span className="font-black text-sm text-slate-800 uppercase tracking-tight flex-1 min-w-0 truncate">{d.name}</span>
                          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex-shrink-0">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="text-[11px] font-black text-slate-900">{d.avgRating}</span>
                          </div>
                          <div className="w-40 hidden sm:block h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min((d.avgRating / 5) * 100, 100)}%`,
                                background: POINT_COLORS[idx % POINT_COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-black text-slate-500 w-14 text-right flex-shrink-0">
                            {d.count} review{d.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                  {['all', 'destination', 'dining', 'souvenir'].map(f => (
                    <button key={f} onClick={() => setReviewFilter(f)}
                      className={`px-5 py-2.5 rounded-xl font-black text-sm capitalize transition-all ${
                        reviewFilter === f ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-700'
                      }`}>
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[5,4,3,2,1].slice(0,4).map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    return (
                      <div key={star} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          {Array.from({length: star}).map((_,i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                        </div>
                        <div className="text-3xl font-black text-slate-900">{count}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{star}-Star Reviews</div>
                      </div>
                    );
                  })}
                </div>

                {/* Review Cards */}
                {reviews.filter(r => reviewFilter === 'all' || r.item_type === reviewFilter).length === 0 ? (
                  <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-100">
                    <Star size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No reviews yet</p>
                    <p className="text-slate-400 text-sm font-medium mt-2">Reviews will appear here when tourists scan QR codes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reviews
                      .filter(r => reviewFilter === 'all' || r.item_type === reviewFilter)
                      .map((r: any, i: number) => (
                        <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-black text-slate-900 text-base">{r.reviewer_name || 'Anonymous'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.item_type}</span>
                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase">
                                  📱 QR Scanner
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={14} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                              ))}
                            </div>
                          </div>
                          <p className="font-black text-sm text-rose-600 uppercase tracking-tight mb-2">{r.item_name}</p>
                          {r.comment && <p className="text-slate-600 text-sm font-medium leading-relaxed italic bg-slate-50 rounded-xl p-3 border border-slate-100">"{r.comment}"</p>}
                          <p className="text-slate-300 text-[10px] font-bold mt-3">{new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <button
                            onClick={() => deleteReview(r)}
                            className="mt-4 w-full bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                          >
                            Remove Review
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qr_generator' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">QR Code Generator</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Generate and download QR codes for tourist destinations &amp; dining hubs</p>
                </div>

                {/* ── SHORES & RESORTS SECTION (ALL 15 BEACHES) ── */}
                {(() => {
                  const CATEGORY_STYLES: Record<string, { badge: string; hover: string; text: string }> = {
                    Beach: { badge: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-600' },
                    Resort: { badge: 'bg-blue-600', hover: 'hover:bg-blue-600', text: 'text-blue-600' },
                    Hotel: { badge: 'bg-purple-600', hover: 'hover:bg-purple-600', text: 'text-purple-600' },
                    Falls: { badge: 'bg-cyan-600', hover: 'hover:bg-cyan-600', text: 'text-cyan-600' },
                    Landmark: { badge: 'bg-amber-600', hover: 'hover:bg-amber-600', text: 'text-amber-600' },
                  };
                  const SHORES = [
                    { id: "sd-bonbon",    name: "Bonbon Beach",         location: "Brgy. Lonos",      tag: "Sandbar",         type: "Natural", category: "Beach",  image: "/beach&resorts/bonbon.jpg" },
                    { id: "sd-peable",    name: "Pebble Walk Beach Resort", location: "Brgy. Ginablan",   tag: "Top Rated",       type: "Resort",  category: "Resort", image: "/beach&resorts/peabble.jpg" },
                    { id: "sd-tiamban",   name: "Tiamban Beach",        location: "Brgy. Lonos",      tag: "Family Friendly", type: "Natural", category: "Beach",  image: "/beach&resorts/tiamban.jpg" },
                    { id: "sd-talipasak", name: "Talipasak Beach",      location: "Brgy. Ginablan",   tag: "Hidden Gem",      type: "Natural", category: "Beach",  image: "/beach&resorts/talipasak.jpg" },
                    { id: "sd-lamao",     name: "Lamao Beach Resort",   location: "Logbon Island",    tag: "Pristine",        type: "Natural", category: "Resort", image: "/beach&resorts/lamao.jpg" },
                    { id: "sd-dc-logbon", name: "DC Munting Paraiso",   location: "Brgy. Agnay",      tag: "Island Favorite", type: "Natural", category: "Resort", image: "/beach&resorts/dc.jpg" },
                    { id: "sd-coco",      name: "Coco Cabana",          location: "Logbon Island",    tag: "Quiet Retreat",   type: "Natural", category: "Resort", image: "/beach&resorts/coco.jpg" },
                    { id: "sd-reggae",    name: "Reggae Vibes Romblon", location: "Agpanabat",        tag: "Budget Friendly", type: "Resort",  category: "Hotel",  image: "/beach&resorts/reggae.jpg" },
                    { id: "sd-robinson",  name: "Robinson's Cove",      location: "Brgy. Lonos",      tag: "Photogenic",      type: "Natural", category: "Beach",  image: "/beach&resorts/robinson.jpg" },
                    { id: "sd-horizon",   name: "Horizon Hotel Romblon", location: "Brgy. Lonos",      tag: "Sea View",        type: "Resort",  category: "Hotel",  image: "/beach&resorts/horizon1.jpg" },
                    { id: "sd-libtong", name: "Libtong Falls", location: "Sablayan Point", tag: "Waterfall", type: "Falls", category: "Falls", image: "/beach&resorts/libtong.jpg" },
                    { id: "sd-kipot", name: "Kipot River", location: "SE Romblon Island", tag: "River Canyon", type: "Falls", category: "Falls", image: "/beach&resorts/kipot.jpg" },
                    { id: "sd-fort-san-andres", name: "Fort San Andres", location: "Town Proper", tag: "Heritage", type: "Landmark", category: "Landmark", image: "/beach&resorts/fort.jpg" },
                    { id: "sd-cathedral", name: "Saint Joseph Cathedral", location: "Town Proper", tag: "National Treasure", type: "Landmark", category: "Landmark", image: "/beach&resorts/cathedral.jpg" },
                    { id: "sd-shopping", name: "Romblon Shopping Center", location: "Town Proper", tag: "Marble Souvenirs", type: "Landmark", category: "Landmark", image: "/beach&resorts/shopping1.jpg" },
                  ];
                  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://roam-blon.vercel.app';
                  return (
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                      {/* Section Header */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                          <QrCode size={24} className="text-rose-500" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-rose-600">Tourist Destinations</h3>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{SHORES.length} locations · Click QR to open the tourist page</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {SHORES.map(shore => {
                          const qrUrl = `${BASE}/qr?type=destination&id=${shore.id}`;
                          const style = CATEGORY_STYLES[shore.category] || CATEGORY_STYLES.Beach;
                          return (
                            <div key={shore.id} className="group bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                              {/* Beach thumbnail */}
                              <div className="h-36 overflow-hidden relative flex-shrink-0">
                                <img src={shore.image} alt={shore.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {/* Category badge */}
                                <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${style.badge} text-white`}>
                                  {shore.category}
                                </div>
                                {/* Tag badge */}
                                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm bg-white/90 text-slate-700">
                                  {shore.tag}
                                </div>
                              </div>

                              {/* Card body */}
                              <div className="p-4 flex flex-col flex-1 gap-3">
                                {/* Name & location */}
                                <div>
                                  <div className={`flex items-center gap-1 ${style.text} text-[9px] font-black uppercase tracking-widest mb-1`}>
                                    <MapPin size={9} /> {shore.location}
                                  </div>
                                  <h4 className="font-black text-slate-900 text-sm leading-tight uppercase tracking-tight">{shore.name}</h4>
                                </div>

                                {/* QR Code — rendered inline, clickable */}
                                <a
                                  href={qrUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Open QR page for ${shore.name}`}
                                  className="self-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all group/qr"
                                  id={`qr-link-${shore.id}`}
                                >
                                  <QRCodeSVG
                                    value={qrUrl}
                                    size={110}
                                    level="H"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                    imageSettings={{
                                      src: "/logo.jpg",
                                      height: 24,
                                      width: 24,
                                      excavate: true,
                                    }}
                                  />
                                </a>

                                {/* Actions */}
                                <div className="mt-auto flex flex-col gap-2">
                                  <a
                                    href={qrUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`view-page-${shore.id}`}
                                    className={`w-full py-2.5 bg-slate-50 ${style.text} text-[10px] font-black uppercase tracking-widest rounded-xl ${style.hover} hover:text-white transition-all text-center`}
                                  >
                                    View QR Page
                                  </a>
                                  <a
                                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&margin=10&format=png`}
                                    download={`qr-${shore.id}.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`download-qr-${shore.id}`}
                                    className={`w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl ${style.hover} transition-all text-center`}
                                  >
                                    ↓ Download QR
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── DINING HUBS SECTION ── */}
                {(() => {
                  const STATIC_DINING = [
                    { id: "bistro", name: "Marble City Café & Bistro", location: "Town Proper", address: "Across Freedom Park, Town Proper, Romblon", category: "Café & Bistro", image_url: "/dining/bistro.jpg" },
                    { id: "el", name: "El Krimphoff Resort & Restaurant", location: "Brgy. Lonos", address: "Sitio Babangtan, Brgy. Lonos, Romblon", category: "Restaurant", image_url: "/dining/el.jpg" },
                    { id: "gangnam", name: "Gangnam Korean Grill", location: "Brgy. Mapula", address: "Sitio Batiano, Brgy. Mapula, Romblon", category: "Korean BBQ", image_url: "/dining/gangnam.jpg" },
                    { id: "horizon", name: "Horizon Seaside Restaurant", location: "Brgy. Lonos", address: "Sitio Upper Lusod, Brgy. Lonos", category: "Seafood & Grill", image_url: "/dining/horizon.jpg" },
                    { id: "italian", name: "Italian Trattoria", location: "Republika St, Brgy. 1 Poblacion", address: "Republika St, Brgy. 1 Poblacion, Romblon", category: "Italian & Pizza", image_url: "/dining/italian.jpg" },
                    { id: "mamalois", name: "Mama Lois Kitchen", location: "Town Proper", address: "Beside Romblon Port Terminal, Town Proper, Romblon", category: "Local Eat", image_url: "/dining/mamalois.jpg" },
                    { id: "ocean", name: "Seaview Restobar", location: "Brgy. Lonos", address: "Sitio Suwa, Brgy. Lonos, Romblon", category: "Seafood", image_url: "/dining/ocean.jpg" },
                    { id: "panublion", name: "Panublion Heritage Diner", location: "Town Proper", address: "Republika St, Town Proper, Romblon", category: "Heritage Cuisine", image_url: "/dining/panublion.jpg" },
                    { id: "reggae", name: "Reggae Bar & Grill", location: "Agpanabat", address: "Agpanabat, Romblon", category: "Bar & Grill", image_url: "/dining/reggae.jpg" },
                    { id: "sunbird", name: "Sunbird Ridge Coffee Shop", location: "Brgy. Lonos", address: "Ridge above Tiamban Beach, Brgy. Lonos", category: "Café", image_url: "/foods/sarsa.webp" },
                    { id: "yurich", name: "Yurich Hotel & Caffeinate Co.", location: "Brgy. Bagacay", address: "Sitio Binagong, Brgy. Bagacay", category: "Local Restaurant", image_url: "/dining/yurich.jpg" },
                  ];
                  const DINING_ITEMS = allServices.dining.length > 0 ? allServices.dining : STATIC_DINING;
                  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://roam-blon.vercel.app';
                  return (
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                      {/* Section Header */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                          <Building size={24} className="text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-orange-600">Dining Spots</h3>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{DINING_ITEMS.length} establishments · Click QR to open the tourist page</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {DINING_ITEMS.map(dining => {
                          const qrUrl = `${BASE}/qr?type=dining&id=${dining.id}`;
                          const img = dining.image_url || dining.image || "/foods/inaslum.webp";
                          const style = { badge: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-600' };
                          return (
                            <div key={dining.id} className="group bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                              {/* Thumbnail */}
                              <div className="h-36 overflow-hidden relative flex-shrink-0">
                                <img src={img} alt={dining.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {/* Category badge */}
                                <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${style.badge} text-white`}>
                                  Dining
                                </div>
                                {/* Tag badge */}
                                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm bg-white/90 text-slate-700">
                                  {dining.category || "Dining"}
                                </div>
                              </div>

                              {/* Card body */}
                              <div className="p-4 flex flex-col flex-1 gap-3">
                                <div>
                                  <div className={`flex items-center gap-1 ${style.text} text-[9px] font-black uppercase tracking-widest mb-1`}>
                                    <MapPin size={9} /> {dining.address || dining.location || "Romblon"}
                                  </div>
                                  <h4 className="font-black text-slate-900 text-sm leading-tight uppercase tracking-tight">{dining.name}</h4>
                                </div>

                                {/* QR Code — rendered inline */}
                                <a
                                  href={qrUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Open QR page for ${dining.name}`}
                                  className="self-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all group/qr"
                                  id={`qr-link-dining-${dining.id}`}
                                >
                                  <QRCodeSVG
                                    value={qrUrl}
                                    size={110}
                                    level="H"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                    imageSettings={{
                                      src: "/logo.jpg",
                                      height: 24,
                                      width: 24,
                                      excavate: true,
                                    }}
                                  />
                                </a>

                                {/* Actions */}
                                <div className="mt-auto flex flex-col gap-2">
                                  <a
                                    href={qrUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`view-page-dining-${dining.id}`}
                                    className={`w-full py-2.5 bg-slate-50 ${style.text} text-[10px] font-black uppercase tracking-widest rounded-xl ${style.hover} hover:text-white transition-all text-center`}
                                  >
                                    View QR Page
                                  </a>
                                  <a
                                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&margin=10&format=png`}
                                    download={`qr-dining-${dining.id}.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`download-qr-dining-${dining.id}`}
                                    className={`w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl ${style.hover} transition-all text-center`}
                                  >
                                    ↓ Download QR
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <CustomQRTool />
              </div>
            )}


          </div>
        </main>
      </div>

      {/* --- MANAGEMENT MODALS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-all">
              <X size={24} className="text-slate-400" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                {activeModal === 'destination' ? <MapPin size={28} /> : 
                 activeModal === 'dining' ? <Building size={28} /> : 
                 activeModal === 'souvenir' ? <PlusCircle size={28} /> : <AlertCircle size={28} />}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                  {editingItem ? "Edit" : "Add New"} {activeModal}
                </h3>
                <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest font-black opacity-50">Content Management Service</p>
              </div>
            </div>

            <div className="space-y-6">
              {activeModal === 'destination' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput label="Destination Name" value={destinationForm.name} onChange={(v: string) => setDestinationForm({...destinationForm, name: v})} placeholder="e.g. Bonbon Beach" />
                  <FormInput label="Category" value={destinationForm.category} onChange={(v: string) => setDestinationForm({...destinationForm, category: v})} placeholder="Beaches, Landmarks, etc." />
                  <div className="md:col-span-2">
                    <FormInput label="Full Address / Location" value={destinationForm.location} onChange={(v: string) => setDestinationForm({...destinationForm, location: v})} placeholder="e.g. Brgy. Lonos, Romblon Island" />
                  </div>
                  <FormInput label="Contact Number" value={(destinationForm as any).contact || ""} onChange={(v: string) => setDestinationForm({...destinationForm, contact: v} as any)} placeholder="+63 917 123 4567" />
                  <div className="md:col-span-2">
                    <FormInput label="Image URL" value={destinationForm.image_url} onChange={(v: string) => setDestinationForm({...destinationForm, image_url: v})} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2">
                    <FormTextArea label="Detailed Description" value={destinationForm.description} onChange={(v: string) => setDestinationForm({...destinationForm, description: v})} placeholder="Tell us about this spot..." />
                  </div>
                  <div className="md:col-span-2">
                    <FormTextArea label="How To Get There (Route Guide)" value={(destinationForm as any).howToGetThere || ""} onChange={(v: string) => setDestinationForm({...destinationForm, howToGetThere: v} as any)} placeholder="Step-by-step route guide via tricycle, boat, walking..." />
                  </div>
                </div>
              )}

              {activeModal === 'dining' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormInput label="Restaurant Name" value={diningForm.name} onChange={(v: string) => setDiningForm({...diningForm, name: v})} placeholder="e.g. JD & G Italian Restaurant" />
                  </div>
                  <FormInput label="Category" value={diningForm.category} onChange={(v: string) => setDiningForm({...diningForm, category: v})} placeholder="e.g. Fine Dining, Local Eat" />
                  <FormInput label="Address" value={diningForm.address} onChange={(v: string) => setDiningForm({...diningForm, address: v})} placeholder="Street, Barangay" />
                  <FormInput label="Opening Time" value={diningForm.opening_time} onChange={(v: string) => setDiningForm({...diningForm, opening_time: v})} placeholder="08:00 AM" />
                  <FormInput label="Closing Time" value={diningForm.closing_time} onChange={(v: string) => setDiningForm({...diningForm, closing_time: v})} placeholder="10:00 PM" />
                  <div className="md:col-span-2">
                    <FormInput label="Image URL" value={diningForm.image_url} onChange={(v: string) => setDiningForm({...diningForm, image_url: v})} placeholder="https://..." />
                    <FormTextArea label="Description" value={diningForm.description} onChange={(v: string) => setDiningForm({...diningForm, description: v})} placeholder="What's special about this place?" />
                  </div>
                </div>
              )}

              {activeModal === 'souvenir' && (
                <div className="grid grid-cols-1 gap-6">
                  <FormInput label="Product Name" value={souvenirForm.name} onChange={(v: string) => setSouvenirForm({...souvenirForm, name: v})} placeholder="e.g. Marble Mortar & Pestle" />
                  <FormInput label="Category" value={souvenirForm.category} onChange={(v: string) => setSouvenirForm({...souvenirForm, category: v})} placeholder="e.g. SOUVENIR, TABLE" />
                  <FormInput label="Price (₱)" value={souvenirForm.price} onChange={(v: string) => setSouvenirForm({...souvenirForm, price: v})} placeholder="500" />
                  <FormInput label="Image URL" value={souvenirForm.image_url} onChange={(v: string) => setSouvenirForm({...souvenirForm, image_url: v})} placeholder="https://..." />
                </div>
              )}

              {activeModal === 'emergency' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormInput label="Hotline Label" value={emergencyForm.label} onChange={(v: string) => setEmergencyForm({...emergencyForm, label: v})} placeholder="e.g. Romblon Provincial Hospital" />
                  </div>
                  <FormInput label="Contact Number" value={emergencyForm.phone} onChange={(v: string) => setEmergencyForm({...emergencyForm, phone: v})} placeholder="0912..." />
                  <FormInput label="Icon Key" value={emergencyForm.icon_key} onChange={(v: string) => setEmergencyForm({...emergencyForm, icon_key: v})} placeholder="ShieldCheck, Hospital, etc." />
                  <div className="md:col-span-2">
                    <FormInput label="Color Key" value={emergencyForm.color_key} onChange={(v: string) => setEmergencyForm({...emergencyForm, color_key: v})} placeholder="red, blue, rose, etc." />
                  </div>
                </div>
              )}

                <div className="flex gap-3">
                  {editingItem && (
                    <button
                      onClick={() => {
                        const targetName = activeModal === 'destination' ? destinationForm.name : activeModal === 'dining' ? diningForm.name : activeModal === 'emergency' ? emergencyForm.label : 'Item';
                        handleDeleteResource(activeModal, editingItem.id, targetName);
                      }}
                      disabled={isSubmitting}
                      className="px-6 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button 
                    onClick={() => handleAddResource(activeModal)}
                    disabled={isSubmitting}
                    className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (editingItem ? "Updating Item..." : "Adding to System...") : (editingItem ? "Update Item" : "Save to Database")}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
      
      {qrItem && <QRItemModal item={qrItem} onClose={() => setQrItem(null)} />}
    </div>
  );
}

// Form Helpers
function FormInput({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-rose-300 focus:bg-white transition-all shadow-inner"
      />
    </div>
  );
}

function FormTextArea({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{label}</label>
      <textarea 
        rows={3}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-rose-300 focus:bg-white transition-all shadow-inner resize-none"
      />
    </div>
  );
}

// Sub-components
function SidebarLink({ icon, label, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
      <span className={active ? "text-blue-600" : "text-slate-300"}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
      </span>
      {label}
    </button>
  );
}

function destinationImageFallback(id: string, name: string) {
  const norm = `${id} ${name}`.toLowerCase();
  if (norm.includes('peable') || norm.includes('pebble') || norm.includes('pebble walk')) return "/beach&resorts/peabble.jpg";
  if (norm.includes('talipasak') || norm.includes('san pedro')) return "/beach&resorts/talipasak.jpg";
  return "/romblon.jpg";
}

function StatCard({ label, value, icon, color, isDecimal = false, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-[#EBEBEB] shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 ${color}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{label}</p>
      <div className="text-3xl md:text-5xl font-black text-slate-900 italic leading-none tracking-tighter">
        {isDecimal ? value.toFixed(1) : value.toLocaleString()}
      </div>
    </button>
  );
}

function QuickActionButton({ label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-6 py-5 bg-[#FBF9F7] rounded-full hover:bg-rose-600 hover:text-white transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-rose-600 group-hover:text-white">{icon}</span>
        <span className="font-black text-sm">{label}</span>
      </div>
      <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
    </button>
  );
}

function ActivityItem({ name, action, time }: any) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
      <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-white group-hover:shadow-md transition-all">
        {name.charAt(0)}
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-[#111] leading-tight">{name}</p>
        <p className="text-[11px] text-slate-500 font-medium">{action}</p>
      </div>
      <div className="text-right text-[10px] font-black uppercase text-slate-300">
        {time}
      </div>
    </div>
  );
}

// Legacy TopList kept for backward compat (no longer used directly)
function TopList({ title, icon, items, color }: any) {
  return <TopRatedCard title={title} icon={icon} items={items} accentColor={color} />;
}

function TopRatedCard({ title, icon, items, accentColor }: any) {
  const rankConfig = [
    { label: '#1', bg: 'bg-amber-400', text: 'text-white', ring: 'ring-amber-300' },
    { label: '#2', bg: 'bg-slate-400', text: 'text-white', ring: 'ring-slate-300' },
    { label: '#3', bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-300' },
    { label: '#4', bg: 'bg-white', text: 'text-slate-500', ring: 'ring-slate-200' },
    { label: '#5', bg: 'bg-white', text: 'text-slate-500', ring: 'ring-slate-200' },
  ];

  const accentMap: any = {
    rose: { header: 'bg-rose-50 border-rose-100 text-rose-500', bar: 'bg-rose-400', badge: 'bg-rose-50 text-rose-600 border-rose-100' },
    orange: { header: 'bg-orange-50 border-orange-100 text-orange-500', bar: 'bg-orange-400', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
    blue: { header: 'bg-blue-50 border-blue-100 text-blue-500', bar: 'bg-blue-400', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  };
  const accent = accentMap[accentColor] || accentMap.blue;

  const maxCount = items.length > 0 ? items[0].count : 1;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`flex items-center gap-3 px-8 py-6 border-b ${accent.header}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accent.header}`}>
          {icon}
        </div>
        <h4 className="text-base font-black uppercase tracking-tighter">{title}</h4>
        {items.length > 0 && (
          <span className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${accent.badge}`}>
            {items.length} ranked
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Star size={36} className="text-slate-100" />
            <p className="text-slate-300 text-xs font-black uppercase tracking-widest text-center">No QR reviews yet</p>
            <p className="text-slate-300 text-[10px] text-center">Rankings will appear as tourists scan QR codes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item: any, idx: number) => {
              const rank = rankConfig[idx] || rankConfig[4];
              const pct = Math.round((item.count / maxCount) * 100);
              const fullStars = Math.round(item.avgRating);
              return (
                <div key={idx} className="group hover:bg-slate-50 rounded-2xl p-3 -mx-2 transition-all cursor-default">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Rank badge */}
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black ring-2 ${rank.bg} ${rank.text} ${rank.ring} flex-shrink-0 shadow-sm`}>
                      {idx + 1}
                    </div>
                    {/* Name */}
                    <span className="font-black text-sm text-slate-800 uppercase tracking-tight truncate flex-1">
                      {item.name}
                    </span>
                    {/* Avg rating pill */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex-shrink-0">
                      <Star size={9} className="text-amber-500 fill-amber-500" />
                      <span className="text-[11px] font-black text-slate-900">{item.avgRating}</span>
                    </div>
                  </div>

                  {/* Star row */}
                  <div className="flex items-center gap-1 ml-10 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10} className={s <= fullStars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                    ))}
                    <span className="text-[9px] font-bold text-slate-400 ml-1">
                      {item.count} review{item.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Visit count progress bar */}
                  <div className="ml-10">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${accent.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RATINGS & VISIT ANALYTICS GRAPH ──
const POINT_COLORS = [
  '#f43f5e', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#eab308',
  '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#06b6d4', '#f59e0b',
  '#ef4444', '#22c55e', '#0ea5e9', '#a855f7', '#facc15', '#2dd4bf',
  '#fb7185', '#fb923c', '#4ade80', '#60a5fa', '#c084fc', '#fde047',
  '#5eead4', '#f472b6', '#818cf8', '#a3e635', '#38bdf8', '#fbbf24',
];

function AnalyticsGraph({ title, subtitle, items, accentColor, byVisits = false, byCount = false, hideLegend = false }: any) {
  const accentMap: any = {
    rose: { header: 'bg-rose-50 border-rose-100 text-rose-500', stroke: '#f43f5e', strokeSoft: '#fb7185', fill: '#ffe4e6', badge: 'bg-rose-50 text-rose-600 border-rose-100' },
    orange: { header: 'bg-orange-50 border-orange-100 text-orange-500', stroke: '#f97316', strokeSoft: '#fb923c', fill: '#ffedd5', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
    blue: { header: 'bg-blue-50 border-blue-100 text-blue-500', stroke: '#3b82f6', strokeSoft: '#60a5fa', fill: '#dbeafe', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
    emerald: { header: 'bg-emerald-50 border-emerald-100 text-emerald-500', stroke: '#10b981', strokeSoft: '#34d399', fill: '#d1fae5', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  };
  const accent = accentMap[accentColor] || accentMap.blue;

  const totalVisits = items.reduce((acc: number, i: any) => acc + (i.count || 0), 0);

  const W = 520;
  const H = 205;
  const PADX = 34;
  const PADTOP = 18;
  const PADBOT = 46;
  const maxRating = 5;
  const top = items.find((i: any) => (i.count || 0) > 0);

  // Axis scale: fixed 0-100 for both review counts and visit counts
  const maxValue = 100;
  const axisSteps = 10;
  const valueOf = (item: any) => byVisits
    ? (() => {
        // Plot raw count against the fixed 0-100 axis (capped at 100),
        // so counts grow from 0-10-20… instead of jumping straight to 100.
        return Math.min(item.count || 0, 100);
      })()
    : byCount
    ? Math.min(item.count || 0, 100)
    : (() => {
        // Convert 0-5 star rating to a 0-100 percentage
        return Math.min(((item.avgRating || 0) / maxRating) * 100, 100);
      })();

  // Only plot destinations that have been visited (line = real-time scans)
  const plotted = items.filter((i: any) => (i.count || 0) > 0);
  const points: { x: number; y: number; item: any; color: string }[] = plotted.map((item: any, idx: number) => {
    const x = plotted.length > 1 ? PADX + (idx / (plotted.length - 1)) * (W - PADX * 2) : W / 2;
    const y = PADTOP + (1 - (valueOf(item) / maxValue)) * (H - PADTOP - PADBOT);
    return { x, y, item, color: POINT_COLORS[idx % POINT_COLORS.length] };
  });

  // Start the line from the 0 level on the far left so it rises from the bottom
  const linePoints = points.length > 0
    ? [{ x: PADX, y: H - PADBOT, item: null, color: points[0].color }, ...points]
    : points;

  const linePath = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = linePoints.length > 0
    ? `${linePath} L ${linePoints[linePoints.length - 1].x.toFixed(1)},${H - PADBOT} L ${linePoints[0].x.toFixed(1)},${H - PADBOT} Z`
    : '';

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-3 px-8 py-6 border-b ${accent.header}`}>
        <div>
          <h4 className="text-base font-black uppercase tracking-tighter">{title}</h4>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{subtitle}</p>
        </div>
        <span className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${accent.badge}`}>
          {totalVisits} visits
        </span>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <BarChart3 size={36} className="text-slate-100" />
            <p className="text-slate-300 text-xs font-black uppercase tracking-widest text-center">No scan reviews yet</p>
            <p className="text-slate-300 text-[10px] text-center">Visit graphs will appear as tourists scan QR codes</p>
          </div>
        ) : (
          <div>
            {/* Line chart */}
            <div className="relative">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`area-${accentColor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent.stroke} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={accent.stroke} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {points.length === 0 && (
                  <text x={W / 2} y={H / 2} fontSize="10" fontWeight="700" fill="#cbd5e1" textAnchor="middle">
                    Waiting for QR scans…
                  </text>
                )}
                {Array.from({ length: axisSteps + 1 }, (_, k) => k).map(g => {
                  const gy = PADTOP + (1 - g / axisSteps) * (H - PADTOP - PADBOT);
                  return (
                    <line key={g} x1={PADX} y1={gy} x2={W - PADX} y2={gy} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  );
                })}
                {Array.from({ length: axisSteps + 1 }, (_, k) => k).map(g => {
                  const gy = PADTOP + (1 - g / axisSteps) * (H - PADTOP - PADBOT);
                  const val = g * 10;
                  return (
                    <text key={g} x={PADX - 4} y={gy + 3} fontSize="8" fontWeight="700" fill="#cbd5e1" textAnchor="end">
                      {val}
                    </text>
                  );
                })}
                {areaPath && <path d={areaPath} fill={`url(#area-${accentColor})`} />}
                {points.slice(1).map((p, i) => {
                  const prev = points[i];
                  return (
                    <line
                      key={`seg-${i}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={p.x}
                      y2={p.y}
                      stroke={p.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  );
                })}
                {points.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="5" fill="#fff" stroke={p.color} strokeWidth="3" />
                ))}
                {/* X-axis markers: colored circle per destination */}
                {points.map((p, idx) => (
                  <g key={`x-circle-${idx}`}>
                    <line
                      x1={p.x}
                      y1={H - PADBOT}
                      x2={p.x}
                      y2={H - PADBOT + 6}
                      stroke={p.color}
                      strokeWidth="2"
                    />
                    <circle
                      cx={p.x}
                      cy={H - PADBOT + 12}
                      r="6"
                      fill={p.color}
                      stroke="#fff"
                      strokeWidth="2"
                      opacity="1"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Organized legend — lists every destination in its own color */}
            {!hideLegend && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 min-w-0">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: POINT_COLORS[idx % POINT_COLORS.length] }} />
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-600 truncate">{it.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 flex-shrink-0 ml-auto">
                      {byVisits ? (it.count || 0) : `${it.avgRating || 0}★`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {top && (
              <div className={`mt-4 px-4 py-3 rounded-2xl border ${accent.header}`}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{byVisits ? 'Most visited' : 'Highest rated'}</p>
                <p className="font-black uppercase tracking-tighter text-sm text-slate-900 mt-0.5">{top.name}</p>
                <p className="text-[10px] font-black text-slate-500 mt-0.5">
                  {top.count} visit{top.count !== 1 ? 's' : ''} · {top.avgRating} avg rating
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CUSTOM QR CODE GENERATOR TOOL ──
function CustomQRTool() {
  const [title, setTitle] = useState("ROAM-BLON Custom QR");
  const [url, setUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://roam-blon.vercel.app');
  const [badge, setBadge] = useState("Official Link");
  const [copied, setCopied] = useState(false);

  const downloadQR = () => {
    if (!url) return;
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}&margin=10&format=png`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `qr-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
    a.target = "_blank";
    a.click();
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
              <QrCode size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Custom QR Creator</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Enter any link or text to generate a branded QR code</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">QR Title / Label</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Tourist Information Desk"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Target URL or Text</label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tag / Badge Text</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="e.g. Official Link"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={downloadQR}
              disabled={!url}
              className="flex-1 min-w-[140px] py-3.5 bg-slate-900 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode size={16} /> Download PNG
            </button>
            <button
              onClick={copyUrl}
              disabled={!url}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center text-center space-y-5">
          <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-widest">
            {badge || "Live Preview"}
          </span>

          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight max-w-xs">{title || "Untitled QR"}</h4>

          <div className="bg-white p-5 rounded-3xl shadow-md border border-slate-100 relative group">
            {url ? (
              <QRCodeSVG
                value={url}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
                imageSettings={{
                  src: "/logo.jpg",
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-300 font-bold text-xs">
                Enter URL to preview
              </div>
            )}
          </div>

          <p className="text-[11px] font-bold text-slate-400 truncate max-w-xs">{url || "No URL specified"}</p>
        </div>
      </div>
    </div>
  );
}
