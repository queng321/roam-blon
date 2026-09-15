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
      <div className="mt-10 pt-10 border-t border-slate-100 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-200/80 mb-3 shadow-2xs">
          <Sparkles size={12} className="text-rose-500 animate-pulse" />
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">The Creators</span>
        </div>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">
          Meet Our Team
        </h3>
        <p className="text-slate-500 text-xs md:text-sm font-medium max-w-lg mx-auto mb-8">
          The passionate developers and designers who built the Roam-Blon system.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
              className="group relative bg-white p-5 rounded-3xl border-2 border-[#FAEEED] shadow-xs hover:shadow-lg hover:border-rose-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
            >
              {/* Image Avatar Container */}
              <div className="relative mb-4 p-1 rounded-full bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white bg-slate-100 flex-shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=1a2236&color=ffffff`;
                    }}
                  />
                </div>
              </div>

              <h4 className="text-xs font-black text-slate-900 mb-1 leading-snug tracking-tight group-hover:text-rose-600 transition-colors">
                {member.name}
              </h4>
              
              <span className="inline-block px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-rose-100 mb-4">
                {member.role}
              </span>

              <a
                href={member.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${member.name}'s Facebook`}
                className="mt-auto inline-flex items-center justify-center w-9 h-9 rounded-full text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-800 shadow-xs hover:scale-110 transition-all active:scale-95"
              >
                <Facebook size={16} className="fill-current" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

