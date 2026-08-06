"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Info,
  Search,
  Sparkles,
  Home,
  Compass,
  Bike,
  Car,
  MessageSquare,
  Facebook,
  ThumbsUp,
  ExternalLink
} from "lucide-react";

const CATEGORY_TABS = [
  { label: 'All Services', value: 'all' },
  { label: 'Rentals', value: 'rentals' },
];

const STATIC_SERVICES = [
  {
    id: 's1',
    name: "Mangingisdang Konsehal Cabo Faigao",
    category: "tours",
    type: "Local Guide & Fisherman",
    followers: "24K followers",
    likes: "18K likes",
    description: "Provides authentic island hopping tours, local fishing experiences, and community guiding around Cabo Faigao and nearby pristine waters.",
    facebook: "Mangingisdang Konsehal Cabo Faigao",
    fb_link: "https://www.facebook.com/share/1HZuRzhfkz/",
    badge: "Popular Guide",
    gradient: "from-teal-400 via-emerald-500 to-blue-600",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-teal-400",
    icon: Compass,
    image_url: "/rental/cabo_faigao.png",
    avatarText: "KF"
  },
  {
    id: 's2',
    name: "Lhen Motorbike For Rent",
    category: "rentals",
    type: "Motorbike Rental",
    followers: "67 friends",
    likes: "Motorbike Fleet",
    description: "Offers reliable and well-maintained motorbikes for rent at affordable rates. Perfect for exploring the scenic routes of Romblon Island.",
    facebook: "Lhen Motorbike For Rent",
    fb_link: "https://www.facebook.com/lhen.motorbike.for.rent",
    badge: "Motorbikes",
    gradient: "from-rose-500 via-red-600 to-slate-800",
    avatarBg: "bg-gradient-to-tr from-slate-800 to-rose-500",
    icon: Bike,
    image_url: "/rental/lhen.png",
    avatarText: "LM"
  },
  {
    id: 's3',
    name: "Pamasyar Travel & Tours Services",
    category: "tours",
    type: "Eco Tour Agency",
    followers: "11K followers",
    likes: "8.5K likes",
    description: "Proud to be the first DOT- and PHILTOA-accredited Tour Operator in the Province of Romblon. Offers comprehensive tour packages, land/sea transfers, and custom itineraries.",
    facebook: "Pamasyar Travel & Tours Services",
    fb_link: "https://www.facebook.com/PamasyarTravelandTours?mibextid=rS40aB7S9Ucbxw6v",
    badge: "DOT Accredited",
    gradient: "from-sky-400 via-cyan-500 to-blue-600",
    avatarBg: "bg-gradient-to-tr from-blue-600 to-sky-400",
    icon: Compass,
    image_url: "/rental/pamasyar.png",
    avatarText: "PT"
  },
  {
    id: 's4',
    name: "Stevejoy Beach House Romblon, Romblon",
    category: "resorts",
    type: "Beach Resort",
    followers: "1.1K followers",
    likes: "950 likes",
    description: "A gorgeous beach resort located in Barangay Ginablan. Offers beachfront accommodation, cozy cottages, swimming areas, and a perfect view of the sea. Perfect for bookings and relaxing stays.",
    facebook: "Stevejoy Beach House Romblon, Romblon",
    fb_link: "https://www.facebook.com/profile.php?id=61566457658217&mibextid=rS40aB7S9Ucbxw6v",
    badge: "Resort Stay",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    avatarBg: "bg-gradient-to-tr from-rose-500 to-amber-400",
    icon: Home,
    image_url: "/rental/stevejoy.png",
    avatarText: "SB"
  },
  {
    id: 's5',
    name: "WenCon Rental Services",
    category: "rentals",
    type: "Car & Motorbike Rental",
    followers: "153 followers",
    likes: "Car Rental",
    description: "Providing quality car and motorcycle rental services in Romblon. Travel safely and comfortably around the island's scenic routes.",
    facebook: "WenCon Rental Services",
    fb_link: "https://www.facebook.com/profile.php?id=61560856061202&mibextid=rS40aB7S9Ucbxw6v",
    badge: "Car & Bike",
    gradient: "from-purple-500 via-indigo-600 to-slate-900",
    avatarBg: "bg-gradient-to-tr from-slate-900 to-purple-500",
    icon: Car,
    image_url: "/rental/wencon.png",
    avatarText: "WR"
  }
];

export default function RentalList({ tourist }: { tourist?: any }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredServices = STATIC_SERVICES.filter(service => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-24">

      {/* HEADER HINT */}
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 shadow-sm">
        <div className="p-2 bg-rose-500/10 rounded-xl">
          <Info size={18} className="text-rose-600 shrink-0" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-black text-rose-600 uppercase tracking-widest">
            Local Rentals, Stays &amp; Tours
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Contact these local service providers directly or visit their Facebook pages to make your bookings and inquiries.
          </p>
        </div>
      </div>

      {/* SEARCH AND CATEGORY ROW */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* CATEGORY TABS */}
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar flex-nowrap shadow-inner">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                activeCategory === tab.value
                  ? 'bg-white text-rose-600 shadow-md scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* SERVICES GRID */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
          <Compass size={40} className="text-slate-200" />
          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
            No services found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((s) => {
            const IconComponent = s.icon;
            return (
              <div
                key={s.id}
                className="bg-white border border-slate-100 rounded-[2.5rem] shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col overflow-hidden"
              >
                {/* HEADER / COVER AREA */}
                <div className={`bg-gradient-to-br ${s.gradient} p-6 relative flex flex-col justify-between h-36`}>
                  {/* Decorative mesh */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                  <div className="flex justify-between items-start z-10">
                    <Badge className="bg-white/20 backdrop-blur-md text-white font-bold text-[9px] uppercase tracking-widest border-none">
                      {s.badge}
                    </Badge>
                    <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 shadow-sm">
                      <Sparkles size={10} className="text-amber-300 animate-pulse" />
                      Verified Page
                    </div>
                  </div>
                </div>

                {/* OVERLAPPING PROFILE AVATAR CONTAINER */}
                <div className="relative px-6 md:px-8 -mt-10 z-20 flex items-end justify-between">
                  <div className={`w-20 h-20 ${s.avatarBg} rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xl font-black tracking-tight shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:12px_12px]"></div>
                    {s.avatarText}
                  </div>
                  <div className="flex gap-2 mb-1.5">
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-[10px] font-black uppercase">
                      <ThumbsUp size={10} className="text-blue-500" />
                      {s.likes}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-[10px] font-black uppercase">
                      <Users size={10} className="text-rose-500" />
                      {s.followers.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="flex flex-col flex-1 p-6 md:p-8 pt-4 gap-5">
                  {/* NAME & SUBTITLE */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <IconComponent size={12} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {s.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 leading-snug group-hover:text-rose-600 transition-colors">
                      {s.name}
                    </h3>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    {s.description}
                  </p>

                  {/* FACEBOOK SCREENSHOT IMAGE */}
                  {s.image_url && (
                    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-inner mt-1 relative group/image">
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="w-full h-48 object-cover object-center group-hover/image:scale-105 transition-transform duration-500"
                      />
                      {/* Frosted badge inside image */}
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <Facebook size={10} className="text-blue-400" />
                        Page Preview
                      </div>
                    </div>
                  )}

                  {/* DIVIDER */}
                  <div className="border-t border-slate-100" />

                  {/* CTAs */}
                  <div className="pt-2">
                    <a
                      href={s.fb_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white py-3.5 px-4 hover:bg-rose-600 transition-colors text-xs font-black uppercase tracking-wider text-center shadow-md shadow-slate-100 hover:shadow-lg group/btn"
                    >
                      <Facebook size={12} className="group-hover/btn:scale-110 transition-transform" />
                      Visit Page
                      <ExternalLink size={10} className="opacity-65" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}