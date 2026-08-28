import type { Metadata } from "next";
import AboutSection from "@/components/AboutSection";

export const metadata: Metadata = {
  title: "About | Roam-Blon",
  description:
    "About the Roam-Blon project — our story, mission, and vision for smart tourism in Romblon, Philippines.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAEEED]/20 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <AboutSection />
      </div>
    </div>
  );
}
