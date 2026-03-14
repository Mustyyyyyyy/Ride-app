"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { driverApi } from "@/lib/api";
import Link from "next/link";
import DriverStats from "@/components/driver/DriverStats";

export default function DriverDashboardPage() {
  const { token, user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    driverApi
      .getDashboard(token)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard"));
  }, [token]);

  if (error) {
    return <main className="text-red-300">{error}</main>;
  }

  if (!data) {
    return <main className="text-white">Loading dashboard...</main>;
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            Driver Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Welcome back, {user?.name}
          </h1>
        </div>

        <div className="flex gap-3">
          <Link
            href="/driver/available-rides"
            className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 font-bold text-white"
          >
            Available Rides
          </Link>
          <button
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>

      <DriverStats
        stats={data.stats}
        walletBalance={Number(data.wallet.balance || 0)}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <div className="mt-4 space-y-2 text-slate-300">
            <p>Vehicle: {data.profile.vehicle_model || "Not set"}</p>
            <p>Plate: {data.profile.plate_number || "Not set"}</p>
            <p>Color: {data.profile.vehicle_color || "Not set"}</p>
            <p>Status: {data.profile.is_online ? "Online" : "Offline"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-xl font-bold text-white">Recent Trips</h2>
          <div className="mt-4 space-y-3">
            {data.recentRides.length ? (
              data.recentRides.map((ride: any) => (
                <div
                  key={ride.id}
                  className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-semibold text-white">
                    {ride.pickup} → {ride.dropoff || ride.destination}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Passenger: {ride.passenger_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{ride.status}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No trips yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}