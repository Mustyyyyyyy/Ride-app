"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { passengerApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import RideLiveMap from "@/components/maps/RideLiveMap";
import RideTrackingCard from "@/components/passenger/RideTrackingCard";

export default function PassengerRideDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const { token, hydrated, user } = useAuth();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRide = useCallback(async () => {
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
  }, [hydrated, token, id]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  useEffect(() => {
    if (!user?.id || !id) return;

    const socket = getSocket();

    socket.emit("joinPassengerRoom", user.id);
    socket.emit("joinRideRoom", id);

    const refreshRide = async () => {
      await fetchRide();
    };

    socket.on("ride:accepted", refreshRide);
    socket.on("ride:statusChanged", refreshRide);

    return () => {
      socket.off("ride:accepted", refreshRide);
      socket.off("ride:statusChanged", refreshRide);
    };
  }, [user?.id, id, fetchRide]);

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

  const hasCoordinates =
    ride?.pickup_lat !== null &&
    ride?.pickup_lat !== undefined &&
    ride?.pickup_lng !== null &&
    ride?.pickup_lng !== undefined &&
    ride?.dropoff_lat !== null &&
    ride?.dropoff_lat !== undefined &&
    ride?.dropoff_lng !== null &&
    ride?.dropoff_lng !== undefined;

  return (
    <PageTransition>
      <main className="space-y-6">
        {hasCoordinates ? (
          <RideLiveMap
            rideId={ride.id}
            pickup={{
              lat: Number(ride.pickup_lat),
              lng: Number(ride.pickup_lng),
            }}
            dropoff={{
              lat: Number(ride.dropoff_lat),
              lng: Number(ride.dropoff_lng),
            }}
          />
        ) : (
          <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm text-gray-600">
            Live map will appear when pickup and dropoff coordinates are available.
          </div>
        )}

        <RideTrackingCard ride={ride} />
      </main>
    </PageTransition>
  );
} 