"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";

interface TourGuide {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  photo_url?: string;
  profile_image_url?: string;
  specialties?: string;
  specialty?: string;
  rate_per_day?: number;
  bio?: string;
  rating?: number;
  status?: string;
  is_available?: boolean;
  contact_number?: string;
  phone?: string;
  languages?: string[] | string;
  experience_years?: number;
}

interface BookingConfirmation {
  reference_code: string;
  guide_name: string;
  tour_date: string;
  pax: number;
}

const STATIC_GUIDES: TourGuide[] = [
  {
    id: "sg-marco",
    name: "Marco Dela Cruz",
    full_name: "Marco Dela Cruz",
    photo_url: "/guides/boy.png",
    email: "marco@roam-blon.com",
    contact_number: "+63 917 555 1243",
    languages: ["Filipino", "English", "Cebuano"],
    specialties: "Island Hopping & Sandbars",
    rate_per_day: 1500,
    bio: "Born and raised in Romblon, Marco has spent over 8 years guiding travelers through the island's best-kept sandbar and snorkeling spots.",
    rating: 4.9,
    status: "approved",
    is_available: true,
  },
  {
    id: "sg-liza",
    name: "Liza Fajardo",
    full_name: "Liza Fajardo",
    photo_url: "/guides/woman.png",
    email: "liza@roam-blon.com",
    contact_number: "+63 917 555 2109",
    languages: ["Filipino", "English"],
    specialties: "Heritage & Marble Sites",
    rate_per_day: 1200,
    bio: "A certified local historian, Liza specializes in walking tours through Romblon's marble quarries and centuries-old churches.",
    rating: 4.8,
    status: "approved",
    is_available: true,
  },
  {
    id: "sg-jun",
    name: "Jun Rosales",
    full_name: "Jun Rosales",
    photo_url: "/guides/boy.png",
    email: "jun@roam-blon.com",
    contact_number: "+63 917 555 3397",
    languages: ["Filipino", "English", "Japanese"],
    specialties: "Diving & Marine Tours",
    rate_per_day: 1800,
    bio: "A licensed dive instructor with a passion for marine conservation, Jun leads reef tours and beginner-friendly diving trips around Logbon Island.",
    rating: 5.0,
    status: "approved",
    is_available: true,
  },
  {
    id: "sg-carlo",
    name: "Carlo Versoza",
    full_name: "Carlo Versoza",
    photo_url: "/guides/boy.png",
    email: "carlo@roam-blon.com",
    contact_number: "+63 917 555 4462",
    languages: ["Filipino", "English", "Hiligaynon"],
    specialties: "Waterfalls & Hiking",
    rate_per_day: 1300,
    bio: "An avid trekker and nature lover, Carlo guides adventurous visitors through Romblon's lush mountain trails, hidden waterfalls, and jungle paths that most tourists never get to see.",
    rating: 4.7,
    status: "approved",
    is_available: true,
  },
  {
    id: "sg-ana",
    name: "Ana Reyes",
    full_name: "Ana Reyes",
    photo_url: "/guides/woman.png",
    email: "ana@roam-blon.com",
    contact_number: "+63 917 555 5531",
    languages: ["Filipino", "English", "German"],
    specialties: "Snorkeling & Photography",
    rate_per_day: 1600,
    bio: "A certified underwater photographer and snorkeling instructor, Ana brings the vibrant coral reefs of Romblon to life. She crafts personalized photo-tour packages to help you capture the island beautifully.",
    rating: 4.9,
    status: "approved",
    is_available: true,
  },
];

function generateReferenceCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RB-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function TourGuideBooking({ tourist, initialDestination = "", compact = false }: { tourist: any; initialDestination?: string; compact?: boolean }) {
  const [guides, setGuides] = useState<TourGuide[]>(STATIC_GUIDES);
  const [loading, setLoading] = useState(true);

  const [selectedGuide, setSelectedGuide] = useState<TourGuide | null>(null);

  const [tourDate, setTourDate] = useState("");
  const [tourTime, setTourTime] = useState("");
  const [dayOfTour, setDayOfTour] = useState("Day 1");
  const [destinations, setDestinations] = useState(initialDestination || "");
  const [pax, setPax] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    async function fetchGuides() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tour_guides")
          .select("*")
          .eq("status", "approved");

        if (error) throw error;
        if (data && data.length > 0) {
          // Normalize guide object field names
          const formatted = data.map((g: any) => ({
            ...g,
            name: g.full_name || g.name,
            photo_url: g.profile_image_url || g.photo_url,
            specialties: Array.isArray(g.specialty) ? g.specialty.join(", ") : (g.specialty || g.specialties),
            languages: Array.isArray(g.languages) ? g.languages : (g.languages ? g.languages.split(",").map((s: string) => s.trim()) : []),
            is_available: g.is_available !== undefined ? g.is_available : true
          }));
          setGuides(formatted);
        }
      } catch (err) {
        console.error("Failed to load tour guides", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, []);

  const openBookingForm = (guide: TourGuide) => {
    if (guide.is_available === false) return;
    setSelectedGuide(guide);
    setTourDate("");
    setTourTime("");
    setDayOfTour("Day 1");
    setDestinations(initialDestination || "");
    setPax(1);
    setMessage("");
    setSubmitError("");
  };

  const closeBookingForm = () => {
    setSelectedGuide(null);
  };

  // Realtime + broadcast: keep local booking statuses in sync when admin accepts/declines
  useEffect(() => {
    const touristEmail = tourist?.email || "tourist@roam-blon.com";

    const syncLocalStatus = (updated: any) => {
      if (!updated?.id) return;
      const stored = JSON.parse(localStorage.getItem("roam_blon_tour_guide_bookings") || "[]");
      const synced = stored.map((b: any) => {
        const matches =
          b.id === updated.id ||
          (b.reference_code && updated.reference_code && b.reference_code === updated.reference_code) ||
          (b.guide_name === updated.guide_name && b.booking_date === updated.booking_date && b.tourist_email === updated.tourist_email);
        return matches ? { ...b, status: updated.status } : b;
      });
      localStorage.setItem("roam_blon_tour_guide_bookings", JSON.stringify(synced));
    };

    const channel = supabase
      .channel(`my-guide-bookings-${touristEmail}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tour_guide_bookings", filter: `tourist_email=eq.${touristEmail}` },
        (payload) => syncLocalStatus(payload.new as any)
      )
      .on('broadcast', { event: 'booking_status' }, ({ payload: p }: any) => {
        if (p && p.tourist_email === touristEmail) syncLocalStatus(p);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tourist?.email]);

  const handleSubmitBooking = async () => {
    if (!selectedGuide) return;
    if (!tourDate) {
      setSubmitError("Please choose a tour date.");
      return;
    }
    if (pax < 1) {
      setSubmitError("Number of people must be at least 1.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const referenceCode = generateReferenceCode();
    const guideName = selectedGuide.name || selectedGuide.full_name || "Tour Guide";
    const touristEmail = tourist?.email || "tourist@roam-blon.com";
    const totalPrice = (selectedGuide.rate_per_day || 1500) * pax;

    const touristName = tourist
      ? `${tourist.firstName || tourist.first_name || ''} ${tourist.lastName || tourist.last_name || ''}`.trim()
      : "Guest Explorer";

    const payload: any = {
      guide_name: guideName,
      tourist_email: touristEmail,
      tourist_name: touristName || "Guest Explorer",
      tourist_nationality: (tourist?.country && tourist.country !== "Local" && tourist.country !== "local")
        ? tourist.country
        : (tourist?.nationality === "foreign" ? "Foreign" : (tourist?.nationality ? tourist.nationality : null)),
      booking_date: tourDate,
      booking_time: tourTime || null,
      day_of_tour: dayOfTour || null,
      destinations: destinations.trim() || null,
      pax: Number(pax),
      total_price: Number(totalPrice),
      notes: message.trim() || null,
      status: "pending"
    };

    if (selectedGuide.id && /^[0-9a-fA-F-]{36}$/.test(selectedGuide.id)) {
      payload.guide_id = selectedGuide.id;
    }

    try {
      const { error } = await supabase.from("tour_guide_bookings").insert([payload]);
      if (error) {
        console.warn("Supabase insert warning, saving locally fallback:", error);
      }

      // Also persist to localStorage for instant local reflection
      const stored = JSON.parse(localStorage.getItem("roam_blon_tour_guide_bookings") || "[]");
      const newBooking = {
        id: referenceCode,
        guide_name: guideName,
        tourist_email: touristEmail,
        tourist_name: touristName || "Guest Explorer",
        tourist_nationality: (tourist?.country && tourist.country !== "Local" && tourist.country !== "local")
          ? tourist.country
          : (tourist?.nationality === "foreign" ? "Foreign" : (tourist?.nationality ? tourist.nationality : null)),
        booking_date: tourDate,
        booking_time: tourTime || null,
        day_of_tour: dayOfTour || null,
        destinations: destinations.trim() || null,
        pax: pax,
        total_price: totalPrice,
        notes: message.trim() || null,
        status: "pending",
        reference_code: referenceCode,
        created_at: new Date().toISOString()
      };
      stored.unshift(newBooking);
      localStorage.setItem("roam_blon_tour_guide_bookings", JSON.stringify(stored));

      // Notify admins instantly via dedicated broadcast channel (live toast)
      try {
        const chan = supabase.channel('admin-live-feed');
        await chan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chan.send({ type: 'broadcast', event: 'new_booking', payload: newBooking });
            supabase.removeChannel(chan);
          }
        });
      } catch { /* ignore */ }

      setGuides((currentGuides) =>
        currentGuides.map((guide) =>
          guide.id === selectedGuide.id
            ? { ...guide, is_available: false }
            : guide
        )
      );

      setConfirmation({
        reference_code: referenceCode,
        guide_name: guideName,
        tour_date: tourDate,
        pax,
      });
      setSelectedGuide(null);
    } catch (err) {
      console.error("Booking failed", err);
      setSubmitError("Something went wrong while saving your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeConfirmation = () => {
    setConfirmation(null);
  };

  return (
    <div className={compact ? "max-w-none" : "max-w-6xl mx-auto"}>
      {/* HEADER */}
      {!compact && (
        <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-100 mb-4">
          <Sparkles size={12} className="text-orange-500" />
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
            Local Experts
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
          Book A Tour Guide
        </h2>
        <p className="text-slate-500 font-medium text-sm mt-2 max-w-md mx-auto">
          Explore Romblon with a verified local guide who knows the island best.
        </p>
      </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-orange-400 animate-spin" />
          <p className="text-slate-400 font-bold text-sm">Loading tour guides…</p>
        </div>
      )}

      {/* GUIDE GRID */}
      {!loading && guides.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {guides.map((guide) => {
            const isAvailable = guide.is_available !== false;
            return (
              <div
                key={guide.id}
                className={`bg-white rounded-[1.25rem] overflow-hidden shadow-sm border ${isAvailable ? 'border-slate-100' : 'border-slate-200 opacity-80'} hover:shadow-md transition-all flex flex-col`}
              >
                {/* Card top: gradient bg + circle avatar */}
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 pt-8 pb-4 flex flex-col items-center">
                  {/* Circle avatar */}
                  <div className={`w-24 h-24 rounded-full border-4 ${isAvailable ? 'border-orange-400' : 'border-slate-300'} shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center`}>
                    {guide.photo_url || guide.profile_image_url ? (
                      <img
                        src={guide.photo_url || guide.profile_image_url}
                        alt={guide.name || guide.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Compass size={36} className="text-slate-300" />
                    )}
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md ${
                      isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'
                    }`}>
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-lg font-black text-slate-900 mb-1">{guide.name || guide.full_name}</h4>

                  {(guide.specialties || guide.specialty) && (
                    <div className="flex items-center gap-1 text-orange-500 text-[10px] font-bold uppercase mb-2">
                      <MapPin size={10} /> {guide.specialties || guide.specialty}
                    </div>
                  )}

                  {guide.bio && (
                    <p className="text-slate-500 text-[13px] leading-tight mb-3 line-clamp-3">
                      {guide.bio}
                    </p>
                  )}

                  {/* Contact + Languages */}
                  <div className="space-y-1.5 mb-3">
                    {(guide.contact_number || guide.phone) && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <Phone size={11} className="text-orange-400 flex-shrink-0" />
                        <a href={`tel:${guide.contact_number || guide.phone}`} className="hover:text-orange-600 transition-colors">
                          {guide.contact_number || guide.phone}
                        </a>
                      </div>
                    )}
                    {guide.email && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 truncate">
                        <Mail size={11} className="text-orange-400 flex-shrink-0" />
                        <span className="truncate">{guide.email}</span>
                      </div>
                    )}
                    {Array.isArray(guide.languages) && guide.languages.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {guide.languages.map((lang) => (
                          <span key={lang} className="text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                    {guide.rate_per_day ? (
                      <span className="text-[12px] font-black text-slate-900">
                        ₱{guide.rate_per_day.toLocaleString()}
                        <span className="text-slate-400 font-bold">/day</span>
                      </span>
                    ) : null}
                  </div>

                  <Button
                    onClick={() => openBookingForm(guide)}
                    disabled={!isAvailable}
                    className={`w-full mt-3 font-black uppercase text-[12px] tracking-widest rounded-xl py-5 transition-all ${
                      isAvailable 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isAvailable ? 'Book This Guide' : 'Currently Unavailable'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING FORM MODAL */}
      {selectedGuide && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeBookingForm}
          ></div>
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl border-t-8 border-orange-500 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeBookingForm}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"
            >
              <X size={16} className="text-slate-600" />
            </button>

            <div className="mb-6 space-y-5">
              <div>
                <div className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">
                  Booking Request
                </div>
                <h3 className="text-2xl font-black text-slate-900">{selectedGuide.name || selectedGuide.full_name}</h3>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {selectedGuide.photo_url ? (
                      <img
                        src={selectedGuide.photo_url}
                        alt={selectedGuide.name || selectedGuide.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Compass size={28} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-black text-orange-500">
                      Guide Profile
                    </p>
                    <p className="text-base font-black text-slate-900">
                      {selectedGuide.name || selectedGuide.full_name}
                    </p>
                    {selectedGuide.email && (
                      <p className="text-sm text-slate-500">{selectedGuide.email}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-600 space-y-3">
                  {selectedGuide.specialties && (
                    <p>
                      <span className="font-black text-slate-800">Specialty:</span> {selectedGuide.specialties}
                    </p>
                  )}
                  {selectedGuide.bio && (
                    <p className="leading-relaxed">{selectedGuide.bio}</p>
                  )}
                  {selectedGuide.rate_per_day && (
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] font-bold text-slate-500">
                      <span className="bg-white px-3 py-2 rounded-2xl border border-slate-200">
                        ₱{selectedGuide.rate_per_day.toLocaleString()}/day
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <Calendar size={14} className="text-orange-500" /> Tour Date
                  </label>
                  <input
                    type="date"
                    value={tourDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setTourDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-300 outline-none font-bold text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <Clock size={14} className="text-orange-500" /> Time
                  </label>
                  <input
                    type="time"
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-300 outline-none font-bold text-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <Calendar size={14} className="text-orange-500" /> Day of Tour
                </label>
                <select
                  value={dayOfTour}
                  onChange={(e) => setDayOfTour(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-300 outline-none font-bold text-slate-700 text-sm bg-white"
                >
                  {["Day 1", "Day 2", "Day 3", "Multi-Day"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <MapPin size={14} className="text-orange-500" /> Destinations
                </label>
                <input
                  type="text"
                  value={destinations}
                  onChange={(e) => setDestinations(e.target.value)}
                  placeholder="e.g. Bonbon Beach, Fort San Andres..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-300 outline-none font-bold text-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <Users size={14} className="text-orange-500" /> Number of People
                </label>
                <input
                  type="number"
                  min={1}
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-300 outline-none font-bold text-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <MessageSquare size={14} className="text-orange-500" /> Special Requests
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Anything the guide should know? e.g. preferred pickup time, accessibility needs, dietary requirements..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-300 outline-none font-medium text-slate-700 text-sm resize-none"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[12px] font-bold px-4 py-3 rounded-xl">
                  <AlertCircle size={14} />
                  {submitError}
                </div>
              )}

              <Button
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-orange-600 text-white font-black uppercase py-6 rounded-2xl transition-all"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Submitting…
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL WITH QR CODE */}
      {confirmation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full relative z-10 shadow-2xl border-t-8 border-emerald-500 animate-in zoom-in duration-300 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 uppercase italic mb-1">
              Booking Requested!
            </h3>
            <p className="text-slate-500 text-[12px] font-bold mb-6">
              Show this QR code to {confirmation.guide_name} to confirm your tour.
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-100 mb-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  confirmation.reference_code
                )}`}
                alt="Booking QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
              />
              <div className="mt-4 pt-4 border-t border-slate-200 text-left space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Ref Code</span>
                  <span className="font-black text-slate-900">{confirmation.reference_code}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Guide</span>
                  <span className="font-black text-slate-900">{confirmation.guide_name}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="font-black text-slate-900">{confirmation.tour_date}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Guests</span>
                  <span className="font-black text-slate-900">{confirmation.pax}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={closeConfirmation}
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase py-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Guides
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}