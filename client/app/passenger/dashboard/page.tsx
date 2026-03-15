"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { passengerApi } from "@/lib/api";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import StatCard from "@/components/admin/StatCard";
import StaggerWrap, { StaggerItem } from "@/components/ui/StaggerWrap";
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
        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600">
                Passenger Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-black text-gray-900">
                Welcome back, {user?.name}
              </h1>
            </div>

            <div className="flex gap-3">
              <Link href="/passenger/book-ride">
                <AnimatedButton className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
                  Book Ride
                </AnimatedButton>
              </Link>

              <AnimatedButton
                onClick={logout}
                className="rounded-2xl border border-green-100 bg-white px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
              >
                Logout
              </AnimatedButton>
            </div>
          </div>
        </AnimatedCard>

        <StaggerWrap className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard title="Total Rides" value={data?.stats.total_rides || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Completed" value={data?.stats.completed_rides || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Pending" value={data?.stats.pending_rides || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Wallet Balance"
              value={`₦${Number(data?.wallet.balance || 0).toLocaleString()}`}
            />
          </StaggerItem>
        </StaggerWrap>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Recent Rides</h2>
            <div className="mt-4 space-y-3">
              {data?.recentRides?.length ? (
                data.recentRides.map((ride) => (
                  <Link
                    key={ride.id}
                    href={`/passenger/rides/${ride.id}`}
                    className="block rounded-xl border border-green-100 bg-green-50 p-4 transition hover:bg-green-100"
                  >
                    <p className="font-semibold text-gray-900">
                      {ride.pickup} → {ride.dropoff || ride.destination}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{ride.status}</p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500">No rides yet.</p>
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
            <div className="mt-4 space-y-3">
              {data?.notifications?.length ? (
                data.notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-green-100 bg-green-50 p-4"
                  >
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No notifications yet.</p>
              )}
            </div>
          </AnimatedCard>
        </div>
      </main>
    </PageTransition>
  );
}