"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Calendar, TrendingUp, User, LogOut,
  CheckCircle2, XCircle, Clock, Users, X, Menu, Compass,
  ChevronRight, Star, Loader2, AlertCircle, Phone, Mail
} from "lucide-react";

export default function GuideDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bookingSubTab, setBookingSubTab] = useState<"pending" | "upcoming" | "past">("pending");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: guideData } = await supabase
        .from("tour_guides")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (!guideData) { setLoading(false); return; }

      setGuide(guideData);
      await fetchBookings(guideData.full_name);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (guideName: string) => {
    try {
      const { data } = await supabase
        .from("tour_guide_bookings")
        .select("*")
        .eq("guide_name", guideName)
        .order("created_at", { ascending: false });
      setBookings(data || []);
    } catch {
      setBookings([]);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "declined") => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("tour_guide_bookings")
        .update({ status })
        .eq("id", id);

      if (!error) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      } else {
        // localStorage fallback
        const fallback = JSON.parse(localStorage.getItem("roam_blon_guide_actions") || "[]");
        fallback.push({ id, status, updated_at: new Date().toISOString() });
        localStorage.setItem("roam_blon_guide_actions", JSON.stringify(fallback));
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      }
    } catch {
      const fallback = JSON.parse(localStorage.getItem("roam_blon_guide_actions") || "[]");
      fallback.push({ id, status, updated_at: new Date().toISOString() });
      localStorage.setItem("roam_blon_guide_actions", JSON.stringify(fallback));
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F6F1ED] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-rose-500" size={40} />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Loading Guide Dashboard...</p>
      </div>
    </div>
  );

  if (!guide) return (
    <div className="min-h-screen bg-[#F6F1ED] flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-xl border border-slate-100">
        <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Access Denied</h2>
        <p className="text-slate-500 font-medium text-sm mb-6">
          You must be a registered and approved Tour Guide to access this page.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-slate-900 text-white font-black py-3 rounded-2xl hover:bg-rose-600 transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  // Stats calculations
  const pending = bookings.filter(b => b.status === "pending");
  const upcoming = bookings.filter(b => b.status === "approved" || b.status === "confirmed");
  const past = bookings.filter(b => b.status === "completed" || b.status === "declined");
  const totalEarnings = upcoming.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

  const specialties: string[] = Array.isArray(guide.specialty)
    ? guide.specialty
    : typeof guide.specialty === "string"
    ? guide.specialty.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const initials = (guide.full_name || "Guide")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "profile", label: "Profile", icon: User },
  ];

  const getBookingSubList = () => {
    if (bookingSubTab === "pending") return pending;
    if (bookingSubTab === "upcoming") return upcoming;
    return past;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      declined: "bg-red-50 text-red-700 border-red-200",
      completed: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return map[status] || "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-[#F6F1ED] flex">

      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1A1D2D] text-white min-h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
              <Compass size={20} />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">ROAM-BLON</p>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Guide Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all ${
                  isActive
                    ? "bg-rose-500 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                {item.label}
                {item.id === "bookings" && pending.length > 0 && (
                  <span className="ml-auto bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 font-black text-sm transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A1D2D] text-white px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <Compass size={20} className="text-rose-500" />
          <span className="font-black text-sm uppercase tracking-widest">Guide Dashboard</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE NAV DROPDOWN */}
      {sidebarOpen && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 z-40 bg-[#1A1D2D] p-4 space-y-1 shadow-2xl border-t border-white/10">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all ${
                  activeTab === item.id ? "bg-rose-500 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-black text-sm transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0 p-4 md:p-8">

        {/* ============ DASHBOARD TAB ============ */}
        {activeTab === "dashboard" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="mb-2">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                Welcome back, {guide.full_name?.split(" ")[0]}!
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Here's your guide overview for today.</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {guide.profile_image_url ? (
                  <img src={guide.profile_image_url} alt={guide.full_name} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-rose-500 flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{guide.full_name}</h2>
                    <span className={`self-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      guide.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {guide.status || "Pending"}
                    </span>
                  </div>
                  {guide.bio && <p className="text-slate-500 text-sm italic mb-3">{guide.bio}</p>}
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {specialties.map((s, i) => (
                        <span key={i} className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Requests", value: bookings.length, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Pending", value: pending.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Approved", value: upcoming.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Total Earned", value: `₱${totalEarnings.toLocaleString()}`, icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-50" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className={`${stat.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                      <Icon size={20} className={stat.color} />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent Bookings */}
            {bookings.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Recent Bookings</h3>
                  <button onClick={() => setActiveTab("bookings")} className="text-rose-500 font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:text-rose-700">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  {bookings.slice(0, 4).map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div>
                        <p className="font-black text-slate-800 text-sm">{b.tourist_email || b.tourist_name || "Tourist"}</p>
                        <p className="text-slate-400 text-[11px] font-bold">{b.booking_date || b.preferred_date || "—"} · {b.pax || 1} pax</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ BOOKINGS TAB ============ */}
        {activeTab === "bookings" && (
          <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Bookings</h1>

            {/* Sub-tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
              {[
                { id: "pending", label: `Pending (${pending.length})` },
                { id: "upcoming", label: `Upcoming (${upcoming.length})` },
                { id: "past", label: `Past (${past.length})` },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setBookingSubTab(st.id as any)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                    bookingSubTab === st.id ? "bg-white shadow-md text-slate-900" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Booking Cards */}
            {getBookingSubList().length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                <Calendar size={40} className="text-slate-200" />
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No {bookingSubTab} bookings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getBookingSubList().map(b => (
                  <div key={b.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-black text-slate-900 text-base">{b.tourist_email || b.tourist_name || "Tourist"}</p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-bold">📅 {b.booking_date || b.preferred_date || "—"}</span>
                          <span className="text-[11px] text-slate-400 font-bold">👥 {b.pax || 1} pax</span>
                          {b.total_price && <span className="text-[11px] text-rose-500 font-black">₱{parseFloat(b.total_price).toLocaleString()}</span>}
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </div>

                    {b.notes && (
                      <p className="text-slate-500 text-sm font-medium bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                        "{b.notes}"
                      </p>
                    )}

                    {b.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatusUpdate(b.id, "approved")}
                          disabled={updatingId === b.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl transition-all text-sm disabled:opacity-50"
                        >
                          {updatingId === b.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(b.id, "declined")}
                          disabled={updatingId === b.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-100 font-black py-3 rounded-2xl transition-all text-sm disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ PROFILE TAB ============ */}
        {activeTab === "profile" && (
          <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">My Profile</h1>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
              {/* Avatar */}
              <div className="flex justify-center">
                {guide.profile_image_url ? (
                  <img src={guide.profile_image_url} alt={guide.full_name} className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl" />
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-rose-500 flex items-center justify-center text-white text-4xl font-black shadow-xl">
                    {initials}
                  </div>
                )}
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{guide.full_name}</h2>
                <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  guide.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {guide.status || "Pending Approval"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                {[
                  { label: "Email", value: guide.email, icon: Mail },
                  { label: "Contact", value: guide.contact_number || "Not set", icon: Phone },
                  { label: "Experience", value: guide.experience_years ? `${guide.experience_years} years` : "Not specified", icon: Star },
                  { label: "Languages", value: Array.isArray(guide.languages) ? guide.languages.join(", ") : guide.languages || "Filipino, English", icon: Users },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <Icon size={14} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {specialties.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((s, i) => (
                      <span key={i} className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {guide.bio && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About Me</p>
                  <p className="text-slate-600 text-sm font-medium italic leading-relaxed bg-slate-50 rounded-2xl p-4">
                    {guide.bio}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all text-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
