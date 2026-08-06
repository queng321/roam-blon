"use client";
import { useEffect, useState } from "react";
import { X, QrCode, ArrowLeft, Compass } from "lucide-react";
import TourGuideBooking from "@/components/TourGuideBooking";

interface QRItemModalProps {
  item: any;
  type?: "destination" | "dining" | "landmarks" | "fall";
  onClose: () => void;
  tourist?: any;
}

export default function QRItemModal({ item, type, onClose, tourist }: QRItemModalProps) {
  const resolvedType = type || item?.type || item?._type || "destination";
  const [showGuideBooking, setShowGuideBooking] = useState(false);

  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [item, resolvedType, showGuideBooking]);

  const typeColors: Record<string, string> = {
    destination: "text-rose-600 bg-rose-50 border-rose-200",
    dining: "text-orange-600 bg-orange-50 border-orange-200",
    landmarks: "text-violet-600 bg-violet-50 border-violet-200",
    fall: "text-cyan-600 bg-cyan-50 border-cyan-200",
  };
  const typeLabel: Record<string, string> = {
    destination: "Tourist Destination",
    dining: "Dining Shops",
    landmarks: "Landmark",
    fall: "Waterfall",
  };

  return (
    <div
      className="fixed inset-0 z-[900] bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full md:max-w-3xl max-h-[93vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-400">

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-[2.5rem] md:rounded-t-[2.5rem]">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mb-1 ${typeColors[resolvedType] || typeColors.destination}`}>
              <QrCode size={10} />
              {typeLabel[resolvedType] || "Location"}
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* About */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-2">About {item.name}</p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {item.description || item.desc || "No description available for this destination yet."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Entrance Fee</p>
              <p className="text-sm font-bold text-slate-800">{(item.info?.entranceFee || "Contact for details").replace('₱', 'P')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Visiting Hours</p>
              <p className="text-sm font-bold text-slate-800">{item.info?.visitingHours || "8:00 AM - 5:00 PM"}. The schedule might change, so it's best to check for updates before going.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">How to Get There</p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {item.howToGetThere || item.route_info || item.location || item.address || item.barangay || "Directions not available."}
            </p>
          </div>

          {/* Book a Tour Guide */}
          {!showGuideBooking ? (
            <button
              onClick={() => setShowGuideBooking(true)}
              className="w-full px-5 py-4 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-[0.24em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
            >
              <Compass size={16} />
              Book a Tour Guide
            </button>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                  Book a Tour Guide for {item.name}
                </p>
                <button
                  onClick={() => setShowGuideBooking(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft size={13} /> Back to Details
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <TourGuideBooking tourist={tourist} initialDestination={item?.name || ""} compact />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
