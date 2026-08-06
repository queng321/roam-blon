"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Bike, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Calendar, 
  LogOut, 
  AlertCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  TrendingUp,
  Package,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import UnifiedAuthFlow from "@/components/TouristAuthFlow";

export default function RentalAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>({
    first_name: "Maira",
    last_name: "Sjq",
    email: "owner@roam-blon.com",
    role: "rental_owner"
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("requests");
  const [inventory, setInventory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; bookingId: string | null; status: 'confirmed' | 'rejected'; reason: string }>({
    isOpen: false,
    bookingId: null,
    status: 'confirmed',
    reason: ""
  });

  const fetchBookings = async (ownerId?: string) => {
    setLoading(true);
    try {
      let query = supabase.from('rental_bookings').select('*').order('id', { ascending: false });
      if (ownerId) query = query.eq('owner_id', ownerId);
      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (ownerId?: string) => {
    try {
      let query = supabase.from('rentals').select('*');
      if (ownerId) query = query.eq('owner_id', ownerId);
      const { data } = await query;
      setInventory(data || []);
    } catch (e) {
      console.error("Fetch inventory error:", e);
    }
  };

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('rental_owners')
          .select("*")
          .eq('email', user.email)
          .maybeSingle();
          
        if (profile) {
          setUser({ ...profile, role: "rental_owner" });
          await Promise.all([
            fetchBookings(profile.id),
            fetchInventory(profile.id)
          ]);
        } else {
          await Promise.all([fetchBookings(), fetchInventory()]);
        }
      } else {
        await Promise.all([fetchBookings(), fetchInventory()]);
      }
      setLoading(false);
    }
    checkUser();

    // ── REAL-TIME SUBSCRIPTIONS ──────────────────────────────────────────
    // Listen for new rental requests to update the owner dashboard instantly
    const channel = supabase
      .channel('rental-owner-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rental_bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleAuthComplete = async (userData: any) => {
    setUser(userData);
    if (userData.role !== 'rental_owner') {
      alert("Access Denied: Rental Owners Only.");
      processLogout();
    } else {
      await fetchBookings();
    }
  };

  const processLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLogoutModalOpen(false);
    router.push('/');
  };

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'rejected', reason?: string) => {
    try {
      const { error } = await supabase
        .from('rental_bookings')
        .update({ 
          status, 
          rejection_reason: reason || null 
        })
        .eq('id', id);

      if (error) throw error;
      
      setStatusModal({ isOpen: false, bookingId: null, status: 'confirmed', reason: "" });
      setEditingId(null);
      fetchBookings();
    } catch (err: any) {
      alert(`Update Error: ${err.message}`);
    }
  };

  // Logic for filtering and stats
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (b.item_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalEarnings = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((acc, b) => acc + (b.total_price || 0), 0);
    
  const potentialRevenue = bookings
    .filter(b => b.status === 'pending')
    .reduce((acc, b) => acc + (b.total_price || 0), 0);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
         <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Verifying Session...</p>
         </div>
      </div>
    );
  }

  if (!user && !loading) {
    return <UnifiedAuthFlow onComplete={handleAuthComplete} initialRole="rental_owner" initialScreen="signin" />;
  }

  return (
    <div className="flex h-screen bg-[#F6F1ED] text-slate-900 overflow-hidden font-sans">
      {/* SIDEBAR BACKDROP (Mobile Only) - REMOVED for clean dropdown experience */}


      {/* --- SIDEBAR (Desktop Only) --- */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 p-10 shrink-0 text-white h-full relative">
         {/* Sidebar header */}
         <div className="mb-14">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#FAEEED] rounded-xl flex items-center justify-center border border-rose-200 overflow-hidden shadow-inner">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-xl font-black uppercase text-white leading-none tracking-tighter">ROAM-BLON</h1>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none mt-0.5">Owner Dashboard</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Requests" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
          <SidebarItem icon={<Bike size={18} />} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarItem icon={<TrendingUp size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <SidebarItem icon={<ShieldCheck size={18} />} label="Verification" active={activeTab === 'verification'} onClick={() => setActiveTab('verification')} />
        </nav>

        <div className="pt-8 border-t border-slate-800/50 space-y-2">
           <SidebarItem icon={<Package size={18} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
           <button 
             onClick={() => { setIsLogoutModalOpen(true); setIsSidebarOpen(false); }}
             className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all"
           >
             <LogOut size={18} /> Logout
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <main className="flex-1 overflow-y-auto w-full p-0">
          <header className="sticky top-0 z-50 bg-white border-b-4 border-[#FAEEED] shadow-sm shrink-0 lg:hidden">
            <div className="h-24 lg:h-28 px-4 md:px-8 lg:px-16 flex items-center justify-between">
              {/* BRANDING (Mobile + Desktop Left) */}
              <div className="flex items-center gap-3 md:gap-4">
                 <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FAEEED] rounded-xl flex items-center justify-center border-2 border-rose-200 overflow-hidden shadow-inner">
                       <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                       <span className="font-black text-2xl md:text-3xl text-slate-900 uppercase tracking-tighter leading-none">ROAM-BLON</span>
                       <span className="text-[10px] md:text-xs font-bold text-rose-500 tracking-[0.2em] uppercase">Motorcycle Rental Concierge</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 lg:gap-6">
                 {/* User Profile Info (Desktop only) */}
                 <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                    <div className="text-right">
                       <p className="text-[9px] font-bold uppercase text-slate-400 leading-none mb-1">Authenticated</p>
                       <p className="text-sm font-bold text-slate-900 leading-none">{user?.first_name} {user?.last_name}</p>
                    </div>
                    <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic text-xs uppercase pt-0.5">
                       {user?.first_name?.[0] || 'O'}{user?.last_name?.[0] || 'R'}
                    </div>
                 </div>

                 {/* Mobile Hamburger Button (Top Right) */}
                 <button 
                   type="button"
                   onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
                   className="lg:hidden p-3.5 bg-slate-100 text-slate-900 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
                 >
                   {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                 </button>
              </div>
            </div>

            {/* MOBILE MENU DROPDOWN OVERLAY */}
            {isSidebarOpen && (
              <div className="lg:hidden absolute top-full left-0 right-0 w-full max-h-[calc(100vh-6rem)] overflow-y-auto z-40 bg-white/95 backdrop-blur-3xl animate-in slide-in-from-top duration-300 pointer-events-auto border-b-2 border-slate-100 pb-10 shadow-2xl">
                 <div className="flex flex-col p-6 gap-3">
                  {[
                    { id: 'requests', label: 'Requests', icon: <LayoutDashboard size={20}/> },
                    { id: 'inventory', label: 'Inventory', icon: <Bike size={20}/> },
                    { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={20}/> },
                    { id: 'verification', label: 'Verification', icon: <ShieldCheck size={20}/> },
                    { id: 'settings', label: 'Settings', icon: <Package size={20}/> }
                  ].map((item: any) => (
                    <button 
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                      className={`w-full px-6 py-5 rounded-2xl text-lg font-black transition-all text-left flex items-center gap-4 ${activeTab === item.id ? 'bg-rose-50 text-rose-600 border-2 border-rose-200 shadow-sm' : 'bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100'}`}
                    >
                      <span className={activeTab === item.id ? "text-rose-500" : "text-slate-400"}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  
                  <div className="border-t-2 border-slate-100 my-4 opacity-50"></div>
                  
                  <button 
                    onClick={() => { setIsLogoutModalOpen(true); setIsSidebarOpen(false); }}
                    className="w-full px-6 py-5 rounded-2xl text-lg font-black text-rose-500 bg-rose-50 border-2 border-rose-100 hover:bg-rose-100 transition-all text-left flex items-center gap-4"
                  >
                    <LogOut size={20}/> Logout
                  </button>
               </div>
            </div>
          )}
          </header>

          <div className="p-4 sm:p-8 lg:p-16 max-w-7xl mx-auto space-y-12 pb-32">
            
            {activeTab === 'requests' && (
              <>
                {/* STATS STRIP */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   <StatCard label="Actual Earnings" value={`₱${totalEarnings.toLocaleString()}`} icon={<ShieldCheck />} trend="+12% Verified" color="emerald" />
                   <StatCard label="Potential Revenue" value={`₱${potentialRevenue.toLocaleString()}`} icon={<TrendingUp />} trend="In Pipeline" color="amber" />
                   <StatCard label="Pending Approval" value={bookings.filter(b => b.status === 'pending').length} icon={<Clock />} trend="Requires Action" color="rose" />
                   <StatCard label="Total Bookings" value={bookings.length} icon={<Package />} trend="All Time" color="slate" />
                </div>

                <div className="space-y-8">
                   {/* ACTION BAR */}
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Incoming Reservations</h3>
                         </div>
                         <p className="text-sm text-slate-400 font-medium tracking-tight">Manage and process your motorcycle rental bookings</p>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                         <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search tourist or unit..." 
                              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all shadow-sm" 
                            />
                         </div>
                         
                         <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto">
                            {['all', 'pending', 'confirmed', 'rejected'].map((s) => (
                              <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                                  statusFilter === s ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {loading ? (
                      <div className="flex flex-col items-center justify-center py-40 gap-6">
                         <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing rental records...</p>
                      </div>
                   ) : filteredBookings.length > 0 ? (
                      <div className="grid grid-cols-1 gap-8">
                         {filteredBookings.map((booking) => (
                            <div key={booking.id} className="bg-white rounded-[2rem] sm:rounded-[3.5rem] border border-slate-200 p-6 sm:p-10 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col xl:flex-row gap-8 sm:gap-12 items-start xl:items-center">
                               <div className={`absolute top-0 left-0 w-1.5 sm:w-2.5 h-full ${
                                   booking.status === 'confirmed' ? 'bg-emerald-500' : 
                                   booking.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                               }`} />
                               
                               <div className="flex gap-3 sm:gap-4 shrink-0 overflow-x-auto w-full md:w-auto pb-4 md:pb-0 snap-x">
                                  <IDCard label="Front Side" url={booking.license_front_url} />
                                  <IDCard label="Back Side" url={booking.license_back_url} />
                               </div>

                               <div className="flex-1 space-y-8">
                                  <div>
                                     <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] shadow-sm ${
                                           booking.status === 'confirmed' ? 'bg-emerald-500 text-white' : 
                                           booking.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                           {booking.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref #RB-{booking.id?.toString().padStart(4, '0')}</span>
                                     </div>
                                     <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-rose-500 transition-colors">
                                        {booking.item_name}
                                     </h4>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                                     <Metric icon={<User />} label="Renter" value={booking.user_name} />
                                     <Metric icon={<Phone />} label="Contact" value={booking.contact_number} />
                                     <Metric icon={<Calendar />} label="Duration" value={`${booking.duration_days} Rental Days`} />
                                  </div>
                               </div>

                               <div className="xl:border-l border-slate-200 xl:pl-12 flex flex-col gap-8 items-end justify-center min-w-[240px] w-full xl:w-auto">
                                  <div className="text-right">
                                     <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-widest">Total Valuation</p>
                                     <div className="text-4xl font-black text-slate-900 tracking-tighter">₱{booking.total_price?.toLocaleString()}</div>
                                  </div>

                                  <div className="w-full space-y-3">
                                     { (booking.status === 'pending' || editingId === booking.id) ? (
                                        <>
                                           <button 
                                             onClick={() => setStatusModal({ isOpen: true, bookingId: booking.id, status: 'confirmed', reason: "" })}
                                             className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95"
                                           >
                                             Approve Ride
                                           </button>
                                           <button 
                                             onClick={() => setStatusModal({ isOpen: true, bookingId: booking.id, status: 'rejected', reason: "" })}
                                             className="w-full bg-white border-2 border-slate-100 hover:border-rose-100 text-rose-500 font-black py-4.5 rounded-2xl text-[11px] uppercase tracking-widest transition-all"
                                           >
                                             Reject Request
                                           </button>
                                        </>
                                     ) : (
                                       <div className="w-full space-y-3">
                                          {booking.rejection_reason && (
                                             <div className={`p-4 border rounded-3xl w-full text-left ${
                                                booking.status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'
                                             }`}>
                                                <p className={`text-[9px] font-black uppercase mb-1 flex items-center gap-1.5 ${
                                                   booking.status === 'rejected' ? 'text-rose-500' : 'text-blue-500'
                                                }`}>
                                                   {booking.status === 'rejected' ? <XCircle size={10}/> : <MessageSquare size={10}/>} 
                                                   {booking.status === 'rejected' ? 'Rejected Reason:' : 'Manager Note:'}
                                                </p>
                                                <p className={`text-xs font-bold italic leading-relaxed ${
                                                   booking.status === 'rejected' ? 'text-rose-900' : 'text-blue-900'
                                                }`}>"{booking.rejection_reason}"</p>
                                             </div>
                                          )}
                                          {booking.status === 'confirmed' && (
                                             <div className="p-4.5 bg-emerald-50 border border-emerald-100 rounded-2xl w-full text-center">
                                                <p className="text-[11px] font-bold uppercase text-emerald-600 flex items-center justify-center gap-2">
                                                   <CheckCircle2 size={16}/> Approved
                                                </p>
                                             </div>
                                          )}
                                          <button 
                                             onClick={() => setEditingId(booking.id)}
                                             className="w-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                                          >
                                             Update Status
                                          </button>
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="bg-white rounded-[4rem] p-32 text-center border-2 border-dashed border-slate-100 flex flex-col items-center">
                         <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                            <Search size={48} />
                         </div>
                         <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Results Found</h3>
                         <p className="text-slate-400 font-medium text-sm max-w-xs uppercase text-[10px] tracking-[0.2em] leading-loose">We couldn't find any rental records matching your criteria.</p>
                      </div>
                   )}
                </div>
              </>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Fleet Inventory</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Manage your vehicles and availability</p>
                  </div>
                  <button className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 hover:bg-rose-500 transition-all flex items-center gap-3">
                    <Package size={18}/> Add New Unit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {inventory.length > 0 ? inventory.map((item) => (
                    <div key={item.id} className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
                      <div className="aspect-[4/3] rounded-[2rem] bg-slate-100 mb-6 overflow-hidden border border-slate-100">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-4 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">Available</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {item.id.toString().slice(0, 6)}</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{item.name}</h4>
                        <div className="flex gap-4 pt-2">
                          <div className="flex-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Daily Rate</p>
                            <p className="text-lg font-black text-slate-900 italic">₱{item.price_per_day}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                            <button className="text-slate-400 hover:text-slate-900 transition-colors"><LayoutDashboard size={20}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-32 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                      <Bike size={48} className="text-slate-200 mb-6" />
                      <p className="text-slate-400 font-black uppercase text-[11px] tracking-widest">No vehicles registered in your fleet yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Business Analytics</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Track performance and revenue growth</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Detailed Analysis Card */}
                  <div className="lg:col-span-2 bg-slate-900 rounded-[3.5rem] p-10 md:p-14 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                      <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10 space-y-10">
                      <div>
                        <span className="px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6 inline-block">Monthly Forecast</span>
                        <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none">₱{(totalEarnings * 1.4).toLocaleString()}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Estimated revenue based on current trends</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 border-t border-white/10">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Growth</p>
                          <p className="text-2xl font-black text-rose-500 italic">+24%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Capacity</p>
                          <p className="text-2xl font-black text-white italic">82%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Repeat</p>
                          <p className="text-2xl font-black text-white italic">15%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Rank</p>
                          <p className="text-2xl font-black text-white italic">#3</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Unit Card */}
                  <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8">
                        <TrendingUp size={32}/>
                      </div>
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Most Popular Unit</h4>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">NMAX-ROAM-01</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase text-[9px] tracking-widest">Generating 45% of total revenue this month.</p>
                    </div>
                    <button className="w-full mt-10 py-5 bg-slate-50 hover:bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 border border-slate-100 transition-all">View Performance View</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Verification Portal</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Manage your business credentials</p>
                  </div>
                  <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3">
                    <ShieldCheck size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Trusted Partner</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm">
                    <h4 className="text-lg font-black text-slate-900 uppercase mb-6 tracking-tight italic">Compliance Documents</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Mayor\'s Permit', size: '1.2MB', status: 'Verified' },
                        { label: 'DTI Registration', size: '840KB', status: 'Verified' },
                        { label: 'Insurance Policy', size: '2.5MB', status: 'Expires in 30d' }
                      ].map((doc) => (
                        <div key={doc.label} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-rose-500 transition-colors shadow-sm"><Package size={18}/></div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{doc.label}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{doc.size}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>{doc.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150"><Package size={120}/></div>
                    <div>
                      <h4 className="text-lg font-black uppercase mb-2 tracking-tight italic text-rose-500">Missing Evidence?</h4>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-widest">Keep your account in good standing to avoid reservation holds.</p>
                    </div>
                    <button className="bg-white text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] mt-10 shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">Upload New Certificate</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Console Settings</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Manage your public profile and alerts</p>
                </div>

                <div className="max-w-3xl space-y-8">
                  <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Name</label>
                        <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 transition-all" value="Romblon Moto Rentals" readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Support Contact</label>
                        <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 transition-all" value={user?.contact_number || ""} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Facebook Booking Page</label>
                      <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 transition-all" value={user?.facebook || ""} />
                    </div>
                    <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 hover:bg-rose-500 transition-all">Save Changes</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* STATUS RESPONSE MODAL */}
      {statusModal.isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setStatusModal({ ...statusModal, isOpen: false })} />
            <div className="relative bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
               <div className="flex items-center gap-6 mb-10">
                  <div className={`h-16 w-16 ${statusModal.status === 'rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'} rounded-[1.5rem] flex items-center justify-center border shrink-0`}>
                     {statusModal.status === 'rejected' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                  </div>
                  <div>
                     <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">{statusModal.status === 'rejected' ? 'Decline Request' : 'Approve Request'}</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{statusModal.status === 'rejected' ? 'The tourist will see your reason immediately.' : 'Add optional instructions for the tourist.'}</p>
                  </div>
               </div>
               
               <div className="space-y-4 mb-10">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Response Note (Optional)</label>
                  <textarea 
                    autoFocus
                    value={statusModal.reason}
                    onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                    placeholder={statusModal.status === 'rejected' ? "e.g. ID is expired, or bike unavailable." : "e.g. Pickup at 9am, helmet ready."}
                    className="w-full h-44 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 focus:border-rose-500 outline-none font-bold text-sm transition-all shadow-inner"
                  />
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className="flex-1 px-8 py-5 bg-slate-100 hover:bg-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all">Cancel</button>
                  <button 
                    onClick={() => updateBookingStatus(statusModal.bookingId!, statusModal.status, statusModal.reason)}
                    className={`flex-2 px-12 py-5 ${statusModal.status === 'rejected' ? 'bg-rose-500 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'} text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all`}
                  >
                    Confirm {statusModal.status === 'rejected' ? 'Rejection' : 'Approval'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">Logout session</h3>
            <p className="text-slate-500 font-medium mb-8">Are you sure you want to exit the management console?</p>
            <div className="flex gap-4">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">No, Stay</button>
              <button onClick={processLogout} className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-rose-200">Yes, Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all ${active ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-white/10 group'}`}
    >
       <span className={active ? "text-white" : "text-slate-500 group-hover:text-white transition-colors"}>{icon}</span>
       <span className="group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    slate: "bg-slate-500/10 text-slate-500 border-slate-500/20"
  };
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
       <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border ${colorMap[color]}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
       </div>
       <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-widest">{label}</p>
       <div className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-4">{value}</div>
       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-rose-500 transition-colors">
          {trend}
       </div>
    </div>
  );
}

function Metric({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 p-2">
       <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 shadow-inner">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
       </div>
       <div>
          <p className="text-[10px] font-bold uppercase text-slate-400 leading-none mb-1.5 tracking-normal">{label}</p>
          <p className="text-sm font-semibold text-slate-800 leading-none">{value || 'Not provided'}</p>
       </div>
    </div>
  );
}

function IDCard({ label, url }: any) {
  return (
    <div className="w-28 h-40 md:w-36 md:h-52 bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative group/img transition-all hover:ring-4 hover:ring-rose-500/10">
       {url ? (
         <img src={url} alt={label} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
       ) : (
         <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-200/50 rounded-full flex items-center justify-center">
              <User size={24} className="text-slate-300" />
            </div>
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest opacity-60">No {label}</span>
         </div>
       )}
       <div className="absolute bottom-0 left-0 w-full p-3 bg-slate-900/80 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-[0.2em] text-center opacity-0 group-hover/img:opacity-100 transition-all transform translate-y-2 group-hover/img:translate-y-0">
          Enlarge {label}
       </div>
    </div>
  );
}