"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { driverApi } from "@/lib/api";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

export default function DriverTripDetailsPage() {
  const params = useParams();
  const tripId = params?.id as string;

  const { token, hydrated } = useAuth();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrip() {
      if (!hydrated) return;

      if (!token) {
        setError("You are not logged in");
        setLoading(false);
        return;
      }

      if (!tripId) {
        setError("Invalid trip ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await driverApi.getTripById(tripId, token);
        setRide(res?.ride || null);
      } catch (err: any) {
        setError(err.message || "Failed to load trip details");
      } finally {
        setLoading(false);
      }
    }

    loadTrip();
  }, [tripId, token, hydrated]);

  if (!hydrated || loading) {
    return <main className="text-gray-900">Loading trip details...</main>;
  }

  if (error) {
    return (
      <main className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
        {error}
      </main>
    );
  }

  if (!ride) {
    return <main className="text-gray-900">Trip not found.</main>;
  }

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">
            Trip #{ride.id}
          </h1>
          <p className="mt-2 text-gray-500">
            Full details for this trip.
          </p>
        </AnimatedCard>

        <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pickup</p>
              <p className="mt-2 font-semibold text-gray-900">{ride.pickup}</p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Dropoff</p>
              <p className="mt-2 font-semibold text-gray-900">
                {ride.dropoff || ride.destination}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Passenger</p>
              <p className="mt-2 font-semibold text-gray-900">
                {ride.passenger_name || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Passenger Phone</p>
              <p className="mt-2 font-semibold text-gray-900">
                {ride.passenger_phone || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Fare</p>
              <p className="mt-2 font-semibold text-gray-900">
                ₦{Number(ride.price || 0).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
              <p className="mt-2 font-semibold text-gray-900">{ride.status}</p>
            </div>
          </div>
        </AnimatedCard>
      </main>
    </PageTransition>
  );
}