"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

type DashboardData = {
  stats: {
    total_users: number;
    total_drivers: number;
    total_rides: number;
    open_tickets: number;
    revenue_today: number;
    avg_wait_time: number;
  };
  weeklyRevenue: Array<{
    day: string;
    revenue: number;
  }>;
  ridesByType: Array<{
    ride_type: string;
    total: number;
  }>;
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
    ride_type?: string;
    created_at?: string;
  }>;
};

type MiniStatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
};

function MiniStatCard({ title, value, subtitle, icon }: MiniStatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
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

  const revenueTrend = useMemo(() => {
    const weekly = data?.weeklyRevenue || [];
    const points = weekly.length
      ? weekly.map((item) => Number(item.revenue || 0))
      : [20, 35, 28, 44, 40, 52, 48];

    const padded = [...points];
    while (padded.length < 7) padded.push(0);

    const max = Math.max(...padded, 1);

    return padded.slice(0, 7).map((value) => ({
      value,
      y: 160 - (value / max) * 120,
    }));
  }, [data]);

  const revenuePolyline = useMemo(() => {
    return revenueTrend
      .map((point, index) => `${30 + index * 52},${point.y}`)
      .join(" ");
  }, [revenueTrend]);

  const revenueDays = useMemo(() => {
    const weekly = data?.weeklyRevenue || [];
    const labels = weekly.map((item) => item.day);
    const fallback = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.length === 7 ? labels : fallback;
  }, [data]);

  const rideTypeBars = useMemo(() => {
    const items = data?.ridesByType || [];

    if (!items.length) {
      return [
        { label: "Standard", value: 0, percent: 0 },
        { label: "Comfort", value: 0, percent: 0 },
        { label: "Premium", value: 0, percent: 0 },
      ];
    }

    const max = Math.max(...items.map((item) => Number(item.total || 0)), 1);

    return items.map((item) => ({
      label:
        item.ride_type?.charAt(0).toUpperCase() +
          item.ride_type?.slice(1).toLowerCase() || "Unknown",
      value: Number(item.total || 0),
      percent: (Number(item.total || 0) / max) * 100,
    }));
  }, [data]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Ride App Analytics
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Monitor users, drivers, rides, revenue flow and platform activity
                from one clean control panel.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {loading ? "Refreshing dashboard..." : "Live admin overview"}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniStatCard
            title="Total Users"
            value={data?.stats.total_users || 0}
            subtitle="Registered accounts"
            icon="👤"
          />
          <MiniStatCard
            title="Active Drivers"
            value={data?.stats.total_drivers || 0}
            subtitle="Available driver base"
            icon="🚘"
          />
          <MiniStatCard
            title="Revenue Today"
            value={`₦${Number(data?.stats.revenue_today || 0).toLocaleString()}`}
            subtitle="Completed rides today"
            icon="💳"
          />
          <MiniStatCard
            title="Avg Wait Time"
            value={`${Number(data?.stats.avg_wait_time || 0)} min`}
            subtitle="Platform average"
            icon="⏱️"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Weekly Revenue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Revenue from completed rides across the week.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                7 day trend
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <svg viewBox="0 0 400 190" className="h-[280px] w-full">
                {[0, 1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1="30"
                    x2="370"
                    y1={40 + i * 35}
                    y2={40 + i * 35}
                    stroke="#dbe4ee"
                    strokeDasharray="4 4"
                  />
                ))}

                {revenueDays.map((day, index) => (
                  <text
                    key={day + index}
                    x={30 + index * 52}
                    y="182"
                    fontSize="12"
                    fill="#64748b"
                  >
                    {day}
                  </text>
                ))}

                <polyline
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={revenuePolyline}
                />

                {revenueTrend.map((point, index) => (
                  <circle
                    key={index}
                    cx={30 + index * 52}
                    cy={point.y}
                    r="5"
                    fill="#0f766e"
                  />
                ))}
              </svg>
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Rides by Type
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Breakdown of ride demand by category.
              </p>
            </div>

            <div className="space-y-5">
              {rideTypeBars.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-slate-500">{item.value}</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Rides
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest trips on the platform.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-slate-500">Loading rides...</p>
            ) : data?.recentRides?.length ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100">
                <div className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  <p>Route</p>
                  <p>Type</p>
                  <p>Fare</p>
                  <p>Status</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {data.recentRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr] items-center px-4 py-4 text-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {ride.pickup} → {ride.dropoff}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Ride #{ride.id}
                        </p>
                      </div>

                      <p className="font-medium capitalize text-slate-600">
                        {ride.ride_type || "standard"}
                      </p>

                      <p className="font-semibold text-slate-700">
                        ₦{Number(ride.price || 0).toLocaleString()}
                      </p>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                          ride.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : ride.status === "ongoing"
                            ? "bg-sky-100 text-sky-700"
                            : ride.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {ride.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No rides yet.</p>
            )}
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Users
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest signups and account roles.
              </p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-500">Loading users...</p>
              ) : data?.recentUsers?.length ? (
                data.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "driver"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No users yet.</p>
              )}
            </div>
          </AnimatedCard>
        </section>
      </div>
    </PageTransition>
  );
}