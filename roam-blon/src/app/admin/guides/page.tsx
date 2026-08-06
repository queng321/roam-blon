"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Compass, 
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
  ChevronRight,
  Mail,
  GraduationCap
} from "lucide-react";

export default function GuideAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>({
    first_name: "Admin",
    last_name: "System",
    email: "owner@roam-blon.com",
    role: "admin"
  });
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; guideId: string | null; status: 'approved' | 'declined' }>({
    isOpen: false,
    guideId: null,
    status: 'approved'
  });

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tour_guides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (err) {
      console.error("Fetch guides error:", err) ;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email === 'owner@roam-blon.com') {
           setUser({ ...user, role: "admin", first_name: "Master", last_name: "Admin" });
        }
      }
      await fetchGuides();
    }
    checkUser();

    const channel = supabase
      .channel('tour-guide-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_guides' }, () => {
        fetchGuides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateGuideStatus = async (id: string, status: 'approved' | 'declined') => {
    try {
      const { error } = await supabase
        .from('tour_guides')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setStatusModal({ isOpen: false, guideId: null, status: 'approved' });
      fetchGuides();
    } catch (err: any) {
      alert(`Update Error: ${err.message}`);
    }
  };

  const toggleGuideAvailability = async (id: string, currentAvailable?: boolean) => {
    const newStatus = !(currentAvailable !== false);
    try {
      const { error } = await supabase
        .from('tour_guides')
        .update({ is_available: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchGuides();
    } catch (err: any) {
      setGuides(prev => prev.map(g => g.id === id ? { ...g, is_available: newStatus } : g));
    }
  };

  const filteredGuides = guides.filter(g => {
    const matchesSearch = (g.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (g.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
         <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Loading Applications...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F6F1ED] text-slate-900 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 p-10 shrink-0 text-white h-full relative">
         <div className="mb-14">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#FAEEED] rounded-xl flex items-center justify-center border border-rose-200 overflow-hidden shadow-inner">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-xl font-black uppercase text-white leading-none tracking-tighter">ROAM-BLON</h1>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none mt-0.5">Guide Admin</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
           <button className="w-full flex items-center gap-4 px-6 py-4 bg-rose-500 text-white shadow-xl shadow-rose-500/30 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all">
              <Compass size={18} /> Guide Approval
           </button>
        </nav>

        <div className="pt-8 border-t border-slate-800/50">
           <button 
             onClick={() => setIsLogoutModalOpen(true)}
             className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all"
           >
             <LogOut size={18} /> Logout
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-8 lg:p-16 max-w-7xl mx-auto space-y-12 pb-32">
           <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Application Portal</h3>
                 </div>
                 <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Guide Approvals &amp; Availability</h2>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-center">
                 <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name or email..." 
                      className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-rose-500 transition-all shadow-sm" 
                    />
                 </div>
                 
                 <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
                    {['all', 'pending', 'approved', 'declined'].map((s) => (
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
           </header>

           <div className="grid grid-cols-1 gap-8">
              {filteredGuides.length > 0 ? filteredGuides.map((guide) => {
                 const isAvailable = guide.is_available !== false;
                 return (
                  <div key={guide.id} className="bg-white rounded-[3.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col lg:flex-row gap-10 items-center">
                     <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform shrink-0 relative">
                        <img src={guide.profile_image_url || "/placeholder-user.png"} alt={guide.full_name} className="w-full h-full object-cover" />
                     </div>

                     <div className="flex-1 space-y-6 text-center lg:text-left">
                        <div>
                           <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
                              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 guide.status === 'approved' ? 'bg-emerald-500 text-white' : 
                                 guide.status === 'declined' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'
                              }`}>
                                 {guide.status}
                              </span>

                              {/* Availability Pill */}
                              <button
                                onClick={() => toggleGuideAvailability(guide.id, guide.is_available)}
                                title="Click to toggle availability"
                                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                                  isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                              </button>

                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {guide.id.slice(0, 8)}</span>
                           </div>
                           <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{guide.full_name}</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <Metric icon={<Mail size={14}/>} label="Email" value={guide.email} />
                           <Metric icon={<GraduationCap size={14}/>} label="Exp" value={`${guide.experience_years || 5} Years`} />
                        </div>
                     </div>

                     <div className="lg:border-l border-slate-100 lg:pl-10 flex flex-col gap-4 w-full lg:w-auto">
                        <button 
                          onClick={() => toggleGuideAvailability(guide.id, guide.is_available)}
                          className={`w-full py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isAvailable ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-800 text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          Mark as {isAvailable ? 'Unavailable' : 'Available'}
                        </button>

                        {guide.status === 'pending' ? (
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setStatusModal({ isOpen: true, guideId: guide.id, status: 'approved' })}
                                className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => setStatusModal({ isOpen: true, guideId: guide.id, status: 'declined' })}
                                className="flex-1 bg-white border border-slate-200 text-rose-500 font-black py-4 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                              >
                                Decline
                              </button>
                           </div>
                        ) : (
                           <button 
                             onClick={() => setStatusModal({ isOpen: true, guideId: guide.id, status: guide.status === 'approved' ? 'declined' : 'approved' })}
                             className="w-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-900 font-black py-4 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                           >
                              Revoke/Change Status
                           </button>
                        )}
                     </div>
                  </div>
                 );
              }) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No guides found matching filters.</p>
                </div>
              )}
           </div>
        </main>
      </div>

      {/* CONFIRMATION MODAL */}
      {statusModal.isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setStatusModal({ ...statusModal, isOpen: false })} />
            <div className="relative bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl border border-white/20 text-center animate-in zoom-in duration-300">
               <div className={`h-20 w-20 mx-auto mb-6 ${statusModal.status === 'declined' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'} rounded-3xl flex items-center justify-center border`}>
                  {statusModal.status === 'declined' ? <XCircle size={40} /> : <CheckCircle2 size={40} />}
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">{statusModal.status === 'declined' ? 'Decline Guide?' : 'Approve Guide?'}</h3>
               <p className="text-slate-500 font-medium mb-10">This action will update the guide's status across the island network.</p>
               
               <div className="flex gap-4">
                  <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className="flex-1 px-8 py-5 bg-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest">Cancel</button>
                  <button 
                    onClick={() => updateGuideStatus(statusModal.guideId!, statusModal.status)}
                    className={`flex-1 px-8 py-5 ${statusModal.status === 'declined' ? 'bg-rose-500' : 'bg-slate-900'} text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-200`}
                  >
                    Confirm
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* LOGOUT */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl text-center">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 mb-8">Exit Admin Console?</h3>
            <div className="flex gap-4">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">No</button>
              <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
       <div className="text-slate-400">
          {icon}
       </div>
       <div>
          <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">{label}</p>
          <p className="text-xs font-bold text-slate-800 leading-none">{value}</p>
       </div>
    </div>
  );
}
