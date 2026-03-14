"use client";

import useAuth from "@/hooks/useAuth";

export default function AdminTopbar() {
  const { user, logout } = useAuth();

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-green-300">
            Signed in as
          </p>
          <h1 className="mt-1 text-2xl font-black text-white">
            {user?.name || "Admin"}
          </h1>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="rounded-2xl bg-rose-500/20 px-5 py-3 font-semibold text-rose-300 hover:bg-rose-500/30"
        >
          Logout
        </button>
      </div>
    </div>
  );
}