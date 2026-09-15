"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TouristProfile({
  tourist,
  onUpdate,
  onClose,
}: {
  tourist: any;
  onUpdate?: (updated: any) => void;
  onClose?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState(tourist?.gender || "");
  const [age, setAge] = useState(tourist?.age || "");
  const [nationality, setNationality] = useState(tourist?.nationality || "local");

  const handleSave = () => {
    const updated = { ...tourist, gender, age, nationality };
    localStorage.setItem("roam_blon_tourist_user", JSON.stringify(updated));
    if (onUpdate) onUpdate(updated);
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center font-black text-2xl overflow-hidden shadow-inner">
            {tourist?.avatar_url ? (
              <img src={tourist.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              String(tourist?.email || "T")[0].toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {tourist?.name || tourist?.full_name || "Tourist Profile"}
            </h2>
            <p className="text-slate-500 text-xs font-bold">{tourist?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
              Verified Tourist
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Gender</span>
            {editing ? (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 text-sm font-bold bg-white border border-slate-200 rounded-xl"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-800 capitalize">{gender || "Not specified"}</span>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Age</span>
            {editing ? (
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2 text-sm font-bold bg-white border border-slate-200 rounded-xl"
                placeholder="Age"
              />
            ) : (
              <span className="text-sm font-bold text-slate-800">{age || "Not specified"}</span>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Nationality / Traveler Type</span>
            {editing ? (
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full p-2 text-sm font-bold bg-white border border-slate-200 rounded-xl"
              >
                <option value="local">Local Philippine Resident</option>
                <option value="foreign">Foreign Tourist / Visitor</option>
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-800 capitalize">
                {nationality === "foreign" ? "Foreign Tourist / Visitor" : "Local Philippine Resident"}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {editing ? (
            <>
              <Button onClick={handleSave} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs rounded-xl py-3">
                Save Changes
              </Button>
              <Button onClick={() => setEditing(false)} variant="outline" className="flex-1 font-black uppercase text-xs rounded-xl py-3">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs rounded-xl py-3">
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
