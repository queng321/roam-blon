"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, adminSupabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Compass,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Search,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Send,
  Check,
  X,
  UserCheck,
  TrendingUp,
  MapPin,
  Eye,
  RefreshCw,
  Menu
} from "lucide-react";

interface Booking {
  id: string;
  reference_code?: string;
  guide_name: string;
  guide_id?: string;
  tourist_name: string;
  tourist_email: string;
  tourist_nationality?: string;
  booking_date: string;
  booking_time?: string;
  day_of_tour?: string;
  destinations?: string;
  pax: number;
  total_price: number;
  notes?: string;
  status: "pending" | "approved" | "confirmed" | "declined" | "completed";
  created_at?: string;
}

interface ChatRoom {
  id: string;
  tourist_email: string;
  tourist_name?: string;
  latest_message?: string;
  updated_at?: string;
  status?: string;
}

interface ChatMessage {
  id?: string;
  room_id: string;
  sender_email: string;
  sender_role: "tourist" | "admin" | "guide";
  content: string;
  created_at?: string;
}

export default function TourGuideBookingsAdminPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const router = useRouter();

  // Loading & Auth
  const [loading, setLoading] = useState(!isEmbedded);
  const [unauthorized, setUnauthorized] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Main navigation & tabs (Only Bookings and Messages)
  const [activeTab, setActiveTab] = useState<"bookings" | "messages">("bookings");
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isClearingMessages, setIsClearingMessages] = useState(false);

  // Modals & Detail views
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotesValue, setEditNotesValue] = useState("");

  // New Booking form state
  const [newBookingForm, setNewBookingForm] = useState({
    guide_name: "",
    tourist_name: "",
    tourist_email: "",
    tourist_nationality: "Foreign",
    booking_date: new Date().toISOString().split("T")[0],
    booking_time: "09:00 AM",
    destinations: "Alibatan Island, Bonbon Beach",
    pax: 2,
    total_price: 3000,
    notes: ""
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    async function checkAuthAndLoad() {
      if (isEmbedded) {
        setLoading(false);
        await fetchAllData();
        return;
      }
      try {
        const { data: { user: currentUser } } = await adminSupabase.auth.getUser();
        if (currentUser) {
          if ((currentUser.email || "").toLowerCase() !== "admin@roam-blon.com") {
            setLoading(false);
            setUnauthorized(true);
            return;
          }
          setUser(currentUser);
        } else {
          setLoading(false);
          setUnauthorized(true);
          return;
        }

        await fetchAllData();
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoad();

    // Setup realtime subscription
    const channel = supabase
      .channel("admin-tour-guide-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tour_guide_bookings" },
        () => {
          fetchBookings();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          if (activeRoom) fetchRoomMessages(activeRoom.id);
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom?.id]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    await Promise.all([fetchBookings(), fetchChatRooms()]);
  };

  const fetchBookings = async () => {
    try {
      const { data } = await supabase
        .from("tour_guide_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      const remoteBookings: Booking[] = data || [];

      // Merge with localStorage fallbacks
      const localStored = JSON.parse(
        localStorage.getItem("roam_blon_tour_guide_bookings") || "[]"
      );

      const merged: Booking[] = [...remoteBookings];
      localStored.forEach((lb: Booking) => {
        if (!merged.some((b) => b.id === lb.id || (b.guide_name === lb.guide_name && b.booking_date === lb.booking_date && b.tourist_email === lb.tourist_email))) {
          merged.push(lb);
        }
      });

      setBookings(merged);
    } catch (e) {
      console.error("Error fetching bookings:", e);
      const localStored = JSON.parse(
        localStorage.getItem("roam_blon_tour_guide_bookings") || "[]"
      );
      setBookings(localStored);
    }
  };

  const fetchChatRooms = async () => {
    try {
      const { data } = await supabase
        .from("chat_rooms")
        .select("*")
        .order("updated_at", { ascending: false });

      if (data && data.length > 0) {
        setChatRooms(data);
        if (!activeRoom && data[0]) {
          setActiveRoom(data[0]);
          fetchRoomMessages(data[0].id);
        }
      } else {
        setChatRooms([]);
        setActiveRoom(null);
        setChatMessages([]);
      }
    } catch (e) {
      console.error("Error fetching chat rooms:", e);
    }
  };

  const fetchRoomMessages = async (roomId: string) => {
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      setChatMessages(data || []);
    } catch (e) {
      console.error("Error fetching room messages:", e);
    }
  };

  // --- ACTIONS ---
  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: "approved" | "declined" | "confirmed" | "completed"
  ) => {
    try {
      await supabase
        .from("tour_guide_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      const stored = JSON.parse(
        localStorage.getItem("roam_blon_tour_guide_bookings") || "[]"
      );
      const updatedStored = stored.map((b: Booking) =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      );
      localStorage.setItem(
        "roam_blon_tour_guide_bookings",
        JSON.stringify(updatedStored)
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking appointment?")) return;

    try {
      await supabase.from("tour_guide_bookings").delete().eq("id", bookingId);

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));

      const stored = JSON.parse(
        localStorage.getItem("roam_blon_tour_guide_bookings") || "[]"
      );
      const filteredStored = stored.filter((b: Booking) => b.id !== bookingId);
      localStorage.setItem(
        "roam_blon_tour_guide_bookings",
        JSON.stringify(filteredStored)
      );

      if (isBookingDetailOpen) setIsBookingDetailOpen(false);
    } catch (err) {
      console.error("Error deleting booking:", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    try {
      await supabase
        .from("tour_guide_bookings")
        .update({ notes: editNotesValue })
        .eq("id", selectedBooking.id);

      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, notes: editNotesValue } : b
        )
      );
      setSelectedBooking((prev) =>
        prev ? { ...prev, notes: editNotesValue } : null
      );
      setIsEditingNotes(false);
    } catch (err) {
      console.error("Error saving notes:", err);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingForm.guide_name || !newBookingForm.tourist_name) return;

    const refCode = "BK-" + Math.floor(100000 + Math.random() * 900000);
    const newBooking: Booking = {
      id: refCode,
      reference_code: refCode,
      guide_name: newBookingForm.guide_name,
      tourist_name: newBookingForm.tourist_name,
      tourist_email: newBookingForm.tourist_email || "tourist@roam-blon.com",
      tourist_nationality: newBookingForm.tourist_nationality,
      booking_date: newBookingForm.booking_date,
      booking_time: newBookingForm.booking_time,
      destinations: newBookingForm.destinations,
      pax: Number(newBookingForm.pax),
      total_price: Number(newBookingForm.total_price),
      notes: newBookingForm.notes,
      status: "pending",
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from("tour_guide_bookings").insert([newBooking]);
    } catch (e) {
      console.warn("Insert fallback to local storage:", e);
    }

    setBookings((prev) => [newBooking, ...prev]);

    const stored = JSON.parse(
      localStorage.getItem("roam_blon_tour_guide_bookings") || "[]"
    );
    localStorage.setItem(
      "roam_blon_tour_guide_bookings",
      JSON.stringify([newBooking, ...stored])
    );

    setIsNewBookingModalOpen(false);
    setNewBookingForm({
      guide_name: "",
      tourist_name: "",
      tourist_email: "",
      tourist_nationality: "Foreign",
      booking_date: new Date().toISOString().split("T")[0],
      booking_time: "09:00 AM",
      destinations: "Alibatan Island, Bonbon Beach",
      pax: 2,
      total_price: 3000,
      notes: ""
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeRoom) return;

    const content = messageInput.trim();
    setMessageInput("");
    setIsSendingMessage(true);

    const newMsg: ChatMessage = {
      room_id: activeRoom.id,
      sender_email: "admin@roam-blon.com",
      sender_role: "admin",
      content,
      created_at: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, newMsg]);

    try {
      await supabase.from("chat_messages").insert([newMsg]);
      await supabase
        .from("chat_rooms")
        .update({
          latest_message: content,
          updated_at: new Date().toISOString()
        })
        .eq("id", activeRoom.id);

      fetchChatRooms();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // CLEAR ALL TOURIST MESSAGES
  const handleClearAllMessages = async () => {
    if (!confirm("Are you sure you want to CLEAR ALL tourist messages? This action cannot be undone.")) return;

    setIsClearingMessages(true);
    try {
      if (activeRoom?.id) {
        await supabase.from("chat_messages").delete().eq("room_id", activeRoom.id);
      } else {
        await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

      setChatMessages([]);
      if (activeRoom?.id) {
        await supabase
          .from("chat_rooms")
          .update({ latest_message: "Messages cleared by admin", updated_at: new Date().toISOString() })
          .eq("id", activeRoom.id);
      }
      fetchChatRooms();
    } catch (err) {
      console.error("Error clearing messages:", err);
      setChatMessages([]);
    } finally {
      setIsClearingMessages(false);
    }
  };

  // --- FILTERS & COMPUTATIONS ---
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.tourist_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.tourist_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.guide_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.reference_code || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      bookingFilter === "all"
        ? true
        : bookingFilter === "pending"
        ? b.status === "pending"
        : bookingFilter === "approved"
        ? b.status === "approved" || b.status === "confirmed"
        : bookingFilter === "declined"
        ? b.status === "declined"
        : bookingFilter === "completed"
        ? b.status === "completed"
        : true;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter(
    (b) => b.status === "approved" || b.status === "confirmed"
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.status !== "declined")
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">
            Loading Tour Guide Console...
          </p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 text-center shadow-xl border border-slate-100 max-w-md w-full">
          <div className="w-20 h-20 mx-auto bg-rose-50 rounded-[1.75rem] flex items-center justify-center mb-6">
            <AlertCircle size={38} className="text-rose-500" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 mb-3">
            Access Denied
          </h3>
          <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8">
            This console is restricted to official Tour Guide Admins:
            <br />
            <span className="text-rose-600">admin@roam-blon.com</span>.
          </p>
          <button
            onClick={() => {
              adminSupabase.auth.signOut();
              router.push("/");
            }}
            className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "w-full" : "flex h-screen bg-[#F6F1ED] text-slate-900 overflow-hidden font-sans"}>

      {/* MOBILE SIDEBAR OVERLAY */}
      {!isEmbedded && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION (LOGOUT REMOVED) */}
      {!isEmbedded && (
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-80 bg-slate-900 p-8 shrink-0 text-white transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FAEEED] rounded-xl flex items-center justify-center border border-rose-200 overflow-hidden shadow-inner">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase text-white leading-none tracking-tighter">
                ROAM-BLON
              </h1>
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none mt-0.5">
                Tour Guide Admin
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all"
          >
            <LayoutDashboard size={18} /> Main Dashboard
          </button>

          <button
            onClick={() => router.push("/admin/guides")}
            className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all"
          >
            <Compass size={18} /> Guide Approvals
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all ${
              activeTab === "bookings"
                ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-4">
              <Calendar size={18} /> Appointments &amp; Bookings
            </div>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all ${
              activeTab === "messages"
                ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-4">
              <MessageSquare size={18} /> Tourist Messages
            </div>
            {chatRooms.length > 0 && (
              <span className="bg-rose-400/30 text-rose-300 font-black text-[10px] px-2 py-0.5 rounded-full">
                {chatRooms.length}
              </span>
            )}
          </button>
        </nav>
      </aside>
      )}

      {/* MAIN BODY AREA */}
      <div className={isEmbedded ? "w-full" : "flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]"}>
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {!isEmbedded && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu size={20} />
            </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tour Guide Booking Portal
                </p>
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {activeTab === "bookings" && "Booking Appointments & Approvals"}
                {activeTab === "messages" && "Tourist Messages & Inquiries"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAllData()}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setIsNewBookingModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
            >
              <Plus size={16} /> New Booking
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 pb-32">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Total Appointments
                </p>
                <h3 className="text-3xl font-black text-slate-900 italic">
                  {bookings.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
                <Calendar size={22} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Pending Approvals
                </p>
                <h3 className="text-3xl font-black text-amber-600 italic">
                  {pendingCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock size={22} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Approved / Upcoming
                </p>
                <h3 className="text-3xl font-black text-emerald-600 italic">
                  {approvedCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck size={22} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Total Earnings
                </p>
                <h3 className="text-3xl font-black text-rose-600 italic">
                  ₱{totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>

          {/* TAB 1: BOOKING APPOINTMENTS & APPROVALS */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              {/* SEARCH AND FILTER BAR */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tourist, guide, date, reference..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-rose-500 transition-all"
                  />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto w-full md:w-auto">
                  {[
                    { id: "all", label: "All" },
                    { id: "pending", label: `Pending (${pendingCount})` },
                    { id: "approved", label: "Approved" },
                    { id: "completed", label: "Completed" },
                    { id: "declined", label: "Declined" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setBookingFilter(tab.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        bookingFilter === tab.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOOKINGS LIST */}
              {filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredBookings.map((b) => {
                    const isPending = b.status === "pending";
                    const isApproved = b.status === "approved" || b.status === "confirmed";
                    const isDeclined = b.status === "declined";

                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                      >
                        {/* LEFT SECTION: Details */}
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                isPending
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : isApproved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isDeclined
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              ● {b.status}
                            </span>
                            <span className="text-xs font-black text-slate-400">
                              Ref: {b.reference_code || b.id.slice(0, 8)}
                            </span>
                            {b.tourist_nationality && (
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                {b.tourist_nationality}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xl font-black text-slate-900">
                              {b.tourist_name || "Guest Tourist"}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1">
                              <Mail size={13} className="text-slate-400" />
                              {b.tourist_email}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">
                                Guide Assigned
                              </p>
                              <p className="font-bold text-slate-900 mt-0.5">
                                {b.guide_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">
                                Date &amp; Time
                              </p>
                              <p className="font-bold text-slate-900 mt-0.5">
                                {b.booking_date} {b.booking_time ? `(${b.booking_time})` : ""}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">
                                Group Size
                              </p>
                              <p className="font-bold text-slate-900 mt-0.5">
                                {b.pax} {b.pax === 1 ? "Person" : "Pax"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">
                                Total Amount
                              </p>
                              <p className="font-black text-rose-600 mt-0.5">
                                ₱{(Number(b.total_price) || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {b.destinations && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <MapPin size={14} className="text-rose-500 shrink-0" />
                              <span className="font-bold text-slate-700">Destinations:</span>{" "}
                              {b.destinations}
                            </p>
                          )}
                        </div>

                        {/* RIGHT SECTION: Actions */}
                        <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 w-full lg:w-48">
                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateBookingStatus(b.id, "approved")
                                }
                                className="flex-1 lg:w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                              >
                                <CheckCircle2 size={15} /> Approve Booking
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateBookingStatus(b.id, "declined")
                                }
                                className="flex-1 lg:w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                              >
                                <XCircle size={15} /> Decline
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() =>
                                handleUpdateBookingStatus(b.id, "completed")
                              }
                              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                              <Check size={15} /> Mark Completed
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setEditNotesValue(b.notes || "");
                              setIsBookingDetailOpen(true);
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                          >
                            <Eye size={15} /> View Details &amp; Notes
                          </button>

                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="w-full text-slate-400 hover:text-rose-600 font-bold py-1 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
                  <Calendar size={48} className="text-slate-300 mx-auto mb-3" />
                  <h4 className="text-lg font-black uppercase text-slate-800">
                    No Booking Appointments Found
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Try changing your search query or filter options.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE TOURIST MESSAGES (WITH CLEAR ALL MESSAGES FEATURE) */}
          {activeTab === "messages" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* LEFT CONVERSATIONS LIST */}
              <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                      Tourist Conversations
                    </h3>
                    <button
                      onClick={handleClearAllMessages}
                      disabled={isClearingMessages}
                      className="text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-xl text-[10px] font-black uppercase border border-rose-200 transition-all flex items-center gap-1"
                      title="Clear all tourist messages"
                    >
                      <Trash2 size={12} /> Clear All
                    </button>
                  </div>
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      placeholder="Search email..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {chatRooms.length > 0 ? (
                    chatRooms.map((room) => {
                      const isActive = activeRoom?.id === room.id;
                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            setActiveRoom(room);
                            fetchRoomMessages(room.id);
                          }}
                          className={`p-4 cursor-pointer transition-all ${
                            isActive
                              ? "bg-white border-l-4 border-rose-500 shadow-sm"
                              : "hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-black text-slate-900 text-xs truncate max-w-[180px]">
                              {room.tourist_email}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400">
                              {room.updated_at
                                ? new Date(room.updated_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : ""}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate font-medium">
                            {room.latest_message || "No messages"}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-bold text-xs">
                      No active tourist chat rooms.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT ACTIVE MESSAGES CONVERSATION PANEL */}
              <div className="lg:col-span-2 flex flex-col h-full bg-white">
                {activeRoom ? (
                  <>
                    {/* THREAD HEADER */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xs">
                          {activeRoom.tourist_email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">
                            {activeRoom.tourist_email}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Tourist Inquirer
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleClearAllMessages}
                        disabled={isClearingMessages}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-rose-200 flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 size={13} /> Clear Thread
                      </button>
                    </div>

                    {/* MESSAGES LIST */}
                    <div
                      ref={chatScrollRef}
                      className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30"
                    >
                      {chatMessages.length > 0 ? (
                        chatMessages.map((msg, i) => {
                          const isAdmin = msg.sender_role === "admin" || msg.sender_role === "guide";
                          return (
                            <div
                              key={msg.id || i}
                              className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] p-4 rounded-2xl text-xs space-y-1 ${
                                  isAdmin
                                    ? "bg-slate-900 text-white rounded-br-none"
                                    : "bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none"
                                }`}
                              >
                                <p className="font-bold">{msg.content}</p>
                                <p
                                  className={`text-[9px] text-right font-medium ${
                                    isAdmin ? "text-slate-400" : "text-slate-400"
                                  }`}
                                >
                                  {msg.created_at
                                    ? new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })
                                    : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                          No messages in this thread. Type below to send a message.
                        </div>
                      )}
                    </div>

                    {/* CHAT INPUT AREA */}
                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 border-t border-slate-200 flex items-center gap-3 bg-white"
                    >
                      <input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type reply to tourist..."
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:border-rose-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                      >
                        <Send size={15} /> Reply
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <MessageSquare size={48} className="text-slate-300 mb-3" />
                    <h4 className="text-base font-black text-slate-700 uppercase">
                      Select a conversation
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Choose a tourist inquiry from the left panel to manage messages.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* BOOKING DETAIL & EDIT NOTES MODAL */}
      {isBookingDetailOpen && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsBookingDetailOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Appointment Overview
                </span>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {selectedBooking.tourist_name}
                </h3>
              </div>
              <button
                onClick={() => setIsBookingDetailOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[9px] uppercase text-slate-400 font-black">
                    Tour Guide
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {selectedBooking.guide_name}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-400 font-black">
                    Booking Status
                  </p>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white">
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-400 font-black">
                    Scheduled Date
                  </p>
                  <p className="text-slate-800">{selectedBooking.booking_date}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-400 font-black">
                    Total Amount
                  </p>
                  <p className="text-rose-600 font-black">
                    ₱{(Number(selectedBooking.total_price) || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Destinations &amp; Itinerary
                </p>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">
                  {selectedBooking.destinations || "Standard Island Hopping Tour"}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Special Notes / Instructions
                  </p>
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="text-rose-600 text-[10px] font-black uppercase flex items-center gap-1"
                  >
                    <Edit size={12} /> {isEditingNotes ? "Cancel" : "Edit Notes"}
                  </button>
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNotesValue}
                      onChange={(e) => setEditNotesValue(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-black uppercase"
                    >
                      Save Notes
                    </button>
                  </div>
                ) : (
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">
                    {selectedBooking.notes || "No extra instructions specified."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking.id, "approved")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking.id, "declined")}
                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW APPOINTMENT MODAL */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsNewBookingModalOpen(false)}
          />
          <form
            onSubmit={handleCreateBooking}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Create Tour Appointment
              </h3>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Tour Guide Name
                </label>
                <input
                  required
                  value={newBookingForm.guide_name}
                  onChange={(e) =>
                    setNewBookingForm({ ...newBookingForm, guide_name: e.target.value })
                  }
                  placeholder="e.g. Captain Juan Dela Cruz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tourist Name
                  </label>
                  <input
                    required
                    value={newBookingForm.tourist_name}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, tourist_name: e.target.value })
                    }
                    placeholder="Tourist Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tourist Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newBookingForm.tourist_email}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, tourist_email: e.target.value })
                    }
                    placeholder="email@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tour Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.booking_date}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, booking_date: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tour Time
                  </label>
                  <input
                    value={newBookingForm.booking_time}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, booking_time: e.target.value })
                    }
                    placeholder="09:00 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Pax Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newBookingForm.pax}
                    onChange={(e) =>
                      setNewBookingForm({
                        ...newBookingForm,
                        pax: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Total Price (₱)
                  </label>
                  <input
                    type="number"
                    value={newBookingForm.total_price}
                    onChange={(e) =>
                      setNewBookingForm({
                        ...newBookingForm,
                        total_price: Number(e.target.value)
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Destinations
                </label>
                <input
                  value={newBookingForm.destinations}
                  onChange={(e) =>
                    setNewBookingForm({ ...newBookingForm, destinations: e.target.value })
                  }
                  placeholder="Destinations list..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Special Notes
                </label>
                <textarea
                  value={newBookingForm.notes}
                  onChange={(e) =>
                    setNewBookingForm({ ...newBookingForm, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Any special requests..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all mt-4"
            >
              Create Appointment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
