"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
  MessageSquare,
  AlertTriangle,
  Bike,
  X,
  Compass,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MyBookingsProps {
  tourist: { email: string; firstName: string; lastName?: string; } | null;
}

export default function MyBookings({ tourist }: MyBookingsProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptBooking, setReceiptBooking] = useState<any | null>(null);

  useEffect(() => {
    if (tourist?.email) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [tourist]);

  async function fetchBookings() {
    setLoading(true);
    try {
      // Fetch Guide Bookings
      const { data: guides, error: guideError } = await supabase
        .from('tour_guide_bookings')
        .select('*')
        .eq('tourist_email', tourist?.email);

      if (guideError) throw guideError;

      const combined = [
        ...(guides || []).map(b => ({ ...b, type: 'guide' }))
      ];

      // Sort by date or ID
      combined.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setBookings(combined);
    } catch (e) {
      console.error("Fetch bookings error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <Loader2 className="animate-spin text-rose-500" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retrieving your adventure history...</p>
      </div>
    );
  }

  if (!tourist) {
    return (
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-12 text-center border-2 border-slate-50 shadow-sm">
        <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Access Denied</h3>
        <p className="text-slate-500 font-medium mb-6">Please log in as a tourist to view your personal bookings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 bg-rose-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Your Journey</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-[#151c2f] italic uppercase tracking-tighter">My Bookings</h2>
        </div>
        <div className="bg-white px-4 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm self-start md:self-auto">
          <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 mb-0.5">Logged in as</p>
          <p className="text-xs md:text-sm font-black text-slate-900">{tourist.email}</p>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-50 p-5 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              {/* Status Decorative Border */}
              <div className={`absolute top-0 left-0 w-2 h-full ${booking.status === 'confirmed' || booking.status === 'approved' ? 'bg-emerald-500' :
                  booking.status === 'rejected' ? 'bg-rose-500' :
                    booking.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                }`} />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            {/* Bulletproof Status Badge using Inline Styles */}
                            <div 
                                className="uppercase font-black text-[10px] px-4 py-1.5 rounded-full italic tracking-widest shadow-sm text-white"
                                style={{
                                    backgroundColor: 
                                        booking.status === 'confirmed' || booking.status === 'approved' ? '#10b981' : 
                                        booking.status === 'rejected' ? '#ef4444' : '#f59e0b'
                                }}
                            >
                                {booking.status === 'confirmed' ? 'Approved' : (booking.status || 'Pending Approval')}
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ORDER ID: {booking.id?.slice(0, 8)}...</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic leading-none mb-4 group-hover:text-rose-500 transition-colors">
                            {booking.type === 'guide' ? `Tour with ${booking.guide_name}` : booking.item_name}
                        </h3>

                  {booking.rejection_reason && (
                    <div className={`mb-6 p-4 border rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-left-4 ${booking.status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'
                      }`}>
                      {booking.status === 'rejected' ? (
                        <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <MessageSquare size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div className="text-left">
                        <p className={`text-[10px] font-black uppercase mb-1 ${booking.status === 'rejected' ? 'text-rose-600' : 'text-blue-600'
                          }`}>
                          {booking.status === 'rejected' ? 'Reason for Rejection' : 'Note from Fleet Manager'}
                        </p>
                        <p className={`text-xs font-bold italic leading-relaxed ${booking.status === 'rejected' ? 'text-rose-900' : 'text-blue-900'
                          }`}>"{booking.rejection_reason}"</p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                       {booking.type === 'guide' ? <Users size={14} className="text-slate-300" /> : <Calendar size={14} className="text-slate-300" />}
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {booking.type === 'guide' ? `Guide: ${booking.guide_name}` : `${booking.duration_days} Days Rental`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {booking.type === 'guide' ? `Date: ${booking.booking_date}` : 'Booked Recently'}
                      </span>
                    </div>
                  </div>
                </div>
                      <div className="bg-slate-900 rounded-[2rem] p-8 lg:min-w-[260px] text-center text-white relative shadow-2xl transform group-hover:scale-[1.02] transition-transform mt-6 lg:mt-0 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Package size={64} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Total Amount Paid</p>
                        <div className="text-4xl font-black tracking-tighter text-emerald-400 leading-none mb-8">₱{booking.total_price || 0}</div>
                        <button 
                          onClick={() => setReceiptBooking(booking)}
                          className="w-full bg-white/10 hover:bg-white/20 active:scale-[0.98] text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
                        >
                           View Receipt <ArrowRight size={14} />
                        </button>
                      </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-10 md:p-20 text-center border-2 border-dashed border-slate-100">
          <div className="bg-slate-50 w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-200">
            <Package size={32} className="md:w-12 md:h-12" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">No Bookings Yet</h3>
          <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8 md:mb-10 leading-relaxed uppercase text-[10px] md:text-xs tracking-widest">
            It seems you haven't requested any tour guides yet. Start your adventure by exploring our accredited guides!
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-[1.5rem] shadow-xl shadow-rose-100 transition-all uppercase tracking-widest text-[10px] md:text-xs italic"
          >
            Explore Tour Guides
          </button>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
        <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest mb-1">Confirmation Process</h4>
          <p className="text-amber-700/80 text-[11px] font-bold leading-relaxed uppercase">
            Your booking request is being reviewed by our team. You will receive a notification or update here once it is confirmed. Please keep your physical ID ready upon pickup.
          </p>
        </div>
      </div>

      {/* --- DIGITAL RECEIPT MODAL --- */}
      {receiptBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setReceiptBooking(null)} />
           <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
              
              {/* TOP-RIGHT CLOSE ICON FOR BETTER RESPONSIVENESS */}
              <button 
                onClick={() => setReceiptBooking(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
              >
                 <X size={20} />
              </button>

              <div className="flex items-center justify-between mb-8 mt-4 md:mt-2">
                 <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Rental Receipt</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Order #RC-{receiptBooking.id?.slice(0,6)}</p>
                 </div>
                 <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-rose-500">
                    {receiptBooking.type === 'guide' ? <Compass size={24} /> : <Bike size={24} />}
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Tenant Details */}
                 <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Customer Information</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[11px] font-black text-slate-900 leading-none mb-1 uppercase">{receiptBooking.user_name || (tourist?.firstName + ' ' + (tourist?.lastName || ''))}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Registered Name</p>
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-slate-900 leading-none mb-1 uppercase">{receiptBooking.booking_date || receiptBooking.tour_date || 'N/A'}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Tour Date</p>
                        </div>
                     </div>
                 </div>

                 {/* Order Particulars */}
                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Description</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Duration</p>
                    </div>
                    <div className="h-px bg-slate-100" />
                    
                    <div className="flex justify-between items-center px-2">
                       <div>
                          <p className="text-sm font-black text-slate-900 uppercase italic leading-none mb-1">{receiptBooking.item_name || receiptBooking.guide_name}</p>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{receiptBooking.type === 'guide' ? 'Guided Tour' : 'Active Rental'}</p>
                       </div>
                       <p className="text-sm font-black text-slate-900 uppercase italic">{receiptBooking.type === 'guide' ? `${receiptBooking.pax} Pax` : `${receiptBooking.duration_days} Days`}</p>
                    </div>

                    <div className="h-px bg-slate-100 border-dashed" />

                    {/* Accessories Section */}
                    <div className="px-2">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                          <Package size={12}/> Included Accessories (Free)
                       </p>
                       <div className="flex flex-wrap gap-2 py-2">
                          {receiptBooking.notes?.split(',').map((acc: string, i: number) => (
                             <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase italic">
                                {acc.trim()}
                             </span>
                          )) || <p className="text-[9px] italic text-slate-300">Basic Package Only</p>}
                       </div>
                    </div>
                 </div>

                 <div className="h-px bg-slate-900" />

                 <div className="flex justify-between items-end px-2 pt-2">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Amount</p>
                       <div className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">₱{receiptBooking.total_price}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-100`}
                         style={{ backgroundColor: receiptBooking.status === 'confirmed' || receiptBooking.status === 'approved' ? '#10b981' : '#f59e0b' }}>
                        {receiptBooking.status?.toUpperCase() || 'PENDING'}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}