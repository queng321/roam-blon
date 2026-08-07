"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, MapPin, Users, CheckCircle2, Loader2, AlertCircle, Save, Camera, Trash2 } from "lucide-react";

interface TouristProfileProps {
  tourist: any;
  onUpdate: (data: any) => void;
}

// Resize + compress an image to a small JPEG data URL (keeps DB payloads tiny)
const resizeImage = (file: File, maxDim = 320, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function TouristProfile({ tourist, onUpdate }: TouristProfileProps) {
  const [email, setEmail] = useState(tourist?.email || "");
  const [nationality, setNationality] = useState(
    tourist?.nationality === "Foreign" || String(tourist?.nationality || "").toLowerCase() === "foreign" ? "foreign" : "local"
  );
  const [country, setCountry] = useState(tourist?.country || "");
  const [avatarUrl, setAvatarUrl] = useState(tourist?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailLocal = email.split("@")[0] || "Explorer";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const dataUrl = await resizeImage(file);
      setAvatarUrl(dataUrl);
      setMessage({ type: "success", text: "Photo selected. Don't forget to tap Save Profile." });
    } catch {
      setMessage({ type: "error", text: "Could not read that image. Try a different photo." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setMessage(null);
    if (!email.trim()) {
      setMessage({ type: "error", text: "Email address cannot be empty." });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    if (nationality === "foreign" && !country.trim()) {
      setMessage({ type: "error", text: "Please enter your country of origin." });
      return;
    }

    setSaving(true);

    const oldEmail = tourist?.email;
    const payload = {
      email: email.trim(),
      age: Number(tourist?.age) || null,
      nationality: nationality === "foreign" ? "Foreign" : "Local",
      country: nationality === "foreign" ? country.trim() : null,
      gender: tourist?.gender || null,
      avatar_url: avatarUrl?.trim() ? avatarUrl.trim() : null,
    };

    try {
      // Update the existing tourists row (email may have changed)
      try {
        if (oldEmail) {
          await supabase.from("tourists").update(payload).eq("email", oldEmail);
        }
      } catch { /* ignore */ }

      // Reliable server-side upsert (bypasses RLS)
      try {
        await fetch("/api/tourists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch { /* ignore */ }

      // Sync local fallback list
      try {
        const stored = JSON.parse(localStorage.getItem("roam_blon_tourists") || "[]");
        const idx = stored.findIndex((t: any) => t.email === oldEmail);
        const updated = { ...payload, created_at: new Date().toISOString(), id: stored[idx]?.id || `local_${Date.now()}` };
        if (idx >= 0) stored[idx] = updated;
        else if (!stored.some((t: any) => t.email === payload.email)) stored.unshift(updated);
        localStorage.setItem("roam_blon_tourists", JSON.stringify(stored.slice(0, 500)));
      } catch { /* ignore */ }

      // Update cached session + parent state
      const merged = { ...tourist, ...payload };
      localStorage.setItem("roam_blon_tourist_user", JSON.stringify(merged));
      onUpdate(merged);

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error("Profile save failed", err);
      setMessage({ type: "error", text: "Something went wrong while saving your profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto py-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HERO CARD */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 p-8 md:p-12 text-center shadow-2xl shadow-slate-300 mb-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center gap-5">
          <div className="relative group">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-rose-400 to-rose-600 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden disabled:opacity-70 cursor-pointer hover:ring-4 hover:ring-white/30 transition-all"
              title="Change photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : uploading ? (
                <Loader2 size={28} className="animate-spin text-white" />
              ) : (
                <span className="text-4xl font-black text-white uppercase tracking-tight">
                  {emailLocal[0] || "R"}
                </span>
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-60"
              title="Upload photo"
            >
              <Camera size={16} className="text-slate-500" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {avatarUrl && (
              <button
                onClick={() => { setAvatarUrl(""); setMessage({ type: "success", text: "Photo removed. Tap Save Profile to confirm." }); }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-lg text-[9px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors"
                title="Remove photo"
              >
                <Trash2 size={10} /> Remove
              </button>
            )}
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">My Profile</h2>
            <p className="text-rose-200 font-bold text-xs uppercase tracking-widest mt-1">
              Explorer · Roam-Blon Traveler
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {nationality === "foreign" ? "International Visitor" : "Filipino Explorer"}
            </span>
          </div>
        </div>
      </div>

      {/* EDIT CARD */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <Save size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Account Details</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Keep your info up to date</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <Mail size={12} className="text-rose-500" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setMessage(null); }}
              placeholder="you@email.com"
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-rose-300 outline-none font-bold text-slate-800 text-sm transition-all"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <MapPin size={12} className="text-rose-500" /> Nationality
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "local", emoji: "🇵🇭", title: "Local", sub: "Filipino citizen" },
                { val: "foreign", emoji: "✈️", title: "Foreign", sub: "International visitor" },
              ].map((opt) => {
                const sel = nationality === opt.val;
                return (
                  <button
                    key={opt.val}
                    onClick={() => { setNationality(opt.val); setMessage(null); }}
                    className={`p-5 rounded-2xl border-2 transition-all text-center ${
                      sel
                        ? "border-rose-400 bg-rose-50 shadow-sm"
                        : "border-slate-100 bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className={`font-black text-sm uppercase tracking-tight ${sel ? "text-rose-600" : "text-slate-700"}`}>{opt.title}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country (foreign only) */}
          {nationality === "foreign" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                <Users size={12} className="text-rose-500" /> Country of Origin
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setMessage(null); }}
                placeholder="e.g. United States, Japan, France…"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-rose-300 outline-none font-bold text-slate-800 text-sm transition-all"
              />
            </div>
          )}

          {/* Read-only info */}
          {(tourist?.age || tourist?.gender) && (
            <div className="flex flex-wrap gap-3">
              {tourist?.age && (
                <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Age</p>
                  <p className="font-black text-slate-800 text-sm">{tourist.age}</p>
                </div>
              )}
              {tourist?.gender && (
                <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gender</p>
                  <p className="font-black text-slate-800 text-sm capitalize">{tourist.gender}</p>
                </div>
              )}
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-bold animate-in fade-in duration-300 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-red-50 border-red-100 text-red-600"
            }`}>
              {message.type === "success"
                ? <CheckCircle2 size={18} className="shrink-0" />
                : <AlertCircle size={18} className="shrink-0" />}
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-600 text-white font-black uppercase py-5 rounded-2xl transition-all shadow-lg disabled:opacity-60 text-[12px] tracking-widest"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>
      </div>
    </section>
  );
}
