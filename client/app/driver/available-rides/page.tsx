"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import AvailableRideCard from "@/components/driver/AvailableRideCard";
import { getSocket } from "@/lib/socket";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

export default function DriverAvailableRidesPage() {
  const { token, user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState<number | string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const loadProfile = async () => {
    const data = await driverApi.getProfile(token);
    setIsOnline(!!data?.profile?.is_online);
  };

  const loadRides = async () => {
    const data = await driverApi.getAvailableRides(token);
    setRides(data?.rides || []);
  };

  useEffect(() => {
    async function init() {
      try {
        setError("");
        await loadProfile();
        await loadRides();
      } catch (err: any) {
        setError(err.message || "Failed to load available rides");
      }
    }

    init();
  }, [token]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socket.emit("joinDriverRoom", user.id);

    const handleNewRide = async () => {
      try {
        await loadRides();
      } catch {}
    };

    const handleRideRemoved = async () => {
      try {
        await loadRides();
      } catch {}
    };

    if (isOnline) {
      socket.emit("joinDriversLobby");
      socket.on("ride:new", handleNewRide);
      socket.on("ride:removed", handleRideRemoved);
      socket.on("ride:statusChanged", handleRideRemoved);
    } else {
      socket.emit("leaveDriversLobby");
      setRides([]);
    }

    return () => {
      socket.off("ride:new", handleNewRide);
      socket.off("ride:removed", handleRideRemoved);
      socket.off("ride:statusChanged", handleRideRemoved);
    };
  }, [isOnline, user, token]);

  const handleAccept = async (rideId: number | string) => {
    setMessage("");
    setError("");

    try {
      setAcceptingId(rideId);
      await driverApi.acceptRide(rideId, token);
      setMessage("Ride accepted successfully");
      await loadRides();
    } catch (err: any) {
      setError(err.message || "Failed to accept ride");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black text-gray-900">Available Rides</h1>

            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
                isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </AnimatedCard>

        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        <section className="grid gap-4">
          {!isOnline ? (
            <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm text-gray-600">
              You are offline. Turn on <span className="font-semibold text-gray-900">Go Online</span> from your profile page to receive rides.
            </AnimatedCard>
          ) : rides.length ? (
            rides.map((ride) => (
              <AvailableRideCard
                key={ride.id}
                ride={ride}
                onAccept={handleAccept}
                accepting={acceptingId === ride.id}
              />
            ))
          ) : (
            <p className="text-gray-500">No available rides right now.</p>
          )}
        </section>
      </main>
    </PageTransition>
  );
}