"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import StatCard from "@/components/admin/StatCard";
import PageTransition from "@/components/ui/PageTransition";
import StaggerWrap, { StaggerItem } from "@/components/ui/StaggerWrap";
import AnimatedCard from "@/components/ui/AnimatedCard";

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
    <PageTransition>
      <div className="space-y-6">
        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-500">
            Overview of users, drivers, rides, and support tickets.
          </p>
        </AnimatedCard>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        ) : null}

        <StaggerWrap className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard title="Total Users" value={data?.stats.total_users || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Total Drivers" value={data?.stats.total_drivers || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Total Rides" value={data?.stats.total_rides || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Open Tickets" value={data?.stats.open_tickets || 0} />
          </StaggerItem>
        </StaggerWrap>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : data?.recentUsers?.length ? (
                data.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-green-100 bg-green-50 p-4"
                  >
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-green-700">
                      {user.role}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No users yet.</p>
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Recent Rides</h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : data?.recentRides?.length ? (
                data.recentRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="rounded-2xl border border-green-100 bg-green-50 p-4"
                  >
                    <p className="font-bold text-gray-900">
                      {ride.pickup} → {ride.dropoff}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      ₦{Number(ride.price || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-green-700">
                      {ride.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No rides yet.</p>
              )}
            </div>
          </AnimatedCard>
        </div>
      </div>
    </PageTransition>
  );
}