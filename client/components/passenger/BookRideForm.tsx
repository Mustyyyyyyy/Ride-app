"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { rideApi } from "@/lib/api";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

type Suggestion = {
  id: string;
  place_name: string;
  lat: number;
  lng: number;
};

export default function BookRideForm() {
  const { user, token } = useAuth();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupCoords, setPickupCoords] = useState<{
    lat: number;
    lng: number;
    place_name?: string;
  } | null>(null);

  const [dropoffCoords, setDropoffCoords] = useState<{
    lat: number;
    lng: number;
    place_name?: string;
  } | null>(null);

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([]);

  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const [rideType, setRideType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pickupRef = useRef<HTMLDivElement | null>(null);
  const destinationRef = useRef<HTMLDivElement | null>(null);

  async function searchPlaces(query: string): Promise<Suggestion[]> {
    if (!query.trim()) return [];

    const searchText = `${query}, Ogbomoso, Oyo State, Nigeria`;

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchText
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=ng&limit=5`
    );

    const data = await res.json();
    const features = data?.features || [];

    return features
      .filter((item: any) =>
        (item?.place_name || "").toLowerCase().includes("ogbomoso")
      )
      .map((item: any, index: number) => ({
        id: item.id || `${item.place_name}-${index}`,
        place_name: item.place_name,
        lat: item.center[1],
        lng: item.center[0],
      }));
  }

  async function geocodeExact(place: string) {
    const results = await searchPlaces(place);
    return results[0] || null;
  }

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!pickup.trim()) {
        setPickupSuggestions([]);
        return;
      }

      const results = await searchPlaces(pickup);
      setPickupSuggestions(results);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pickup]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!destination.trim()) {
        setDestinationSuggestions([]);
        return;
      }

      const results = await searchPlaces(destination);
      setDestinationSuggestions(results);
    }, 300);

    return () => clearTimeout(timeout);
  }, [destination]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (pickupRef.current && !pickupRef.current.contains(target)) {
        setShowPickupSuggestions(false);
      }

      if (destinationRef.current && !destinationRef.current.contains(target)) {
        setShowDestinationSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPickup = (item: Suggestion) => {
    setPickup(item.place_name);
    setPickupCoords({
      lat: item.lat,
      lng: item.lng,
      place_name: item.place_name,
    });
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
  };

  const handleSelectDestination = (item: Suggestion) => {
    setDestination(item.place_name);
    setDropoffCoords({
      lat: item.lat,
      lng: item.lng,
      place_name: item.place_name,
    });
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
  };

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

      let pickupLocation = pickupCoords;
      let dropoffLocation = dropoffCoords;

      if (!pickupLocation) {
        const foundPickup = await geocodeExact(pickup);
        if (foundPickup) {
          pickupLocation = {
            lat: foundPickup.lat,
            lng: foundPickup.lng,
            place_name: foundPickup.place_name,
          };
        }
      }

      if (!dropoffLocation) {
        const foundDropoff = await geocodeExact(destination);
        if (foundDropoff) {
          dropoffLocation = {
            lat: foundDropoff.lat,
            lng: foundDropoff.lng,
            place_name: foundDropoff.place_name,
          };
        }
      }

      if (!pickupLocation || !dropoffLocation) {
        setError(
          "Only Ogbomoso locations are allowed or the place could not be found."
        );
        return;
      }

      setPickupCoords(pickupLocation);
      setDropoffCoords(dropoffLocation);

      const data = await rideApi.requestRide(
        {
          passenger_id: Number(user.id),
          pickup: pickupLocation.place_name || pickup.trim(),
          dropoff: dropoffLocation.place_name || destination.trim(),
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
      setPickupCoords(null);
      setDropoffCoords(null);
      setPickupSuggestions([]);
      setDestinationSuggestions([]);
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
        <p className="mt-2 text-sm text-gray-600">
          Enter pickup and destination within Ogbomoso.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div ref={pickupRef} className="relative">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Pickup location
          </label>

          <input
            value={pickup}
            onChange={(e) => {
              setPickup(e.target.value);
              setPickupCoords(null);
              setShowPickupSuggestions(true);
            }}
            onFocus={() => setShowPickupSuggestions(true)}
            placeholder="Enter pickup point in Ogbomoso"
            className="w-full rounded-2xl border border-green-100 px-4 py-3 text-gray-900 outline-none focus:border-green-500"
          />

          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-green-100 bg-white shadow-lg">
              {pickupSuggestions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleSelectPickup(item)}
                  className="block w-full border-b border-green-50 px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 last:border-b-0"
                >
                  {item.place_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={destinationRef} className="relative">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Destination
          </label>

          <input
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setDropoffCoords(null);
              setShowDestinationSuggestions(true);
            }}
            onFocus={() => setShowDestinationSuggestions(true)}
            placeholder="Enter destination in Ogbomoso"
            className="w-full rounded-2xl border border-green-100 px-4 py-3 text-gray-900 outline-none focus:border-green-500"
          />

          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-green-100 bg-white shadow-lg">
              {destinationSuggestions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleSelectDestination(item)}
                  className="block w-full border-b border-green-50 px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 last:border-b-0"
                >
                  {item.place_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Ride type
            </label>

            <select
              value={rideType}
              onChange={(e) => setRideType(e.target.value)}
              className="w-full rounded-2xl border border-green-100 px-4 py-3 text-gray-900"
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
              className="w-full rounded-2xl border border-green-100 px-4 py-3 text-gray-900"
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
            placeholder="Any pickup instruction in Ogbomoso?"
            className="w-full rounded-2xl border border-green-100 px-4 py-3 text-gray-900"
          />
        </div>

        {(pickupCoords || dropoffCoords) && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {pickupCoords ? "Pickup found in Ogbomoso. " : ""}
            {dropoffCoords ? "Destination found in Ogbomoso." : ""}
          </div>
        )}

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