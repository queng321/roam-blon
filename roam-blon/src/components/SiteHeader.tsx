"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import TouristAuthFlow from "@/components/TouristAuthFlow";
import TouristProfile from "@/components/TouristProfile";

const NAV_ITEMS = [
  { id: "welcome", label: "Home" },
  { id: "about", label: "About" },
  { id: "dining", label: "Dining Spots" },
];

function TouristAvatar({ tourist }: { tourist: any }) {
  if (tourist?.avatar_url) {
    return <img src={tourist.avatar_url} alt="Profile" className="w-full h-full object-cover" />;
  }
  return <>{String(tourist?.email || "R")[0]}</>;
}

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [showAuth, setShowAuth] = useState(false);
  const [authInitialScreen, setAuthInitialScreen] = useState<"landing" | "signin">("signin");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [tourist, setTourist] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const cachedUser = localStorage.getItem("roam_blon_tourist_user");
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            if (parsed && parsed.email) {
              setTourist(parsed);
              setShowAuth(false);
            }
          } catch {}
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userEmail = user.email?.toLowerCase().trim() || "";
          const [{ data: adminProfile }, { data: guideProfile }] = await Promise.all([
            supabase.from("admins").select("email").ilike("email", userEmail).maybeSingle(),
            supabase.from("tour_guides").select("email").ilike("email", userEmail).maybeSingle(),
          ]);
          if (adminProfile || guideProfile) {
            await supabase.auth.signOut();
            localStorage.removeItem("roam_blon_tourist_user");
            localStorage.removeItem("roam_blon_active_role");
            setTourist(null);
            setShowAuth(false);
            return;
          }
          const { data: tProfile } = await supabase
            .from("tourists")
            .select("*")
            .ilike("email", userEmail)
            .maybeSingle();
          const touristData = tProfile || { email: user.email, gender: "", age: "", nationality: "local" };
          setTourist(touristData);
          localStorage.setItem("roam_blon_tourist_user", JSON.stringify(touristData));
          setShowAuth(false);
        } else {
          localStorage.removeItem("roam_blon_tourist_user");
          localStorage.removeItem("roam_blon_active_role");
          setTourist(null);
          setShowAuth(false);
        }
      } catch {
        /* ignore — always clear local state on failure */
      }
    }
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("roam_blon_tourist_user");
    localStorage.removeItem("roam_blon_active_role");
    setTourist(null);
    setShowAuth(false);
    setShowLogoutConfirm(false);
    setMobileMenuOpen(false);
  };

  const handleAuthComplete = (touristData: any) => {
    setTourist(touristData);
    setShowAuth(false);
    if (touristData) {
      localStorage.setItem("roam_blon_active_role", touristData?.role || "tourist");
      if (touristData?.role === "admin" || touristData?.role === "tour_guide") {
        localStorage.removeItem("roam_blon_tourist_user");
      } else {
        localStorage.setItem("roam_blon_tourist_user", JSON.stringify(touristData));
      }
    }
    if (touristData?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (touristData?.role === "tour_guide") {
      router.push("/guide/dashboard");
    }
  };

  const openProfile = () => {
    setMobileMenuOpen(false);
    if (!tourist) {
      router.push("/");
    } else {
      setShowProfile(true);
    }
  };

  const openLogin = () => {
    setMobileMenuOpen(false);
    setAuthInitialScreen("signin");
    setShowAuth(true);
  };

  const handleNav = (target: string) => {
    setMobileMenuOpen(false);
    if (target === "about") {
      if (isHome) {
        const el = document.getElementById("about-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push("/about");
      }
    } else if (target === "dining") {
      router.push("/dining");
    } else if (target === "welcome") {
      if (isHome) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[60] flex flex-col lg:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-white border-b-4 border-[#FAEEED] shadow-lg gap-3 md:gap-4">
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav("welcome")}>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FAEEED] rounded-xl flex items-center justify-center border-2 border-rose-200 overflow-hidden shadow-inner">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl md:text-3xl text-slate-900 uppercase tracking-tighter leading-none">ROAM-BLON</span>
              <span className="text-[10px] md:text-xs font-bold text-rose-500 tracking-[0.2em] uppercase">AI Integrated Travel Buddy</span>
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 tracking-wide uppercase" style={{ maxWidth: 300 }}>
                This is a Capstone Project of 4th year BSIT Students of RSU - Romblon Campus
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} className="text-slate-900" /> : <Menu size={24} className="text-slate-900" />}
            </button>
            <button
              onClick={openProfile}
              title={tourist ? "My Profile" : "Get Started"}
              className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm uppercase transition-all shadow-sm ${
                tourist ? "bg-rose-600 ring-2 ring-rose-200" : "bg-slate-900 hover:bg-rose-600"
              }`}
            >
              <TouristAvatar tourist={tourist} />
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <nav className="flex items-center gap-1 bg-slate-100/50 p-2 rounded-xl border-2 border-slate-200 whitespace-nowrap">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-black transition-all ${
                  isHome && item.id === "welcome" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => router.push("/emergency")}
              className="px-3 py-2 rounded-lg text-sm font-black text-red-600 hover:bg-red-50 transition-all uppercase tracking-widest"
            >
              EMERGENCY
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            {tourist ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutConfirm(true)}
                title="Logout"
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-9 h-9"
              >
                <LogOut size={18} />
              </Button>
            ) : null}
          </nav>
          <button
            onClick={openProfile}
            title={tourist ? "My Profile" : "Login"}
            className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm uppercase transition-all shadow-sm ${
              tourist ? "bg-rose-600 ring-2 ring-rose-200" : "bg-slate-900 hover:bg-rose-600"
            }`}
          >
            <TouristAvatar tourist={tourist} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden w-full flex flex-col gap-3 mt-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="w-full px-6 py-4 rounded-xl text-lg font-black text-left bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/emergency");
              }}
              className="w-full px-6 py-4 rounded-xl text-lg font-black text-left text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 uppercase tracking-widest"
            >
              EMERGENCY
            </button>
            <div className="border-t-2 border-slate-100 my-1"></div>
            {tourist ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfile(true);
                  }}
                  className="w-full px-6 py-4 rounded-xl text-lg font-black text-left bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100 flex items-center gap-3"
                >
                  <span className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm uppercase bg-rose-600">
                    <TouristAvatar tourist={tourist} />
                  </span>
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full px-6 py-4 rounded-xl text-lg font-black text-left text-slate-500 bg-slate-50 border-2 border-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center gap-3"
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/");
                }}
                className="w-full px-6 py-4 rounded-xl text-lg font-black text-left text-white bg-slate-900 hover:bg-rose-600 uppercase tracking-widest"
              >
                Get Started
              </button>
            )}
          </div>
        )}
      </header>

      {showAuth && (
        <div className="fixed inset-0 z-[999] overflow-y-auto overflow-x-hidden">
          <TouristAuthFlow
            onComplete={handleAuthComplete}
            onCancel={() => setShowAuth(false)}
            initialScreen={authInitialScreen}
          />
        </div>
      )}

      {showProfile && tourist && (
        <div className="fixed inset-0 z-[999] overflow-y-auto overflow-x-hidden bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-10">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl relative">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
            >
              <X size={20} />
            </button>
            <TouristProfile
              tourist={tourist}
              onUpdate={(t: any) => {
                setTourist(t);
                setShowProfile(false);
              }}
            />
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full relative z-10 shadow-2xl border-t-8 border-rose-500 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500">
                <LogOut size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-tight">Ready to leave?</h3>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest leading-relaxed px-4">
                  Are you sure you want to log out from <span className="text-rose-500 uppercase">Roam-Blon</span>?
                </p>
              </div>
              <div className="flex flex-col w-full gap-3">
                <Button
                  onClick={handleLogout}
                  className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black italic uppercase py-6 rounded-2xl transition-all shadow-xl shadow-slate-200"
                >
                  Yes, Log Me Out
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
                >
                  Stay on the island
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
