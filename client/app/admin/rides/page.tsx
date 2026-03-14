"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

type RideItem = {
  id: number;
  pickup: string;
  dropoff: string;
  status: string;
  price: number;
  passenger_name?: string;
  driver_name?: string;
  created_at?: string;
};

export default function AdminRidesPage() {
  const { token, hydrated } = useAuth();
  const [rides, setRides] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!hydrated || !token) return;

      try {
        setLoading(true);
        setError("");
        const res = await adminApi.getRides(token);
        setRides(res.rides || []);
      } catch (err: any) {
        setError(err.message || "Failed to load rides");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, hydrated]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
      <h1 className="text-3xl font-black text-white">Rides</h1>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-slate-400">Loading rides...</p>
        ) : rides.length ? (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-white">
                    {ride.pickup} → {ride.dropoff}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Passenger: {ride.passenger_name || "-"}
                  </p>
                  <p className="text-sm text-slate-400">
                    Driver: {ride.driver_name || "Not assigned"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-white">
                    ₦{Number(ride.price || 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-green-300">
                    {ride.status}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No rides found.</p>
        )}
      </div>
    </div>
  );
}