"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import AvailableRideCard from "@/components/driver/AvailableRideCard";
import { getSocket } from "@/lib/socket";

export default function DriverAvailableRidesPage() {
  const { token } = useAuth();
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
    const socket = getSocket();

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
  }, [isOnline, token]);

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
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-white">Available Rides</h1>

          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
              isOnline
                ? "bg-green-500/15 text-green-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          {isOnline
            ? "You are online and will receive ride requests instantly."
            : "Go online from your profile page to receive rides."}
        </p>
      </div>

      {message ? <p className="text-green-300">{message}</p> : null}
      {error ? <p className="text-red-300">{error}</p> : null}

      <section className="grid gap-4">
        {!isOnline ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-300">
            You are offline. Turn on <span className="font-semibold text-white">Go Online</span> from your profile to receive ride requests.
          </div>
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
          <p className="text-slate-400">No available rides right now.</p>
        )}
      </section>
    </main>
  );
}