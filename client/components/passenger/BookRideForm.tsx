"use client";

import { FormEvent, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { rideApi } from "@/lib/api";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function BookRideForm() {
  const { user, token } = useAuth();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupCoords, setPickupCoords] = useState<any>(null);
  const [dropoffCoords, setDropoffCoords] = useState<any>(null);

  const [rideType, setRideType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function geocode(place: string) {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        place
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );

    const data = await res.json();
    const first = data?.features?.[0];

    if (!first) return null;

    return {
      lat: first.center[1],
      lng: first.center[0],
    };
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!pickup.trim() || !destination.trim()) {
      setError("Pickup and destination are required.");
      return;
    }

    if (!user?.id) {
      setError("You must be logged in.");
      return;
    }

    try {
      setLoading(true);

      const pickupLocation = await geocode(pickup);
      const dropoffLocation = await geocode(destination);

      if (!pickupLocation || !dropoffLocation) {
        setError("Unable to find those locations.");
        setLoading(false);
        return;
      }

      setPickupCoords(pickupLocation);
      setDropoffCoords(dropoffLocation);

      const data = await rideApi.requestRide(
        {
          passenger_id: Number(user.id),
          pickup: pickup.trim(),
          dropoff: destination.trim(),

          pickup_lat: pickupLocation.lat,
          pickup_lng: pickupLocation.lng,

          dropoff_lat: dropoffLocation.lat,
          dropoff_lng: dropoffLocation.lng,

          ride_type: rideType,
          payment_method: paymentMethod,
          note: note.trim(),
        },
        token
      );

      setMessage(data?.message || "Ride request created successfully.");

      setPickup("");
      setDestination("");
      setNote("");
      setRideType("standard");
      setPaymentMethod("wallet");
    } catch (err: any) {
      setError(err.message || "Failed to create ride request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600">
          Quick Booking
        </p>
        <h2 className="mt-2 text-2xl font-black text-gray-900">
          Request a Ride
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Pickup location
          </label>

          <input
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Enter pickup point"
            className="w-full rounded-2xl border border-green-100 px-4 py-3 focus:border-green-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Destination
          </label>

          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination"
            className="w-full rounded-2xl border border-green-100 px-4 py-3 focus:border-green-500"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Ride type
            </label>

            <select
              value={rideType}
              onChange={(e) => setRideType(e.target.value)}
              className="w-full rounded-2xl border border-green-100 px-4 py-3"
            >
              <option value="standard">Standard</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Payment method
            </label>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-2xl border border-green-100 px-4 py-3"
            >
              <option value="wallet">Wallet</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Additional note
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Any pickup instruction?"
            className="w-full rounded-2xl border border-green-100 px-4 py-3"
          />
        </div>

        {message && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <AnimatedButton
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700"
        >
          {loading ? "Creating Ride..." : "Confirm Ride Request"}
        </AnimatedButton>
      </form>
    </AnimatedCard>
  );
}