"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { driverApi } from "@/lib/api";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

export default function DriverRidesPage() {
  const { token, hydrated } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!hydrated || !token) return;

      try {
        setError("");
        const res = await driverApi.getTrips(token);
        setRides(res?.rides || []);
      } catch (err: any) {
        setError(err.message || "Failed to load trips");
      }
    }

    load();
  }, [token, hydrated]);

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">My Trips</h1>
        </AnimatedCard>

        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {rides.length ? (
            rides.map((ride) => (
              <Link
                key={ride.id}
                href={`/driver/rides/${ride.id}`}
                className="block rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition hover:bg-green-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      {ride.pickup} → {ride.dropoff}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Passenger: {ride.passenger_name || "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₦{Number(ride.fare || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-green-700">{ride.status}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500">No trips yet.</p>
          )}
        </div>
      </main>
    </PageTransition>
  );
}