"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DriverSidebar from "@/components/layout/DriverSidebar";

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading driver dashboard...
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6">
        <DriverSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}