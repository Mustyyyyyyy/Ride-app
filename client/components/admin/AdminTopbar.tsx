"use client";

import useAuth from "@/hooks/useAuth";

export default function AdminTopbar() {
  const { user, logout } = useAuth();

  return (
    <div className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-green-600">
            Signed in as
          </p>
          <h1 className="mt-1 text-2xl font-black text-gray-900">
            {user?.name || "Admin"}
          </h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="rounded-2xl bg-red-50 px-5 py-3 font-semibold text-red-600 hover:bg-red-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
}