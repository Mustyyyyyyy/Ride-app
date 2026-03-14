"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { passengerApi } from "@/lib/api";
import Link from "next/link";
import { getSocket } from "@/lib/socket";

type DashboardData = {
  stats: {
    total_rides: number;
    completed_rides: number;
    pending_rides: number;
    total_spent: number;
  };
  wallet: {
    balance: number;
  };
  recentRides: any[];
  notifications: any[];
  tickets: any[];
};

export default function PassengerDashboardPage() {
  const { token, user, logout, hydrated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      if (!hydrated || !token) return;

      try {
        setLoading(true);
        setError("");
        const result = await passengerApi.getDashboard(token);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();

    if (user?.id) {
      const socket = getSocket();

      socket.emit("joinPassengerRoom", user.id);

      const refresh = () => {
        fetchDashboard();
      };

      socket.on("ride:accepted", refresh);
      socket.on("ride:statusChanged", refresh);

      return () => {
        socket.off("ride:accepted", refresh);
        socket.off("ride:statusChanged", refresh);
      };
    }
  }, [token, user, hydrated]);

  if (!hydrated || loading) {
    return <main className="text-white">Loading dashboard...</main>;
  }

  if (error) {
    return (
      <main className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
        {error}
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            Passenger Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Welcome back, {user?.name}
          </h1>
        </div>

        <div className="flex gap-3">
          <Link
            href="/passenger/book-ride"
            className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 font-bold text-white"
          >
            Book Ride
          </Link>
          <button
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Total Rides</p>
          <h3 className="mt-2 text-3xl font-black text-white">
            {data?.stats.total_rides || 0}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Completed</p>
          <h3 className="mt-2 text-3xl font-black text-white">
            {data?.stats.completed_rides || 0}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Pending</p>
          <h3 className="mt-2 text-3xl font-black text-white">
            {data?.stats.pending_rides || 0}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Wallet Balance</p>
          <h3 className="mt-2 text-3xl font-black text-white">
            ₦{Number(data?.wallet.balance || 0).toLocaleString()}
          </h3>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-xl font-bold text-white">Recent Rides</h2>
          <div className="mt-4 space-y-3">
            {data?.recentRides?.length ? (
              data.recentRides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/passenger/rides/${ride.id}`}
                  className="block rounded-xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-semibold text-white">
                    {ride.pickup} → {ride.dropoff || ride.destination}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{ride.status}</p>
                </Link>
              ))
            ) : (
              <p className="text-slate-400">No rides yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-xl font-bold text-white">Recent Notifications</h2>
          <div className="mt-4 space-y-3">
            {data?.notifications?.length ? (
              data.notifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No notifications yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}