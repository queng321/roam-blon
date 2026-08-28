import type { Metadata } from "next";
import EmergencySection from "@/components/EmergencySection";

export const metadata: Metadata = {
  title: "Emergency | Roam-Blon",
  description:
    "One-tap access to police, coast guard, medical, and tourism emergency responders in Romblon, Philippines.",
};

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-[#FAEEED]/20">
      <EmergencySection />
    </div>
  );
}
