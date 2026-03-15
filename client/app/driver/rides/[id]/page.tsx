"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import DriverTripActions from "@/components/driver/DriverTripActions";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

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

  if (error) return <main className="text-red-600">{error}</main>;
  if (!ride) return <main className="text-gray-900">Loading trip...</main>;

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Trip Details</h1>
        </AnimatedCard>

        <div className="grid gap-4 md:grid-cols-2">
          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Trip ID</p>
            <p className="mt-2 text-xl font-bold text-gray-900">TRIP-{ride.id}</p>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{ride.status}</p>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pickup</p>
            <p className="mt-2 text-gray-900">{ride.pickup}</p>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Dropoff</p>
            <p className="mt-2 text-gray-900">{ride.dropoff || ride.destination}</p>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Passenger</p>
            <p className="mt-2 text-gray-900">{ride.passenger_name}</p>
            <p className="mt-1 text-gray-500">{ride.passenger_phone || "No phone"}</p>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Fare</p>
            <p className="mt-2 text-gray-900">
              ₦{Number(ride.price || 0).toLocaleString()}
            </p>
          </AnimatedCard>
        </div>

        <DriverTripActions ride={ride} onUpdate={handleStatusUpdate} />
      </main>
    </PageTransition>
  );
}