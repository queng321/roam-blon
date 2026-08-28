import type { Metadata } from "next";
import EmergencySection from "@/components/EmergencySection";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Emergency | Roam-Blon",
  description:
    "One-tap access to police, coast guard, medical, and tourism emergency responders in Romblon, Philippines.",
};

export default function EmergencyPage() {
  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-[#FAEEED]/20">
        <EmergencySection />
      </div>
    </>
  );
}
