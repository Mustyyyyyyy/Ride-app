"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";


export default function DriverRidesPage() {
  const { token } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [error, setError] = useState("");

  const loadTrips = async () => {
    const data = await driverApi.getTrips(token);
    setRides(data?.rides || []);
  };

  useEffect(() => {
    loadTrips().catch((err) =>
      setError(err.message || "Failed to load trips")
    );
  }, [token]);

  const handleStatus = async (rideId: number | string, status: string) => {
    try {
      await driverApi.updateRideStatus(rideId, { status }, token);
      await loadTrips();
    } catch (err: any) {
      setError(err.message || "Failed to update ride");
    }
  };

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">My Trips</h1>
      </div>

      {error ? <p className="text-red-300">{error}</p> : null}

      <section className="grid gap-4">
        {rides.length ? (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
            >
              <p className="font-bold text-white">
                {ride.pickup} → {ride.dropoff || ride.destination}
              </p>
              <p className="mt-1 text-slate-400">
                Passenger: {ride.passenger_name}
              </p>
              <p className="mt-1 text-slate-400">Status: {ride.status}</p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleStatus(ride.id, "ongoing")}
                  className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white"
                >
                  Start Ride
                </button>
                <button
                  onClick={() => handleStatus(ride.id, "completed")}
                  className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white"
                >
                  Complete Ride
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No trips yet.</p>
        )}
      </section>
    </main>
  );
}