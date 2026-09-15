"use client";

import { Sparkles, Target, Eye, Facebook } from "lucide-react";

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

      {/* MEET OUR TEAM SECTION */}
      <div className="mt-8 pt-8 border-t border-slate-100 text-center">
        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">
          Meet Our Team
        </h3>
        <p className="text-slate-500 text-xs md:text-sm font-medium max-w-lg mx-auto mb-6">
          The passionate developers and designers who built the Roam-Blon system.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "Niña Marie M. Marceño",
              role: "Lead Developer",
              image: "/team/nina.jpg",
              facebook: "https://www.facebook.com/nina.marie.marceno.2024",
            },
            {
              name: "Princess Quennie May M. Maaba",
              role: "Programmer",
              image: "/team/quennie.png",
              facebook: "https://www.facebook.com/quenniemay.marzoniamaaba.5",
            },
            {
              name: "Kieth Ariane Y. Abad",
              role: "UI/UX Designer",
              image: "/team/kieth.jpg",
              facebook: "https://www.facebook.com/kiethariane.abad",
            },
            {
              name: "Jordan G. Naron",
              role: "UI/UX Designer",
              image: "/team/jordan.jpg",
              facebook: "https://www.facebook.com/kheciamae.gonzales",
            },
          ].map((member, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-200 shadow-sm mb-3 bg-white flex-shrink-0">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=1a2236&color=ffffff`;
                  }}
                />
              </div>

              <h4 className="text-xs font-black text-slate-900 mb-0.5 leading-snug">{member.name}</h4>
              <p className="text-rose-600 text-[11px] font-bold mb-3">{member.role}</p>

              <a
                href={member.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Facebook size={11} />
                <span>Facebook</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

