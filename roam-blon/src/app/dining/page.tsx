import type { Metadata } from "next";
import DiningList from "@/components/DiningList";

export const metadata: Metadata = {
  title: "Dining Spots | Roam-Blon",
  description:
    "Explore the best dining spots in Romblon — restaurants, cafes, and grills with menus, reviews, and locations.",
};

export default function DiningPage() {
  return (
    <div className="min-h-screen bg-[#FAEEED]/20 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <DiningList />
      </div>
    </div>
  );
}
