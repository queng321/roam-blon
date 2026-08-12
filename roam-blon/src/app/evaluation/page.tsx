"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EvaluationForm from "@/components/EvaluationForm";

export default function EvaluationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F6F1ED]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-[#FAEEED] text-slate-600 hover:text-rose-600 text-xs font-black uppercase tracking-widest transition-all mb-6"
        >
          <ArrowLeft size={14} /> Back to Roam-Blon
        </button>

        <EvaluationForm standalone />
      </div>
    </div>
  );
}
