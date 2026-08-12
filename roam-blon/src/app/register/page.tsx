"use client";

import TouristAuthFlow from "@/components/TouristAuthFlow";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const handleComplete = (data: any) => {
    if (data?.role) localStorage.setItem("roam_blon_active_role", data.role);
    if (data?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (data?.role === "tour_guide") {
      router.push("/guide/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <TouristAuthFlow onComplete={handleComplete} initialScreen="signup" initialRole="tourist" />
  );
}