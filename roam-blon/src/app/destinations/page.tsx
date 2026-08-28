import type { Metadata } from "next";
import DestinationsExplorer from "@/components/DestinationsExplorer";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Tourist Destinations | Roam-Blon",
  description:
    "Explore the top tourist destinations in Romblon — beaches, resorts, hotels, waterfalls, and landmarks.",
};

export default function DestinationsPage() {
  return (
    <>
      <SiteHeader />
      <DestinationsExplorer />
    </>
  );
}
