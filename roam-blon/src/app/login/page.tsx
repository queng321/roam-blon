"use client";

import TouristAuthFlow from "@/components/TouristAuthFlow";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as "admin" | "tour_guide" | "tourist") || "tourist";

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
    <TouristAuthFlow onComplete={handleComplete} initialScreen="signin" initialRole={initialRole} />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}