"use client";

import { useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { passengerApi } from "@/lib/api";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

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
};

function MiniStatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function PassengerDashboardPage() {
  const { token, user, logout, hydrated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchDashboard();
  }, [hydrated, token]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socket.emit("joinPassengerRoom", user.id);

    const refresh = async () => {
      await fetchDashboard();
    };

    socket.on("ride:accepted", refresh);
    socket.on("ride:statusChanged", refresh);

    return () => {
      socket.off("ride:accepted", refresh);
      socket.off("ride:statusChanged", refresh);
    };
  }, [user?.id, hydrated, token]);

  const totalSpent = useMemo(() => {
    return Number(data?.stats.total_spent || 0);
  }, [data]);

  const rideBreakdown = useMemo(() => {
    const total = Number(data?.stats.total_rides || 0);
    const completed = Number(data?.stats.completed_rides || 0);
    const pending = Number(data?.stats.pending_rides || 0);

    const base = [
      { label: "Completed", value: completed },
      { label: "Pending", value: pending },
      { label: "Total", value: total },
    ];

    const max = Math.max(...base.map((b) => b.value), 1);

    return base.map((b) => ({
      ...b,
      percent: (b.value / max) * 100,
    }));
  }, [data]);

  if (!hydrated || loading) {
    return <main className="text-gray-900">Loading dashboard...</main>;
  }

  if (error) {
    return (
      <main className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
        {error}
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="space-y-6">
        {/* HEADER */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Passenger Overview
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
                Welcome back, {user?.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Book rides, track trips and manage your wallet easily.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/passenger/book-ride">
                <AnimatedButton className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">
                  Book Ride
                </AnimatedButton>
              </Link>

              <AnimatedButton
                onClick={logout}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Logout
              </AnimatedButton>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniStatCard
            title="Total Rides"
            value={data?.stats.total_rides || 0}
            subtitle="All ride requests"
            icon="🛣️"
          />
          <MiniStatCard
            title="Completed"
            value={data?.stats.completed_rides || 0}
            subtitle="Finished rides"
            icon="✅"
          />
          <MiniStatCard
            title="Pending"
            value={data?.stats.pending_rides || 0}
            subtitle="Awaiting drivers"
            icon="⏳"
          />
          <MiniStatCard
            title="Wallet"
            value={`₦${Number(data?.wallet.balance || 0).toLocaleString()}`}
            subtitle="Available balance"
            icon="💰"
          />
        </section>

        {/* CHART + BREAKDOWN */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Total Spending
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Based on your ride history.
            </p>

            <div className="mt-6 text-4xl font-black text-emerald-600">
              ₦{totalSpent.toLocaleString()}
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Ride Breakdown
            </h2>

            <div className="mt-4 space-y-4">
              {rideBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>

                  <div className="h-3 bg-slate-100 rounded-full">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </section>

        {/* TABLES */}
        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Recent Rides
            </h2>

            <div className="mt-4 space-y-3">
              {data?.recentRides?.length ? (
                data.recentRides.map((ride) => (
                  <Link
                    key={ride.id}
                    href={`/passenger/rides/${ride.id}`}
                    className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100"
                  >
                    <p className="font-bold text-slate-900">
                      {ride.pickup} → {ride.dropoff || ride.destination}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {ride.status}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-slate-500">No rides yet.</p>
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Notifications
            </h2>

            <div className="mt-4 space-y-3">
              {data?.notifications?.length ? (
                data.notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {item.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">
                  No notifications yet.
                </p>
              )}
            </div>
          </AnimatedCard>
        </section>
      </main>
    </PageTransition>
  );
}