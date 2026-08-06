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
} from "lucide-react";

interface BookingNotificationsProps {
  tourist: any;
}

export default function BookingNotifications({ tourist }: BookingNotificationsProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchBookings();

    const channel = supabase
      .channel('tourist-booking-notif')
      .on('broadcast', { event: 'booking_status' }, () => fetchBookings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tourist?.email]);

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
                {b.rejection_reason && (b.status === 'declined' || b.status === 'rejected') && (
                  <p className="text-[11px] text-rose-600 font-bold italic mt-1.5">"{b.rejection_reason}"</p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
