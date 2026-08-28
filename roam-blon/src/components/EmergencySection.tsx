import { ShieldAlert, Phone, MapPin, CloudLightning } from "lucide-react";
import EmergencyHotlines from "@/components/EmergencyButton";

export default function EmergencySection() {
  return (
    <div className="py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    </div>
  );
}
