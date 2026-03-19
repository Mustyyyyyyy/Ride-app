"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#111827] text-white lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto px-5 py-6">
            <div className="mb-6 flex items-center gap-3 px-2">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 font-black text-white shadow-lg">
                O
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-white">
                  ORIDE
                </p>
                <p className="text-xs text-slate-400">Admin Control</p>
              </div>
            </div>

            <AdminSidebar />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 font-black text-white">
                  O
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">ORIDE</p>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
              </div>

              <button
                onClick={() => setOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-lg font-bold text-slate-700 shadow-sm"
              >
                ☰
              </button>
            </div>
          </div>

          <main className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={`fixed left-0 top-0 z-50 h-full w-[84%] max-w-xs transform bg-[#111827] p-4 text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 font-black text-white">
              O
            </div>
            <div>
              <p className="text-sm font-black text-white">ORIDE</p>
              <p className="text-xs text-slate-400">Admin Control</p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-slate-200"
          >
            ✕
          </button>
        </div>

        <div onClick={() => setOpen(false)}>
          <AdminSidebar />
        </div>
      </div>
    </div>
  );
}