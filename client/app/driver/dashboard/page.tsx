"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { driverApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

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

export default function DriverDashboardPage() {
  const { token, hydrated, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!hydrated || !token) return;

    try {
      setLoading(true);
      setError("");
      const res = await driverApi.getDashboard(token);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load driver dashboard");
    } finally {
      setLoading(false);
    }
  }, [hydrated, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socket.emit("joinDriverRoom", user.id);

    const refresh = async () => {
      await loadDashboard();
    };

    socket.on("ride:accepted", refresh);
    socket.on("ride:statusChanged", refresh);

    return () => {
      socket.off("ride:accepted", refresh);
      socket.off("ride:statusChanged", refresh);
    };
  }, [user?.id, loadDashboard]);

  useEffect(() => {
    const socket = getSocket();

    const activeRide =
      data?.activeRide ||
      data?.currentRide ||
      data?.ongoingRide ||
      null;

    const rideId = activeRide?.id;
    const isOnline = !!data?.profile?.is_online;

    if (!rideId || !user?.id || !isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported on this device.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        socket.emit("driver:location", {
          rideId,
          driverId: user.id,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (geoError) => {
        console.error("Driver location error:", geoError);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [
    data?.activeRide?.id,
    data?.currentRide?.id,
    data?.ongoingRide?.id,
    data?.profile?.is_online,
    user?.id,
  ]);

  const completedRecentRides = useMemo(() => {
    return (data?.recentRides || []).filter(
      (ride: any) => ride.status === "completed"
    );
  }, [data]);

  const totalRecentEarnings = useMemo(() => {
    return completedRecentRides.reduce(
      (sum: number, ride: any) => sum + Number(ride.price || 0),
      0
    );
  }, [completedRecentRides]);

  const earningsTrend = useMemo(() => {
    const values = completedRecentRides
      .slice(0, 7)
      .reverse()
      .map((ride: any) => Number(ride.price || 0));

    const fallback = [12, 28, 18, 36, 30, 44, 39];
    const points = values.length ? values : fallback;

    while (points.length < 7) points.unshift(0);

    const max = Math.max(...points, 1);

    return points.map((value: number) => ({
      value,
      y: 160 - (value / max) * 120,
    }));
  }, [completedRecentRides]);

  const earningsPolyline = useMemo(() => {
    return earningsTrend
      .map(
        (point: { value: number; y: number }, index: number) =>
          `${30 + index * 52},${point.y}`
      )
      .join(" ");
  }, [earningsTrend]);

  const tripBreakdown = useMemo(() => {
    const completed = Number(data?.stats?.completed_trips || 0);
    const ongoing = Number(data?.stats?.ongoing_trips || 0);
    const total = Number(data?.stats?.total_trips || 0);
    const pending = Math.max(total - completed - ongoing, 0);

    const base = [
      { label: "Completed", value: completed },
      { label: "Ongoing", value: ongoing },
      { label: "Pending", value: pending },
    ];

    const max = Math.max(...base.map((item) => item.value), 1);

    return base.map((item) => ({
      ...item,
      percent: (item.value / max) * 100,
    }));
  }, [data]);

  const completionRate = useMemo(() => {
    const total = Number(data?.stats?.total_trips || 0);
    const completed = Number(data?.stats?.completed_trips || 0);

    if (!total) return 0;
    return Math.round((completed / total) * 100);
  }, [data]);

  const cancellationRate = useMemo(() => {
    const total = Number(data?.stats?.total_trips || 0);
    const completed = Number(data?.stats?.completed_trips || 0);
    const ongoing = Number(data?.stats?.ongoing_trips || 0);
    const cancelledOrUnfinished = Math.max(total - completed - ongoing, 0);

    if (!total) return 0;
    return Math.round((cancelledOrUnfinished / total) * 100);
  }, [data]);

  const avgEarningsPerTrip = useMemo(() => {
    const completed = Number(data?.stats?.completed_trips || 0);
    if (!completed) return 0;
    return Math.round(totalRecentEarnings / completed);
  }, [data, totalRecentEarnings]);

  return (
    <PageTransition>
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Driver Performance
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Driver Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Track trips, wallet balance, online status and current ride
                activity from one clear driver control panel.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {loading ? "Refreshing dashboard..." : "Driver overview"}
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
            title="Total Trips"
            value={data?.stats?.total_trips || 0}
            subtitle="All assigned trips"
            icon="🛣️"
          />
          <MiniStatCard
            title="Completed Trips"
            value={data?.stats?.completed_trips || 0}
            subtitle="Successfully finished"
            icon="✅"
          />
          <MiniStatCard
            title="Ongoing Trips"
            value={data?.stats?.ongoing_trips || 0}
            subtitle="Trips in motion"
            icon="🚗"
          />
          <MiniStatCard
            title="Wallet Balance"
            value={`₦${Number(data?.wallet?.balance || 0).toLocaleString()}`}
            subtitle="Available earnings"
            icon="💰"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MiniStatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            subtitle="Trips successfully completed"
            icon="📈"
          />
          <MiniStatCard
            title="Cancellation Rate"
            value={`${cancellationRate}%`}
            subtitle="Trips not completed"
            icon="❌"
          />
          <MiniStatCard
            title="Avg Earnings / Trip"
            value={`₦${avgEarningsPerTrip.toLocaleString()}`}
            subtitle="Per completed ride"
            icon="💵"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Earnings Trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recent earnings activity from completed rides only.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                ₦{totalRecentEarnings.toLocaleString()}
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

                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => (
                    <text
                      key={day}
                      x={30 + index * 52}
                      y="182"
                      fontSize="12"
                      fill="#64748b"
                    >
                      {day}
                    </text>
                  )
                )}

                <polyline
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={earningsPolyline}
                />

                {earningsTrend.map(
                  (point: { value: number; y: number }, index: number) => (
                    <circle
                      key={index}
                      cx={30 + index * 52}
                      cy={point.y}
                      r="5"
                      fill="#0f766e"
                    />
                  )
                )}
              </svg>
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Trip Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Snapshot of trip progress and completion.
              </p>
            </div>

            <div className="space-y-5">
              {tripBreakdown.map((item) => (
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

            <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Driver Status
              </p>
              <p className="mt-3 text-lg font-bold text-slate-900">
                {data?.profile?.is_online ? "Online" : "Offline"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {data?.profile?.is_online
                  ? "You are available to receive rides."
                  : "Go online to start receiving rides."}
              </p>
            </div>
          </AnimatedCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Profile Status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vehicle information and live ride state.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Vehicle
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {data?.profile?.vehicle_model || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Plate Number
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {data?.profile?.plate_number || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Vehicle Color
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {data?.profile?.vehicle_color || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Current Ride
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {data?.activeRide || data?.currentRide || data?.ongoingRide
                    ? "Live Tracking Active"
                    : "No Active Ride"}
                </p>
              </div>
            </div>

            {data?.activeRide || data?.currentRide || data?.ongoingRide ? (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">
                  Live Tracking Active
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Your location is being shared for the current trip.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  No Active Ride
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Start or accept a ride to begin live location sharing.
                </p>
              </div>
            )}
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Notifications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest updates about trips and wallet activity.
              </p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-500">Loading notifications...</p>
              ) : data?.notifications?.length ? (
                data.notifications.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No notifications yet.</p>
              )}
            </div>
          </AnimatedCard>
        </section>
      </main>
    </PageTransition>
  );
}