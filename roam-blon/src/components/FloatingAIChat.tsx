"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles, Headset } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AIChat from "@/components/AIChat";

export default function FloatingAIChat() {
  const pathname = usePathname();
  const [activeChat, setActiveChat] = useState<"ai" | "officer" | null>(null);
  const [chatMode, setChatMode] = useState<"ai" | "officer">("ai");
  const [unreadAi, setUnreadAi] = useState(false);
  const [unreadOfficer, setUnreadOfficer] = useState(false);

  // Check for the hiding class and handle pathname masking
  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      setActiveChat(null);
      return;
    }

    const checkClass = () => {
      if (typeof document !== 'undefined' && document.body.classList.contains('hide-ai-chat')) {
        setActiveChat(null);
      }
    };

    checkClass();
    const observer = new MutationObserver(checkClass);
    if (typeof document !== 'undefined') {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, [pathname]);

  // Background Notification Logic
  useEffect(() => {
    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const gId = typeof window !== 'undefined' ? localStorage.getItem('roam_blon_guest_id') : null;
      const identifier = user?.email || gId;
      if (!identifier) return;

      // Fetch active rooms for this user
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id, tourist_email')
        .ilike('tourist_email', `${identifier}_%`)
        .eq('status', 'active');

      if (!rooms || rooms.length === 0) return;

      const userRooms = rooms.map(r => r.id);

      const channel = supabase
        .channel('background-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const msg = payload.new as any;
          // Only notify if message is from server/admin and chat window is NOT open to that mode
          if (userRooms.includes(msg.room_id) && msg.sender_role === 'assistant') {
            setActiveChat(current => {
              if (current !== 'ai') setUnreadAi(true);
              return current;
            });
          }
          if (userRooms.includes(msg.room_id) && msg.sender_role === 'admin') {
            setActiveChat(current => {
              if (current !== 'officer') setUnreadOfficer(true);
              return current;
            });
          }
        })
        .subscribe();
      
      return channel;
    };

    let subChannel: any;
    initNotifications().then(ch => subChannel = ch);

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      if (subChannel) supabase.removeChannel(subChannel);
      initNotifications().then(ch => subChannel = ch);
    });

    return () => { 
      if (subChannel) supabase.removeChannel(subChannel); 
      if (authListener?.subscription) authListener.subscription.unsubscribe();
    };
  }, []); // Only run once on mount

  // Listen for page-level AI open event
  useEffect(() => {
    const handler = () => setActiveChat('ai');
    window.addEventListener('roam-blon-open-ai-chat', handler);
    return () => window.removeEventListener('roam-blon-open-ai-chat', handler);
  }, []);

  // Clear unread state when chat is opened
  useEffect(() => {
    if (activeChat === 'ai') setUnreadAi(false);
    if (activeChat === 'officer') setUnreadOfficer(false);
  }, [activeChat]);

  const shouldHide = pathname?.startsWith('/admin') || (typeof document !== 'undefined' && document.body.classList.contains('hide-ai-chat'));

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[600] flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Chat Window — kept mounted so the conversation stays inside when closed */}
      <div className={`mb-2 w-[calc(100vw-32px)] md:w-[480px] h-[650px] max-h-[calc(100vh-120px)] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 pointer-events-auto ${
        activeChat
          ? "animate-in slide-in-from-bottom-8 fade-in duration-300"
          : "opacity-0 pointer-events-none translate-y-4 scale-95"
      }`}>
        <AIChat 
          key={chatMode}
          onClose={() => setActiveChat(null)} 
          initialMode={chatMode} 
          lockMode={true} 
        />
      </div>

      <div className="flex flex-row md:flex-col gap-3 pointer-events-auto">
        {/* Officer/Live Support Button */}
        <button 
          onClick={() => {
            if (activeChat === "officer") { setActiveChat(null); }
            else { setChatMode("officer"); setActiveChat("officer"); }
          }}
          className={`h-14 w-14 md:h-[60px] md:w-[60px] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] border-[3px] md:border-4 border-white transition-all duration-300 flex items-center justify-center group relative ${
            activeChat === "officer" ? 'bg-rose-500 rotate-90 scale-95' : 'bg-[#0f172a] hover:scale-105 active:scale-95'
          }`}
        >
          {activeChat === "officer" ? (
            <X size={28} className="text-white" />
          ) : (
            <>
              <Headset size={28} className="text-white" strokeWidth={2} />
      
              <span className="absolute right-full mr-3 px-3 py-1 bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">Live Support</span>
            </>
          )}
        </button>

        {/* AI Buddy Button */}
        <button 
          onClick={() => {
            if (activeChat === "ai") { setActiveChat(null); }
            else { setChatMode("ai"); setActiveChat("ai"); }
          }} 
          className={`h-14 w-14 md:h-[60px] md:w-[60px] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] border-[3px] md:border-4 border-white transition-all duration-300 flex items-center justify-center group relative ${
            activeChat === "ai" ? 'bg-rose-500 -rotate-90 scale-95' : 'bg-gradient-to-tr from-[#1e293b] to-[#334155] hover:scale-105 active:scale-95'
          }`}
        >
          {activeChat === "ai" ? (
            <X size={28} className="text-white" />
          ) : (
            <>
              <Sparkles size={28} className="text-white" strokeWidth={2} />
              {unreadAi && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-white shadow-lg animate-pulse" />
              )}
              <span className="absolute right-full mr-3 px-3 py-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">AI Buddy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
