"use client";

import { useState } from "react";

type Props = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  title?: string;
};

export default function ResponsiveDashboardShell({
  sidebar,
  children,
  title = "Dashboard",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white text-gray-900">
      {/* mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-green-100 bg-white/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-black text-green-700">{title}</h1>

          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-green-100 bg-white px-3 py-2 text-sm font-bold text-green-700 shadow-sm"
          >
            ☰
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6">
        {/* desktop sidebar */}
        <div className="hidden lg:block">{sidebar}</div>

        {/* page content */}
        <div>{children}</div>
      </div>

      {/* mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* mobile drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[85%] max-w-xs transform bg-white p-4 shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-green-700">{title}</h2>

          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-green-100 px-3 py-2 text-sm font-bold text-gray-700"
          >
            ✕
          </button>
        </div>

        <div onClick={() => setOpen(false)}>{sidebar}</div>
      </div>
    </div>
  );
}