"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import StatCard from "@/components/admin/StatCard";

type DashboardData = {
  stats: {
    total_users: number;
    total_drivers: number;
    total_rides: number;
    open_tickets: number;
  };
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
  }>;
  recentRides: Array<{
    id: number;
    pickup: string;
    dropoff: string;
    status: string;
    price: number;
  }>;
};

export default function AdminDashboardPage() {
  const { token, hydrated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!hydrated || !token) return;

      try {
        setLoading(true);
        setError("");
        const res = await adminApi.getDashboard(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, hydrated]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Overview of users, drivers, rides, and support tickets.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={data?.stats.total_users || 0} />
        <StatCard title="Total Drivers" value={data?.stats.total_drivers || 0} />
        <StatCard title="Total Rides" value={data?.stats.total_rides || 0} />
        <StatCard title="Open Tickets" value={data?.stats.open_tickets || 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-bold text-white">Recent Users</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-slate-400">Loading...</p>
            ) : data?.recentUsers?.length ? (
              data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-bold text-white">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-green-300">
                    {user.role}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No users yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-bold text-white">Recent Rides</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-slate-400">Loading...</p>
            ) : data?.recentRides?.length ? (
              data.recentRides.map((ride) => (
                <div
                  key={ride.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-bold text-white">
                    {ride.pickup} → {ride.dropoff}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    ₦{Number(ride.price || 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-green-300">
                    {ride.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No rides yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}