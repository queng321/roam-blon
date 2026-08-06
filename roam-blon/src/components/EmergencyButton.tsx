"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  Loader2,
  Phone,
  LifeBuoy,
  HeartPulse,
  ShieldCheck,
  Truck,
  Hospital,
  Stethoscope,
  Users,
  Zap,
  Siren,
  Flame,
  Anchor,
  CloudLightning,
  GraduationCap,
  type LucideIcon
} from "lucide-react";

/**
 * ICON_MAP: Maps database strings to Lucide components.
 * Ensure these strings match your Supabase 'icon_key' column exactly.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,    // PNP / Security
  LifeBuoy,       // Rescue / Coast Guard
  ShieldAlert,    // General Alerts
  HeartPulse,     // Red Cross / Medical
  Truck,          // Ambulance
  Hospital,       // Romblon District Hospital
  Stethoscope,    // Rural Health Unit
  Users,          // MSWDO
  Zap,            // ROMELCO (Power)
  Siren,          // MDRRMO / PDRRMO
  Flame,          // BFP (Fire)
  Anchor,         // Coast Guard
  CloudLightning, // PAG-ASA (Weather)
  GraduationCap,  // RSU-RC
};

/**
 * COLOR_MAP: Maps database strings to Tailwind CSS color classes.
 */
const COLOR_MAP: Record<string, { chip: string; bg: string; text: string; ring: string; iconBg: string }> = {
  blue: { chip: "bg-blue-50 border-blue-200", bg: "bg-blue-50", text: "text-blue-600", ring: "hover:border-blue-300", iconBg: "bg-blue-500" },
  orange: { chip: "bg-orange-50 border-orange-200", bg: "bg-orange-50", text: "text-orange-600", ring: "hover:border-orange-300", iconBg: "bg-orange-500" },
  red: { chip: "bg-red-50 border-red-200", bg: "bg-red-50", text: "text-red-600", ring: "hover:border-red-300", iconBg: "bg-red-500" },
  rose: { chip: "bg-rose-50 border-rose-200", bg: "bg-rose-50", text: "text-rose-600", ring: "hover:border-rose-300", iconBg: "bg-rose-500" },
  emerald: { chip: "bg-emerald-50 border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-600", ring: "hover:border-emerald-300", iconBg: "bg-emerald-500" },
  amber: { chip: "bg-amber-50 border-amber-200", bg: "bg-amber-50", text: "text-amber-600", ring: "hover:border-amber-300", iconBg: "bg-amber-500" },
  cyan: { chip: "bg-cyan-50 border-cyan-200", bg: "bg-cyan-50", text: "text-cyan-600", ring: "hover:border-cyan-300", iconBg: "bg-cyan-500" },
  sky: { chip: "bg-sky-50 border-sky-200", bg: "bg-sky-50", text: "text-sky-600", ring: "hover:border-sky-300", iconBg: "bg-sky-500" },
  purple: { chip: "bg-purple-50 border-purple-200", bg: "bg-purple-50", text: "text-purple-600", ring: "hover:border-purple-300", iconBg: "bg-purple-500" },
  slate: { chip: "bg-slate-50 border-slate-200", bg: "bg-slate-50", text: "text-slate-600", ring: "hover:border-slate-300", iconBg: "bg-slate-500" },
};

const QUICK_KEYS = ["Police", "Fire", "Ambulance", "Coast Guard", "Red Cross", "Hospital"];

interface Hotline {
  id: string;
  label: string;
  phone: string;
  icon_key: string;
  color_key: string;
}

export default function EmergencyHotlines() {
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [isLoadingHotlines, setIsLoadingHotlines] = useState(true);

  useEffect(() => {
    async function fetchHotlines() {
      try {
        setIsLoadingHotlines(true);
        const { data, error } = await supabase
          .from('emergency_hotlines')
          .select('*')
          .order('label', { ascending: true });

        if (error) throw error;
        if (data) setHotlines(data);
      } catch (err) {
        console.error("Error fetching hotlines:", err);
      } finally {
        setIsLoadingHotlines(false);
      }
    }
    fetchHotlines();
  }, []);

  if (isLoadingHotlines) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={28} className="text-rose-400 animate-spin" />
        <p className="text-slate-400 font-bold text-sm">Loading emergency contacts…</p>
      </div>
    );
  }

  // Pick the most critical responders for the big quick-dial cards.
  const quick = QUICK_KEYS
    .map(key => hotlines.find(h => h.label.toLowerCase().includes(key.toLowerCase())))
    .filter((h): h is Hotline => !!h)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* QUICK DIAL GRID */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-[1px] flex-1 bg-slate-200"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Quick Dial
          </span>
          <div className="h-[1px] flex-1 bg-slate-200"></div>
        </div>

        {quick.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quick.map((hotline) => {
              const Icon = ICON_MAP[hotline.icon_key.trim()] || ShieldAlert;
              const color = COLOR_MAP[hotline.color_key] || COLOR_MAP.slate;
              const short = hotline.label.split("(")[0].trim();
              return (
                <a
                  key={hotline.id}
                  href={`tel:${hotline.phone.split("/")[0].trim()}`}
                  className={`group flex flex-col items-center gap-2.5 p-5 rounded-2xl ${color.bg} border-2 border-transparent ${color.ring} hover:shadow-md transition-all active:scale-[0.97] text-center`}
                >
                  <div className={`w-12 h-12 rounded-full ${color.iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${color.text}`}>{short}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-700 mt-0.5">
                      {hotline.phone.split("/")[0].trim()}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-[11px] text-slate-400 font-bold uppercase py-4">
            No hotlines available yet.
          </p>
        )}
      </div>

      {/* FULL DIRECTORY */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-[1px] flex-1 bg-slate-200"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            All Emergency Contacts
          </span>
          <div className="h-[1px] flex-1 bg-slate-200"></div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {hotlines.map((hotline) => {
            const Icon = ICON_MAP[hotline.icon_key.trim()] || ShieldAlert;
            const color = COLOR_MAP[hotline.color_key] || COLOR_MAP.slate;
            return (
              <a
                key={hotline.id}
                href={`tel:${hotline.phone.split("/")[0].trim()}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-2.5 rounded-xl ${color.chip} ${color.text} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider truncate">
                      {hotline.label}
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900 tracking-tight truncate">
                      {hotline.phone}
                    </p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${color.chip} ${color.text} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`}>
                  <Phone size={12} /> Call
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
