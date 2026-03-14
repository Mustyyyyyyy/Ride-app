"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { passengerApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function PassengerRideDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const { token, hydrated } = useAuth();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRide() {
      if (!hydrated) return;

      if (!token || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await passengerApi.getRideById(id, token);
        setRide(data?.ride || null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch ride");
      } finally {
        setLoading(false);
      }
    }

    fetchRide();
  }, [id, token, hydrated]);

  if (!hydrated || loading) {
    return <main className="text-white">Loading ride details...</main>;
  }

  if (error) {
    return (
      <main className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
        {error}
      </main>
    );
  }

  if (!ride) {
    return <main className="text-white">Ride not found</main>;
  }

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Ride Details</h1>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
        <p className="text-white">
          <strong>Pickup:</strong> {ride.pickup}
        </p>

        <p className="text-white">
          <strong>Dropoff:</strong> {ride.dropoff}
        </p>

        <p className="text-white">
          <strong>Status:</strong> {ride.status}
        </p>

        <p className="text-white">
          <strong>Price:</strong> ₦{Number(ride.price || 0).toLocaleString()}
        </p>

        <p className="text-white">
          <strong>Driver:</strong> {ride.driver_name || "Waiting for driver"}
        </p>
      </div>
    </main>
  );
}