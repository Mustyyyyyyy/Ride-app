"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  ride: any;
};

export default function RideTrackingCard({ ride }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const statusColor =
    ride?.status === "completed"
      ? "bg-green-100 text-green-700"
      : ride?.status === "ongoing"
      ? "bg-sky-100 text-sky-700"
      : ride?.status === "accepted"
      ? "bg-emerald-100 text-emerald-700"
      : ride?.status === "cancelled"
      ? "bg-red-100 text-red-600"
      : "bg-yellow-100 text-yellow-700";

  const canCancel = ["pending", "accepted"].includes(ride?.status);

  const handleCancelRide = async () => {
    try {
      setCancelling(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("oride_token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://ride-app-g57x.onrender.com"}/api/rides/${ride.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to cancel ride");
      }

      setMessage(data?.message || "Ride cancelled successfully");

      setTimeout(() => {
        router.push("/passenger/dashboard");
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to cancel ride");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600">
            Active Ride
          </p>
          <h2 className="mt-2 text-2xl font-black text-gray-900">
            RID-{ride?.id}
          </h2>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${statusColor}`}
        >
          {ride?.status || "pending"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pickup</p>
          <p className="mt-2 font-semibold text-gray-900">{ride?.pickup}</p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Dropoff</p>
          <p className="mt-2 font-semibold text-gray-900">
            {ride?.dropoff || ride?.destination}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Fare</p>
          <p className="mt-2 font-semibold text-gray-900">
            ₦{Number(ride?.price || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ride Status</p>
          <p className="mt-2 font-semibold text-gray-900 capitalize">
            {ride?.status || "pending"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-green-100 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Driver</p>

        <div className="mt-3 flex items-center gap-4">
          <img
            src={ride?.driver_photo || "/driver.png"}
            alt={ride?.driver_name || "Driver"}
            className="h-14 w-14 rounded-full object-cover border border-green-100"
          />

          <div>
            <p className="font-bold text-gray-900">
              {ride?.driver_name || "Waiting for driver"}
            </p>

            <p className="text-sm text-gray-600">
              {ride?.vehicle_model || "Vehicle not assigned"}{" "}
              {ride?.vehicle_color ? `• ${ride.vehicle_color}` : ""}
            </p>

            <p className="text-xs text-gray-500">
              Plate: {ride?.plate_number || "Not available"}
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={!ride?.driver_phone}
          className="rounded-2xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Call Driver
        </button>

        <button
          onClick={handleCancelRide}
          disabled={!canCancel || cancelling}
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelling ? "Cancelling..." : "Cancel Ride"}
        </button>
      </div>
    </div>
  );
}