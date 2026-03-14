"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { rideApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";

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

  useEffect(() => {
    async function fetchRides() {
      if (!hydrated || !user?.id || !token) {
        setLoading(false);
        return;
      }

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
    }

    fetchRides();

    if (user?.id) {
      const socket = getSocket();

      socket.emit("joinPassengerRoom", user.id);

      socket.on("ride:accepted", fetchRides);
      socket.on("ride:statusChanged", fetchRides);

      return () => {
        socket.off("ride:accepted", fetchRides);
        socket.off("ride:statusChanged", fetchRides);
      };
    }
  }, [user, token, hydrated]);

  if (!hydrated || loading) {
    return <main className="text-white">Loading rides...</main>;
  }

  return (
    <main className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">My Rides</h1>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : rides.length === 0 ? (
          <div className="text-slate-400">No rides found yet.</div>
        ) : (
          <div className="space-y-3">
            {rides.map((ride) => (
              <Link
                key={ride.id}
                href={`/passenger/rides/${ride.id}`}
                className="block rounded-2xl border border-white/10 bg-slate-950/50 p-4 hover:bg-slate-800/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">RID-{ride.id}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {ride.pickup} → {ride.dropoff}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ride.created_at
                        ? new Date(ride.created_at).toLocaleString()
                        : "No date"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-white">
                      ₦{Number(ride.price || 0).toLocaleString()}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        ride.status === "completed"
                          ? "bg-green-500/15 text-green-300"
                          : ride.status === "ongoing"
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-yellow-500/15 text-yellow-300"
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
      </div>
    </main>
  );
}