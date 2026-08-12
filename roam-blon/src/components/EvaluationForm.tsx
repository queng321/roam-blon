"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, ClipboardList, X, ArrowLeft } from "lucide-react";

interface EvaluationData {
  name: string;
  email: string;
  age: string;
  gender: string;
  nationality: string;
  effectiveness: number;
  efficiency: number;
  usefulness: number;
  trust: number;
  pleasure: number;
  comfort: number;
  economic_risk: number;
  health_safety_risk: number;
  environmental_risk: number;
  context_completeness: number;
  flexibility: number;
}

const SCALE = [
  { value: 5, label: "Strongly Agree" },
  { value: 4, label: "Agree" },
  { value: 3, label: "Moderately Agree" },
  { value: 2, label: "Disagree" },
  { value: 1, label: "Strongly Disagree" },
];

const QUESTIONS: { key: keyof Omit<EvaluationData, 'name' | 'email' | 'age' | 'gender' | 'nationality'>; sub: string; question: string }[] = [
  { key: "effectiveness", sub: "Effectiveness", question: "The system helps me achieve my travel goals accurately." },
  { key: "efficiency", sub: "Efficiency", question: "The system responds quickly when requesting AI assistance, loading emergency info, sending real-time messages to admin." },
  { key: "usefulness", sub: "Usefulness", question: "The system provides clear, relevant travel information and reliable feedback/rating capabilities." },
  { key: "trust", sub: "Trust", question: "I trust the system to handle my user information and valuable travel outcomes." },
  { key: "pleasure", sub: "Pleasure", question: "The system makes my travel experience more enjoyable and stress-free." },
  { key: "comfort", sub: "Comfort", question: "I feel comfortable navigating the system features." },
  { key: "economic_risk", sub: "Economic Risk Mitigation", question: "The system feels safe and protects me from financial risks." },
  { key: "health_safety_risk", sub: "Health & Safety Risk Mitigation", question: "The use of the system reduces risk during travel (avoiding unsafe routes and quick access to emergency info)." },
  { key: "environmental_risk", sub: "Environmental Risk Mitigation", question: "The system does not give misleading information that could harm my travel decisions." },
  { key: "context_completeness", sub: "Context Completeness", question: "The system operates reliably without unexpected crashes or errors." },
  { key: "flexibility", sub: "Flexibility", question: "The system easily adapts to different travel scenarios, locations, and user needs." },
];

export default function EvaluationForm({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<EvaluationData>({
    name: "", email: "", age: "", gender: "", nationality: "",
    effectiveness: 0, efficiency: 0, usefulness: 0, trust: 0, pleasure: 0, comfort: 0,
    economic_risk: 0, health_safety_risk: 0, environmental_risk: 0, context_completeness: 0, flexibility: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(standalone);

  const handleSubmit = async () => {
    setError("");
    const unanswered = QUESTIONS.filter(q => !(form as any)[q.key]);
    if (unanswered.length > 0) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("evaluations").insert([{
        name: form.name || null,
        email: form.email || null,
        age: form.age || null,
        gender: form.gender || null,
        nationality: form.nationality || null,
        effectiveness: form.effectiveness,
        efficiency: form.efficiency,
        usefulness: form.usefulness,
        trust: form.trust,
        pleasure: form.pleasure,
        comfort: form.comfort,
        economic_risk: form.economic_risk,
        health_safety_risk: form.health_safety_risk,
        environmental_risk: form.environmental_risk,
        context_completeness: form.context_completeness,
        flexibility: form.flexibility,
      }]);
      if (error) {
        setError("Could not submit. Please try again.");
        setSubmitting(false);
        return;
      }
      // Broadcast so the admin dashboard refreshes evaluations live
      try {
        const chan = supabase.channel('admin-live-feed');
        await chan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chan.send({ type: 'broadcast', event: 'new_evaluation', payload: {} });
            supabase.removeChannel(chan);
          }
        });
      } catch { /* ignore */ }
      setSubmitted(true);
    } catch {
      setError("Could not submit. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-10 text-center">
        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Thank You!</h3>
        <p className="text-slate-500 font-bold text-sm mt-2 max-w-md mx-auto">
          Thank you for answering this evaluation. Your responses have been recorded and will be used solely for research purposes.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl text-xs transition-all"
        >
          <ArrowLeft size={14} /> Back to Roam-Blon
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mb-3">
        <button
          onClick={() => router.push("/evaluation")}
          className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100 hover:bg-rose-100 transition-all"
        >
          <ClipboardList size={12} className="text-rose-500" />
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Help us to improve our system by answering this evaluation form</span>
        </button>
      </div>
    );
  }

  return (
    <div id="evaluation-form" className="bg-white border-2 border-[#FAEEED] rounded-[2rem] shadow-sm p-5 md:p-8 mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
          <ClipboardList size={20} />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Help Us Improve Our System</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By answering this evaluation form</p>
        </div>
        {!standalone && (
          <button
            onClick={() => setOpen(false)}
            className="ml-auto w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed mb-6">
        Dear Respondents, we respectfully invite you to participate in this research survey, which forms part of our academic study.
        The purpose of this questionnaire is to gather your valuable insights regarding the effectiveness of the
        Roam-blon: An AI Integrated Travel Buddy. Your responses will remain strictly confidential and will be used solely for research purposes.
      </p>

      {/* Demographics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name (Optional)</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-900 outline-none focus:border-rose-300 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Your email"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-900 outline-none focus:border-rose-300 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Age</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {["18-24", "25-31", "32-38", "39-45", "46+"].map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, age: a }))}
                className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border-2 ${form.age === a ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-rose-200'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Gender</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {["Male", "Female", "Prefer not to say"].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, gender: g }))}
                className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border-2 ${form.gender === g ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-rose-200'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Nationality</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {["Filipino (Local)", "Foreign (International)"].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, nationality: n }))}
                className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border-2 ${form.nationality === n ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-rose-200'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Likert checklist */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Direction: Put a checkmark in the appropriate column.
        </div>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-3 bg-slate-50 rounded-l-xl border-b-2 border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">Sub-Characteristics</th>
              <th className="text-left px-3 py-3 bg-slate-50 border-b-2 border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">Question</th>
              {SCALE.map(s => (
                <th key={s.value} className="px-2 py-3 bg-slate-50 border-b-2 border-slate-100 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                  {s.label}
                  <span className="block text-rose-500 mt-0.5">({s.value})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUESTIONS.map((q, qi) => {
              const val = (form as any)[q.key] as number;
              return (
                <tr key={q.key} className="border-b border-slate-50">
                  <td className="px-3 py-3 text-[11px] font-black text-slate-700 uppercase tracking-wide">{q.sub}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 font-medium leading-relaxed">{q.question}</td>
                  {SCALE.map(s => (
                    <td key={s.value} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, [q.key]: s.value }))}
                        className={`mx-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${val === s.value ? 'bg-rose-500 border-rose-500' : 'border-slate-200 bg-white hover:border-rose-300'}`}
                      >
                        {val === s.value && <span className="w-2 h-2 rounded-full bg-white" />}
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full sm:w-auto px-10 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {submitting ? "Submitting..." : "Submit Evaluation"}
        </button>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
          Marceño, Niña Marie M. · Maaba, Princess Quennie May M. · Abad, Kieth Ariane Y. · Naron, Jordan G.
        </p>
      </div>
    </div>
  );
}
