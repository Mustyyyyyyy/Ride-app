"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { rideApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

type Ride = {
  id: number | string;
  pickup: string;
  dropoff: string;
  price?: number | string;
  status: string;
  created_at?: string;
  driver_name?: string;
};

export default function PassengerRidesPage() {
  const { user, token, hydrated } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRides = useCallback(async () => {
    if (!hydrated || !user?.id || !token) return;

    try {
      setLoading(true);
      setError("");

      const passengerId = Number(user.id);
      const data = await rideApi.getPassengerRides(passengerId, token);

      setRides(data?.rides || []);
    } catch (err: any) {
      setError(err.message || "Failed to load rides.");
    } finally {
      setLoading(false);
    }
  }, [hydrated, user?.id, token]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();

    socket.emit("joinPassengerRoom", user.id);

    socket.on("ride:accepted", fetchRides);
    socket.on("ride:statusChanged", fetchRides);

    return () => {
      socket.off("ride:accepted", fetchRides);
      socket.off("ride:statusChanged", fetchRides);
    };
  }, [user?.id, fetchRides]);

  if (!hydrated || loading) {
    return <main className="text-gray-900">Loading rides...</main>;
  }

  return (
    <PageTransition>
      <main className="space-y-6">

        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">My Rides</h1>
        </AnimatedCard>

        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : rides.length === 0 ? (
            <div className="text-gray-500">No rides found yet.</div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/passenger/rides/${ride.id}`}
                  className="block rounded-2xl border border-green-100 bg-green-50 p-4 transition hover:bg-green-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <p className="font-bold text-gray-900">
                        RID-{ride.id}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {ride.pickup} → {ride.dropoff}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {ride.created_at
                          ? new Date(ride.created_at).toLocaleString()
                          : "No date"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₦{Number(ride.price || 0).toLocaleString()}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          ride.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : ride.status === "ongoing"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {ride.status}
                      </span>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}

        </AnimatedCard>

      </main>
    </PageTransition>
  );
}