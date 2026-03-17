"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DriverSidebar from "@/components/layout/DriverSidebar";
import ResponsiveDashboardShell from "@/components/layout/ResponsiveDashboardShell";

type StoredUser = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: "passenger" | "driver" | "admin";
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("oride_token");
    const rawUser = localStorage.getItem("oride_user");

    if (!token || !rawUser) {
      router.replace("/login");
      return;
    }

    try {
      const user: StoredUser = JSON.parse(rawUser);

      if (user.role !== "driver") {
        if (user.role === "passenger") {
          router.replace("/passenger/dashboard");
          return;
        }

        if (user.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }

        router.replace("/login");
        return;
      }

      setAllowed(true);
      setReady(true);
    } catch {
      localStorage.removeItem("oride_token");
      localStorage.removeItem("oride_user");
      router.replace("/login");
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-green-50 to-white text-gray-900">
        Loading driver dashboard...
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <ResponsiveDashboardShell title="Driver" sidebar={<DriverSidebar />}>
      {children}
    </ResponsiveDashboardShell>
  );
}