"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, Sparkles, Headset, Cpu, LogIn, AlertCircle, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type ChatMode = "ai" | "officer" | "guide";

interface Message {
  role: "user" | "assistant" | "admin";
  content: string;
  created_at?: string;
  sender_role?: string;
}

interface AIChatProps {
  onClose?: () => void;
  initialMode?: ChatMode;
  lockMode?: boolean;
}

export default function AIChat({ onClose, initialMode = "ai", lockMode = false }: AIChatProps) {
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [user, setUser] = useState<any>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Unified Message State
  const [messages, setMessages] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isOfficerOnline, setIsOfficerOnline] = useState(false);

  const [input, setInput] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guide Booking States
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({ date: "", pax: "1" });
  const [isBooking, setIsBooking] = useState(false);
  const [dbGuides, setDbGuides] = useState<any[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);

  useEffect(() => {
    if (mode === 'guide') {
      fetchDbGuides();
    }
  }, [mode]);

  async function fetchDbGuides() {
    setGuidesLoading(true);
    try {
      const { data, error } = await supabase
        .from('tour_guides')
        .select('*')
        .eq('status', 'approved');
      
      if (error) throw error;
      if (data && data.length > 0) {
        setDbGuides(data.map(g => ({
          id: g.id,
          name: g.full_name,
          title: g.bio?.slice(0, 30) + (g.bio?.length > 30 ? '...' : ''),
          exp: `${g.experience_years} Years`,
          tags: g.specialty || [],
          price: g.price || 1200, // Fallback price
          img: g.profile_image_url || "/placeholder-user.png",
          bio: g.bio
        })));
      }
    } catch (e) {
      console.error("Fetch guides error:", e);
    } finally {
      setGuidesLoading(false);
    }
  }


  // 1. Check Session & Guest ID
  useEffect(() => {
    async function init() {
      // Handle Registration/Auth User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('tourists').select('*').eq('email', authUser.email).maybeSingle();
        setUser(profile || authUser);
      } else {
        setUser(null);
      }

      // Handle Guest ID (Persistent per browser)
      let gId = localStorage.getItem('roam_blon_guest_id');
      if (!gId) {
        gId = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('roam_blon_guest_id', gId);
      }
      setGuestId(gId);
      
      // Check if any admin is online
      const { data: onlineCheck } = await supabase.from('admins').select('id').limit(1);
      if (onlineCheck) setIsOfficerOnline(true);
      
      setLoading(false);
    }
    
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      init();
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // 2. Room Management
  useEffect(() => {
    if (guestId || user) {
      initRoom();
    }
  }, [guestId, user, mode]);

  async function initRoom() {
    // Prefer user email, fallback to guest ID
    const identifier = user?.email || guestId;
    if (!identifier) return;
    
    // SEPARATE CONVERSATIONS: Append mode to identifier so each mode has its own history
    const roomIdentifier = `${identifier}_${mode}`;

    let { data: room } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('tourist_email', roomIdentifier)
      .eq('status', 'active')
      .maybeSingle();

    if (!room) {
      // Create new room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          tourist_email: roomIdentifier,
          tourist_name: user 
            ? `${user.first_name || ''} ${user.last_name || ''} (${mode === 'ai' ? 'AI' : 'Support'})`.trim() 
            : `Guest (${mode === 'ai' ? 'AI' : 'Support'})`,
          status: 'active'
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Room creation error:", createError);
        return;
      }
      room = newRoom;
    }

    if (room) {
      setActiveRoom(room);
      // Fetch initial messages
      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });
      
      if (!history || history.length === 0) {
        setMessages([{
          sender_role: mode === 'officer' ? 'admin' : 'assistant',
          content: mode === 'ai' 
            ? "Mabuhay! 🏝️ I'm your Romblon AI Travel Buddy. Ask me anything about our beautiful islands!"
            : "Hello! 🎧 I'm a Tourism Officer. How can I assist you with your travel plans today?"
        }]);
      } else {
        setMessages(history);
      }
    }
  }

  // 3. Realtime Subscription + Polling Fallback
  useEffect(() => {
    if (!activeRoom) return;

    const roomId = activeRoom.id;

    // --- Realtime subscription (instant updates when it works) ---
    const channel = supabase
      .channel(`room_messages_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const incoming = payload.new as any;

          setMessages(prev => {
            if (incoming.id && prev.some(m => String(m.id) === String(incoming.id))) {
              return prev;
            }

            const optimisticIdx = prev.findIndex(
              m => !m.id && m.content === incoming.content && m.sender_role === incoming.sender_role
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = incoming;
              return updated;
            }

            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    // --- Polling fallback (catches admin replies if realtime misses them) ---
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(prev => {
          // Only update if the DB has more messages than our local state
          // (or if the last message is different — catches missed admin replies)
          const prevWithIds = prev.filter(m => m.id);
          if (data.length > prevWithIds.length) {
            return data;
          }
          // Also update if the latest message content differs
          const lastLocal = prevWithIds[prevWithIds.length - 1];
          const lastDb = data[data.length - 1];
          if (lastDb && (!lastLocal || String(lastLocal.id) !== String(lastDb.id))) {
            return data;
          }
          return prev;
        });
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [activeRoom]);

  // 4. Scroll to Bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAiTyping, mode]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || !activeRoom) return;

    const identifier = user?.email || guestId;
    const userMsg = {
      room_id: activeRoom.id,
      content: query,
      sender_role: 'tourist',
      sender_email: identifier,
      created_at: new Date().toISOString()
    };

    // 1. Optimistic Update & Persistence
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    const { error: sendError } = await supabase.from('chat_messages').insert([userMsg]);
    if (sendError) console.error("Msg send error:", sendError);

    await supabase.from('chat_rooms').update({
      latest_message: query,
      updated_at: new Date().toISOString()
    }).eq('id', activeRoom.id);

    if (mode === "ai") {
      setIsAiTyping(true);
      try {
        // Prepare history for AI (convert formats)
        const aiHistory = messages.filter(m => m.sender_role !== 'admin').map(m => ({
          role: m.sender_role === 'assistant' ? 'assistant' : 'user',
          parts: [{ text: m.content }]
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: query, history: aiHistory }),
        });
        const data = await res.json();
        const rawText = data?.text || "The signal is a bit weak! try again.";
        const aiContent = rawText.replace(/\*/g, '');
        
        const aiMsg = {
          room_id: activeRoom.id,
          content: aiContent,
          sender_role: 'assistant',
          sender_email: 'ai@roam-blon.com',
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMsg]);
        await supabase.from('chat_messages').insert([aiMsg]);
        await supabase.from('chat_rooms').update({
          latest_message: aiContent,
          updated_at: new Date().toISOString()
        }).eq('id', activeRoom.id);

      } catch (err) {
        console.error("AI Error:", err);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col h-full w-full bg-white items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-rose-500" size={32} />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparing Island Guide...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      
      {/* CONSOLIDATED HEADER FOR MOBILE & DESKTOP */}
      <header className="shrink-0 bg-[#0f172a] text-white overflow-hidden shadow-xl">
        <div className="px-5 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-900/40">
                {mode === "ai" ? <Sparkles size={16} className="text-white" /> : mode === "guide" ? <Compass size={16} className="text-white" /> : <Headset size={16} className="text-white" />}
              </div>
              <div>
                <h5 className="font-black text-sm uppercase tracking-tight leading-none">
                  {mode === "ai" ? "AI Buddy Guide" : mode === "guide" ? "Professional Guides" : "Live Island Support"}
                </h5>
                <p className="text-[10px] font-black uppercase text-rose-400 tracking-tighter mt-1">
                  {mode === "ai" ? "Smart AI Assistant" : mode === "guide" ? "Book Local Experts" : "Talk to a Tourism Officer"}
                </p>
              </div>
           </div>
           {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="text-white/40 hover:text-white hover:bg-white/10 h-10 w-10 rounded-2xl transition-all"
              >
                <AlertCircle size={20} className="rotate-45" /> 
              </Button>
           )}
        </div>

        {/* MODE SELECTOR - HIDDEN IF LOCKED */}
        {!lockMode && (
          <div className="px-3 pb-4">
            <div className="flex bg-white/10 p-1 rounded-2xl border border-white/5 relative overflow-hidden backdrop-blur-md">
              <button 
                onClick={() => setMode("ai")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${mode === "ai" ? "text-slate-900" : "text-white/60 hover:text-white"}`}
              >
                AI
              </button>
              <button 
                onClick={() => setMode("officer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${mode === "officer" ? "text-slate-900" : "text-white/60 hover:text-white"}`}
              >
                Support
              </button>
              <button 
                onClick={() => setMode("guide")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${mode === "guide" ? "text-slate-900" : "text-white/60 hover:text-white"}`}
              >
                Guides
              </button>
              
              {/* Sliding Track */}
              <div className={`absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white rounded-xl shadow-lg transition-all duration-300 ${
                mode === "ai" ? "left-1" : mode === "officer" ? "left-[33.33%]" : "left-[66.66%]"
              }`} />
            </div>
          </div>
        )}
      </header>

      {/* MESSAGES AREA / CONTENT */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 py-6 bg-white relative no-scrollbar"
      >
        {mode === "guide" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedGuide ? (
              <div className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100">
                <button onClick={() => setSelectedGuide(null)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  ← Back to List
                </button>
                <div className="flex gap-4 mb-6">
                  <img src={selectedGuide.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt={selectedGuide.name} />
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase italic">{selectedGuide.name}</h4>
                    <p className="text-[10px] font-black text-rose-500 uppercase">{selectedGuide.title}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Select Date</label>
                    <input 
                      type="date" 
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-rose-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Number of People</label>
                    <select 
                      value={bookingForm.pax}
                      onChange={(e) => setBookingForm({...bookingForm, pax: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-rose-500"
                    >
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Person{n>1?'s':''}</option>)}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={async () => {
                      if (!user) { alert("Please login to book a guide!"); return; }
                      if (!bookingForm.date) { alert("Please select a date!"); return; }
                      setIsBooking(true);
                      const { error } = await supabase.from('tour_guide_bookings').insert({
                        tourist_email: user.email,
                        guide_name: selectedGuide.name,
                        booking_date: bookingForm.date,
                        pax: parseInt(bookingForm.pax),
                        total_price: selectedGuide.price * parseInt(bookingForm.pax),
                        status: 'pending'
                      });
                      setIsBooking(false);
                      if (error) alert("Error booking: " + error.message);
                      else {
                        alert("Booking request sent! Check 'My Bookings'.");
                        setSelectedGuide(null);
                      }
                    }}
                    className="w-full bg-slate-900 text-white font-black uppercase py-6 rounded-2xl shadow-xl hover:bg-rose-500 transition-all text-xs tracking-widest"
                    disabled={isBooking}
                  >
                    {isBooking ? "PROCESSING..." : `CONFIRM BOOKING (₱${selectedGuide.price * parseInt(bookingForm.pax)})`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center pb-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Local Experts</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hand-picked guides for your island journey</p>
                </div>
                {guidesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-rose-500" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Finding Local Experts...</p>
                  </div>
                ) : dbGuides.length > 0 ? (
                  <div className="space-y-4">
                    {dbGuides.map((guide) => (
                      <div 
                        key={guide.id}
                        className="bg-slate-50 rounded-[2rem] p-5 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all border-2 border-transparent hover:border-slate-100"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-white shadow-inner overflow-hidden border-2 border-white">
                               <img src={guide.img} alt={guide.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div>
                               <h4 className="font-black text-slate-900 uppercase italic leading-none mb-1">{guide.name}</h4>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{guide.title} • {guide.exp}</p>
                               <div className="flex gap-1.5">
                                  {guide.tags.slice(0, 2).map((tag: string) => (
                                     <span key={tag} className="text-[8px] font-black uppercase tracking-tighter bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full">{tag}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-2">
                             <div className="text-sm font-black text-slate-900 italic leading-none">₱{guide.price}</div>
                             <button 
                                onClick={() => setSelectedGuide(guide)}
                                className="bg-[#151c2f] hover:bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all"
                             >
                                BOOK
                             </button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No guides available right now.</p>
                  </div>
                )}
                
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-900 leading-relaxed uppercase">All guides are DOT-accredited and verified for your safety.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(mode === "ai" || mode === "officer") && (
          <div className="space-y-6">
            {mode === "officer" && (
              <div className="flex items-center justify-center mb-8">
                <div className="px-4 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-200 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  {isOfficerOnline ? "Tourism Officer Online" : "Support Standby"}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender_role === "tourist" ? "justify-end" : "justify-start animate-in fade-in slide-in-from-bottom-2"}`}>
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <span className="text-[8px] font-black uppercase tracking-widest ml-4 transition-colors">
                    {msg.sender_role === 'assistant' ? "Travel Guru AI" : msg.sender_role === 'admin' ? "Tourism Officer" : ""}
                  </span>
                  <div className={`px-4 py-3 rounded-[1.5rem] text-[13px] shadow-sm leading-relaxed ${
                    msg.sender_role === "tourist" 
                      ? "bg-slate-900 text-white rounded-tr-none" 
                      : msg.sender_role === 'admin'
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-tl-none font-medium"
                        : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none font-medium"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest italic animate-pulse">
                <Loader2 className="animate-spin" size={10} /> Guide is thinking...
              </div>
            )}
            <div className="h-4 w-full shrink-0" />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      {(mode === "ai" || mode === "officer") && (
        <footer className="shrink-0 p-4 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-1.5 border border-slate-200 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-400 transition-all shadow-inner">
            <input
              className="flex-1 bg-transparent py-2.5 text-[13px] outline-none text-slate-700 min-w-0 font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={mode === "ai" ? "Ask your Romblon Travel Guru..." : "Message the Tourism Office..."}
              disabled={isAiTyping}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isAiTyping} 
              className="rounded-xl h-9 w-9 p-0 shrink-0 shadow-lg transition-all active:scale-90 bg-rose-500 hover:bg-rose-600 shadow-rose-100 flex items-center justify-center text-white"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-3 text-center flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
              {mode === "ai" ? (
                <><Sparkles size={10} className="text-rose-400" /> Powered by Gemini 2.5</>
              ) : (
                <><Headset size={10} className="text-emerald-400" /> Tourism Officer Support</>
              )}
            </span>
            {mode === "ai" && (
              <span className="text-[8px] font-bold text-slate-400">AI can make mistakes. Check important info.</span>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}