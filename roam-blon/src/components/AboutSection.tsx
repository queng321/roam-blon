import { Sparkles, Target, Eye } from "lucide-react";

export default function AboutSection() {
  return (
    <div
      id="about-section"
      className="bg-white px-5 py-6 md:px-8 md:py-8 rounded-[2rem] border-2 border-[#FAEEED] shadow-sm mb-6"
    >
      <h2 className="text-xl md:text-2xl font-black text-slate-900 text-center tracking-tighter uppercase italic mb-6">
        About Roam-Blon Project
      </h2>

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
  );
}
