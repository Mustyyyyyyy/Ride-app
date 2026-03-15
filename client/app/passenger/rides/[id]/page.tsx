"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { passengerApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

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
    return <main className="text-gray-900">Loading ride details...</main>;
  }

  if (error) {
    return (
      <main className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
        {error}
      </main>
    );
  }

  if (!ride) {
    return <main className="text-gray-900">Ride not found</main>;
  }

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Ride Details</h1>
        </AnimatedCard>

        <AnimatedCard className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <p className="text-gray-900">
            <strong>Pickup:</strong> {ride.pickup}
          </p>

          <p className="text-gray-900">
            <strong>Dropoff:</strong> {ride.dropoff}
          </p>

          <p className="text-gray-900">
            <strong>Status:</strong> {ride.status}
          </p>

          <p className="text-gray-900">
            <strong>Price:</strong> ₦{Number(ride.price || 0).toLocaleString()}
          </p>

          <p className="text-gray-900">
            <strong>Driver:</strong> {ride.driver_name || "Waiting for driver"}
          </p>
        </AnimatedCard>
      </main>
    </PageTransition>
  );
}