"use client";

import { FormEvent, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { rideApi } from "@/lib/api";

export default function BookRideForm() {
  const { user, token } = useAuth();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rideType, setRideType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      const data = await rideApi.requestRide(
        {
          passenger_id: Number(user.id),
          pickup: pickup.trim(),
          dropoff: destination.trim(),
          ride_type: rideType,
          payment_method: paymentMethod,
          note: note.trim(),
        },
        token
      );

      setMessage(data?.message || "Ride request created successfully.");
      setPickup("");
      setDestination("");
      setRideType("standard");
      setPaymentMethod("wallet");
      setNote("");
    } catch (err: any) {
      setError(err.message || "Failed to create ride request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
          Quick Booking
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Request a Ride</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Pickup location
          </label>
          <input
            type="text"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Enter pickup point"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Destination
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-green-500"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Ride type
            </label>
            <select
              value={rideType}
              onChange={(e) => setRideType(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-green-500"
            >
              <option value="standard">Standard</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-green-500"
            >
              <option value="wallet">Wallet</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">
            Additional note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Any pickup instruction?"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-green-500"
          />
        </div>

        {message ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 font-bold text-white disabled:opacity-70"
        >
          {loading ? "Creating Ride..." : "Confirm Ride Request"}
        </button>
      </form>
    </section>
  );
}