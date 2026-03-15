"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

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
    <PageTransition>
      <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900">Rides</h1>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading rides...</p>
          ) : rides.length ? (
            rides.map((ride) => (
              <div
                key={ride.id}
                className="rounded-2xl border border-green-100 bg-green-50 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {ride.pickup} → {ride.dropoff}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Passenger: {ride.passenger_name || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Driver: {ride.driver_name || "Not assigned"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₦{Number(ride.price || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-green-700">
                      {ride.status}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No rides found.</p>
          )}
        </div>
      </AnimatedCard>
    </PageTransition>
  );
}