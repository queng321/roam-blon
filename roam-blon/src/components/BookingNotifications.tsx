"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  Compass,
  Calendar,
  Users,
  Star,
  X,
  AlertCircle,
} from "lucide-react";

interface BookingNotificationsProps {
  tourist: any;
}

export default function BookingNotifications({ tourist }: BookingNotificationsProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Guide review state
  const [guideReviews, setGuideReviews] = useState<any[]>([]);
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Guide availability map (guide name → is_available)
  const [guideAvailability, setGuideAvailability] = useState<Record<string, boolean>>({});

  const fetchGuideAvailability = async () => {
    const map: Record<string, boolean> = {};
    try {
      let dbGuides: any[] = [];
      try {
        const { data } = await supabase
          .from('tour_guides')
          .select('full_name, name, is_available')
          .eq('status', 'approved');
        if (data) dbGuides = data;
      } catch { /* ignore */ }
      const local = JSON.parse(localStorage.getItem("roam_blon_tour_guides") || "[]");
      [...dbGuides, ...local].forEach((g: any) => {
        const n = g.full_name || g.name || "";
        if (n && map[n.toLowerCase()] === undefined) map[n.toLowerCase()] = g.is_available !== false;
      });
    } catch { /* ignore */ }
    setGuideAvailability(map);
  };

  const fetchBookings = async () => {
    setLoading(true);
    const touristEmail = tourist?.email || tourist?.email?.toLowerCase() || "tourist@roam-blon.com";
    let remote: any[] = [];
    try {
      const { data, error } = await supabase
        .from("tour_guide_bookings")
        .select("*")
        .eq("tourist_email", touristEmail)
        .order("created_at", { ascending: false });
      if (!error && data) remote = data;
    } catch { /* ignore */ }

    let local: any[] = [];
    try {
      local = JSON.parse(localStorage.getItem("roam_blon_tour_guide_bookings") || "[]");
    } catch { /* ignore */ }

    const combined = [...remote];
    local.forEach((lb: any) => {
      if (!combined.some((cb: any) => cb.id === lb.id || (cb.guide_name === lb.guide_name && cb.booking_date === lb.booking_date))) {
        combined.push(lb);
      }
    });
    combined.sort((a, b) => new Date(b.created_at || b.booking_date || 0).getTime() - new Date(a.created_at || a.booking_date || 0).getTime());
    setBookings(combined.slice(0, 20));
    setLoading(false);
  };

  const fetchGuideReviews = async () => {
    try {
      let remote: any[] = [];
      try {
        const res = await fetch('/api/guide-reviews');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) remote = json.data;
        }
      } catch { /* ignore */ }
      const stored = JSON.parse(localStorage.getItem("roam_blon_guide_reviews") || "[]");
      const merged = [...remote];
      stored.forEach((lr: any) => {
        if (!merged.some((cr: any) => cr.id === lr.id || (cr.booking_id === lr.booking_id && cr.tourist_email === lr.tourist_email))) {
          merged.push(lr);
        }
      });
      setGuideReviews(merged);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchBookings();
    fetchGuideReviews();
    fetchGuideAvailability();

    const channel = supabase
      .channel('tourist-booking-notif')
      .on('broadcast', { event: 'booking_status' }, () => fetchBookings())
      .on('broadcast', { event: 'guide_availability' }, () => fetchGuideAvailability())
      .on('broadcast', { event: 'new_tour_guide' }, () => fetchGuideAvailability())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tourist?.email]);

  const findReviewFor = (b: any) => {
    return guideReviews.find(
      (r: any) =>
        (r.booking_id && b.id && String(r.booking_id) === String(b.id)) ||
        (r.reference_code && b.reference_code && String(r.reference_code) === String(b.reference_code)) ||
        (r.guide_name === b.guide_name && r.tourist_email === (tourist?.email || b.tourist_email) && (r.booking_date || r.tour_date) === b.booking_date)
    );
  };

  const openReviewModal = (b: any) => {
    setReviewBooking(b);
    setReviewRating(0);
    setHoverStar(0);
    setReviewComment("");
    setReviewError("");
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;
    if (reviewRating < 1) {
      setReviewError("Please select a star rating.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");

    const payload = {
      booking_id: typeof reviewBooking.id === 'string' ? reviewBooking.id : String(reviewBooking.id || ""),
      reference_code: reviewBooking.reference_code || null,
      guide_name: reviewBooking.guide_name || "Tour Guide",
      guide_id: reviewBooking.guide_id || null,
      tourist_email: tourist?.email || reviewBooking.tourist_email || "tourist@roam-blon.com",
      tourist_name: reviewBooking.tourist_name || `${tourist?.firstName || tourist?.first_name || ""} ${tourist?.lastName || tourist?.last_name || ""}`.trim() || null,
      rating: reviewRating,
      comment: reviewComment.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      try {
        await fetch('/api/guide-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch { /* ignore */ }

      try {
        const chan = supabase.channel('admin-live-feed');
        await chan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chan.send({ type: 'broadcast', event: 'new_guide_review', payload });
            supabase.removeChannel(chan);
          }
        });
      } catch { /* ignore */ }

      const stored = JSON.parse(localStorage.getItem("roam_blon_guide_reviews") || "[]");
      const localEntry = { ...payload, id: `local_${Date.now()}` };
      stored.unshift(localEntry);
      localStorage.setItem("roam_blon_guide_reviews", JSON.stringify(stored.slice(0, 500)));
      setGuideReviews(prev => [localEntry, ...prev.filter(r => !(r.booking_id === payload.booking_id))]);

      setReviewBooking(null);
    } catch (err) {
      console.error("Review submit failed", err);
      setReviewError("Something went wrong while submitting your review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'approved' || s === 'confirmed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'declined' || s === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };
  const statusLabel = (s: string) => {
    if (s === 'approved' || s === 'confirmed') return 'Approved';
    if (s === 'declined' || s === 'rejected') return 'Declined';
    return 'Pending Approval';
  };
  const StatusIcon = ({ s }: { s: string }) => {
    if (s === 'approved' || s === 'confirmed') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (s === 'declined' || s === 'rejected') return <XCircle size={14} className="text-rose-500" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <Loader2 className="animate-spin text-rose-500" size={26} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checking your tour guide bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
            <Bell size={24} />
          </div>
          <p className="text-sm font-black text-slate-700 uppercase tracking-tight">No Booking Notifications</p>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed">
            When you book a tour guide, its status updates will appear here.
          </p>
        </div>
      ) : (
        bookings.map((b, idx) => (
          <div key={b.id || idx} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <Compass size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-black text-slate-900 text-sm truncate">{b.guide_name || "Tour Guide"}</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${statusColor(b.status)}`}>
                    <StatusIcon s={b.status} /> {statusLabel(b.status)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Calendar size={11} /> {b.booking_date || b.tour_date || "Date TBA"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Users size={11} /> {b.pax || 1} Guest{b.pax !== 1 ? 's' : ''}
                  </span>
                  {b.reference_code && (
                    <span className="inline-flex items-center text-[10px] font-black text-rose-500 uppercase tracking-widest">
                      Ref: {b.reference_code}
                    </span>
                  )}
                </div>
                {b.destinations && (
                  <p className="text-[11px] text-slate-400 font-medium italic mt-1.5 truncate">📍 {b.destinations}</p>
                )}
                {(() => {
                  const avail = b.guide_name ? guideAvailability[b.guide_name.toLowerCase()] : undefined;
                  if (avail === undefined) return null;
                  return (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      avail ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${avail ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      Guide: {avail ? 'Available' : 'Unavailable'}
                    </div>
                  );
                })()}
                {b.rejection_reason && (b.status === 'declined' || b.status === 'rejected') && (
                  <p className="text-[11px] text-rose-600 font-bold italic mt-1.5">"{b.rejection_reason}"</p>
                )}
                {(b.status === 'approved' || b.status === 'confirmed') && (
                  (() => {
                    const existing = findReviewFor(b);
                    if (existing) {
                      return (
                        <div className="mt-3 flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2">
                          <div className="flex gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={11} className={s <= existing.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                            ))}
                          </div>
                          <p className="text-[10px] font-bold text-emerald-700 italic truncate">You rated this guide</p>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => openReviewModal(b)}
                        className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Star size={12} className="fill-white" /> Rate & Review Guide
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* --- RATE & REVIEW GUIDE MODAL --- */}
      {reviewBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setReviewBooking(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300 text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-400" />
            <button
              onClick={() => setReviewBooking(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
              <Compass size={30} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Rate Your Guide</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-6">
              {reviewBooking.guide_name || "Tour Guide"} · {reviewBooking.booking_date || reviewBooking.tour_date || ""}
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={`${(hoverStar || reviewRating) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">
              {reviewRating > 0 ? `${reviewRating} / 5 stars` : "Tap a star to rate"}
            </p>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this guide (optional)..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-amber-300 outline-none font-medium text-slate-700 text-sm resize-none mb-4"
            />

            {reviewError && (
              <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 text-[12px] font-bold px-4 py-3 rounded-xl mb-4">
                <AlertCircle size={14} />
                {reviewError}
              </div>
            )}

            <button
              onClick={handleSubmitReview}
              disabled={reviewSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {reviewSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Submitting…
                </span>
              ) : (
                <>
                  <Star size={16} className="fill-white" /> Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
