"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { driverApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import StatCard from "@/components/admin/StatCard";
import StaggerWrap, { StaggerItem } from "@/components/ui/StaggerWrap";
import AnimatedCard from "@/components/ui/AnimatedCard";

export default function DriverDashboardPage() {
  const { token, hydrated, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const watchIdRef = useRef<number | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!hydrated || !token) return;

    try {
      setError("");
      const res = await driverApi.getDashboard(token);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load driver dashboard");
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

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Driver Dashboard</h1>
          <p className="mt-2 text-gray-500">
            Overview of trips, earnings and availability.
          </p>
        </AnimatedCard>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        ) : null}

        <StaggerWrap className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard title="Total Trips" value={data?.stats?.total_trips || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Completed Trips" value={data?.stats?.completed_trips || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Ongoing Trips" value={data?.stats?.ongoing_trips || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Wallet Balance"
              value={`₦${Number(data?.wallet?.balance || 0).toLocaleString()}`}
            />
          </StaggerItem>
        </StaggerWrap>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Profile Status</h2>
            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Vehicle:</strong> {data?.profile?.vehicle_model || "-"}</p>
              <p><strong>Plate:</strong> {data?.profile?.plate_number || "-"}</p>
              <p><strong>Color:</strong> {data?.profile?.vehicle_color || "-"}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={data?.profile?.is_online ? "text-green-700" : "text-gray-500"}>
                  {data?.profile?.is_online ? "Online" : "Offline"}
                </span>
              </p>
            </div>

            {(data?.activeRide || data?.currentRide || data?.ongoingRide) ? (
              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-700">Live Tracking Active</p>
                <p className="mt-1 text-sm text-gray-700">
                  Your location is being shared for the current trip.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">No Active Ride</p>
                <p className="mt-1 text-sm text-gray-600">
                  Start or accept a ride to begin live location sharing.
                </p>
              </div>
            )}
          </AnimatedCard>

          <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
            <div className="mt-4 space-y-3">
              {data?.notifications?.length ? (
                data.notifications.map((item: any) => (
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