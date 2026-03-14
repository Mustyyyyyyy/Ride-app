"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        Loading...
      </main>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (user.role !== "admin") {
    router.replace("/");
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <AdminSidebar />

        <section className="space-y-6">
          <AdminTopbar />
          {children}
        </section>
      </div>
    </main>
  );
}