"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Dining Spots", href: "/dining" },
  { label: "Destinations", href: "/destinations" },
];

export default function SiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-50 flex flex-col lg:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-white border-b-4 border-[#FAEEED] shadow-lg gap-3 md:gap-4">
      <div className="flex items-center justify-between w-full lg:w-auto gap-3">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => go("/")}>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FAEEED] rounded-xl flex items-center justify-center border-2 border-rose-200 overflow-hidden shadow-inner">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl md:text-3xl text-slate-900 uppercase tracking-tighter leading-none">ROAM-BLON</span>
            <span className="text-[10px] md:text-xs font-bold text-rose-500 tracking-[0.2em] uppercase">AI Integrated Travel Buddy</span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all"
            aria-label="Menu"
          >
            {open ? <X size={24} className="text-slate-900" /> : <Menu size={24} className="text-slate-900" />}
          </button>
        </div>
      </div>

      {/* Desktop nav */}
      <div className="hidden lg:flex items-center gap-2">
        <nav className="flex items-center gap-1 bg-slate-100/50 p-2 rounded-xl border-2 border-slate-200 whitespace-nowrap">
          {NAV_LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => go(l.href)}
              className="px-3 py-2 rounded-lg text-sm font-black transition-all text-slate-500 hover:text-slate-900 hover:bg-white/50"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => go("/emergency")}
            className="px-3 py-2 rounded-lg text-sm font-black text-red-600 hover:bg-red-50 transition-all uppercase tracking-widest"
          >
            EMERGENCY
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button
            onClick={() => go("/login")}
            className="px-4 py-2 rounded-lg text-sm font-black text-white bg-slate-900 hover:bg-rose-600 transition-all uppercase tracking-widest"
          >
            Login
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden w-full flex flex-col gap-2 mt-2">
          {NAV_LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => go(l.href)}
              className="w-full px-6 py-4 rounded-xl text-lg font-black text-left bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => go("/emergency")}
            className="w-full px-6 py-4 rounded-xl text-lg font-black text-left text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 uppercase tracking-widest"
          >
            EMERGENCY
          </button>
          <button
            onClick={() => go("/login")}
            className="w-full px-6 py-4 rounded-xl text-lg font-black text-left text-white bg-slate-900 hover:bg-rose-600 uppercase tracking-widest"
          >
            Login
          </button>
        </div>
      )}
    </header>
  );
}
