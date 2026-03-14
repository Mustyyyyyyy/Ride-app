"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import DriverTripActions from "@/components/driver/DriverTripActions";

type Props = {
  params: {
    id: string;
  };
};

export default function DriverRideDetailsPage({ params }: Props) {
  const { token } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [error, setError] = useState("");

  const loadRide = async () => {
    const data = await driverApi.getTripById(params.id, token);
    setRide(data?.ride || null);
  };

  useEffect(() => {
    loadRide().catch((err) =>
      setError(err.message || "Failed to load trip details")
    );
  }, [params.id, token]);

  const handleStatusUpdate = async (status: string) => {
    await driverApi.updateRideStatus(params.id, { status }, token);
    await loadRide();
  };

  if (error) return <main className="text-red-300">{error}</main>;
  if (!ride) return <main className="text-white">Loading trip...</main>;

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">Trip Details</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Trip ID</p>
          <p className="mt-2 text-xl font-bold text-white">TRIP-{ride.id}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Status</p>
          <p className="mt-2 text-xl font-bold text-white">{ride.status}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Pickup</p>
          <p className="mt-2 text-white">{ride.pickup}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Dropoff</p>
          <p className="mt-2 text-white">{ride.dropoff || ride.destination}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Passenger</p>
          <p className="mt-2 text-white">{ride.passenger_name}</p>
          <p className="mt-1 text-slate-400">{ride.passenger_phone || "No phone"}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Fare</p>
          <p className="mt-2 text-white">
            ₦{Number(ride.price || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <DriverTripActions ride={ride} onUpdate={handleStatusUpdate} />
    </main>
  );
}