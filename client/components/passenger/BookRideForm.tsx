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

type SavedPlace = {
  place_name: string;
  lat: number;
  lng: number;
};

const POPULAR_OGBOMOSO_PLACES: Suggestion[] = [
  {
    id: "lautech",
    place_name: "LAUTECH, Ogbomoso, Oyo State, Nigeria",
    lat: 8.1667,
    lng: 4.2667,
  },
  {
    id: "takie",
    place_name: "Takie, Ogbomoso, Oyo State, Nigeria",
    lat: 8.133,
    lng: 4.255,
  },
  {
    id: "under-g",
    place_name: "Under G, Ogbomoso, Oyo State, Nigeria",
    lat: 8.128,
    lng: 4.261,
  },
  {
    id: "oja-igbo",
    place_name: "Oja Igbo, Ogbomoso, Oyo State, Nigeria",
    lat: 8.132,
    lng: 4.248,
  },
];

const RECENT_PICKUP_KEY = "oride_recent_pickups";
const RECENT_DROPOFF_KEY = "oride_recent_dropoffs";

export default function BookRideForm() {
  const { user, token } = useAuth();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [pickupCoords, setPickupCoords] = useState<SavedPlace | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<SavedPlace | null>(null);

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([]);

  const [recentPickups, setRecentPickups] = useState<SavedPlace[]>([]);
  const [recentDropoffs, setRecentDropoffs] = useState<SavedPlace[]>([]);

  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const [rideType, setRideType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const pickupRef = useRef<HTMLDivElement | null>(null);
  const destinationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const storedPickups = localStorage.getItem(RECENT_PICKUP_KEY);
      const storedDropoffs = localStorage.getItem(RECENT_DROPOFF_KEY);

      setRecentPickups(storedPickups ? JSON.parse(storedPickups) : []);
      setRecentDropoffs(storedDropoffs ? JSON.parse(storedDropoffs) : []);
    } catch {
      setRecentPickups([]);
      setRecentDropoffs([]);
    }
  }, []);

  function saveRecentPlace(key: string, place: SavedPlace) {
    try {
      const existingRaw = localStorage.getItem(key);
      const existing: SavedPlace[] = existingRaw ? JSON.parse(existingRaw) : [];

      const filtered = existing.filter(
        (item) => item.place_name !== place.place_name
      );

      const updated = [place, ...filtered].slice(0, 5);
      localStorage.setItem(key, JSON.stringify(updated));

      if (key === RECENT_PICKUP_KEY) setRecentPickups(updated);
      if (key === RECENT_DROPOFF_KEY) setRecentDropoffs(updated);
    } catch {}
  }

  async function searchPlaces(query: string): Promise<Suggestion[]> {
    if (!query.trim()) return [];

    const searchText = query.toLowerCase().includes("ogbomoso")
      ? query
      : `${query}, Ogbomoso, Oyo State, Nigeria`;

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchText
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=ng&limit=8`
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
    const searchText = place.toLowerCase().includes("ogbomoso")
      ? place
      : `${place}, Ogbomoso, Oyo State, Nigeria`;

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchText
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=ng&limit=8`
    );

    const data = await res.json();
    const first = data?.features?.[0];

    if (!first) return null;

    const placeName = (first.place_name || "").toLowerCase();
    if (!placeName.includes("ogbomoso")) return null;

    return {
      lat: first.center[1],
      lng: first.center[0],
      place_name: first.place_name,
    };
  }

  async function reverseGeocode(lat: number, lng: number) {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=ng&limit=1`
    );

    const data = await res.json();
    const first = data?.features?.[0];

    return {
      lat,
      lng,
      place_name:
        first?.place_name || "Current location, Ogbomoso, Oyo State, Nigeria",
    };
  }

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!pickup.trim()) {
        setPickupSuggestions([]);
        return;
      }

      const results = await searchPlaces(pickup);
      setPickupSuggestions(results);
    }, 250);

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
    }, 250);

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

  const handleSelectPickup = (item: Suggestion | SavedPlace) => {
    setPickup(item.place_name);
    setPickupCoords({
      lat: item.lat,
      lng: item.lng,
      place_name: item.place_name,
    });
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
  };

  const handleSelectDestination = (item: Suggestion | SavedPlace) => {
    setDestination(item.place_name);
    setDropoffCoords({
      lat: item.lat,
      lng: item.lng,
      place_name: item.place_name,
    });
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    setDetectingLocation(true);
    setError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const resolved = await reverseGeocode(lat, lng);
          handleSelectPickup(resolved);
        } catch {
          setError("Unable to detect your current location.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setError("Unable to access your location.");
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
        pickupLocation = await geocodeExact(pickup);
      }

      if (!dropoffLocation) {
        dropoffLocation = await geocodeExact(destination);
      }

      if (!pickupLocation || !dropoffLocation) {
        setError(
          "Select a valid Ogbomoso location from suggestions or include 'Ogbomoso' in the address."
        );
        return;
      }

      saveRecentPlace(RECENT_PICKUP_KEY, pickupLocation);
      saveRecentPlace(RECENT_DROPOFF_KEY, dropoffLocation);

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

  const pickupItems =
    pickup.trim().length > 0
      ? pickupSuggestions
      : [
          ...recentPickups.map((item, i) => ({
            ...item,
            id: `recent-pickup-${i}`,
          })),
          ...POPULAR_OGBOMOSO_PLACES.filter(
            (popular) =>
              !recentPickups.some(
                (recent) => recent.place_name === popular.place_name
              )
          ),
        ];

  const destinationItems =
    destination.trim().length > 0
      ? destinationSuggestions
      : [
          ...recentDropoffs.map((item, i) => ({
            ...item,
            id: `recent-dropoff-${i}`,
          })),
          ...POPULAR_OGBOMOSO_PLACES.filter(
            (popular) =>
              !recentDropoffs.some(
                (recent) => recent.place_name === popular.place_name
              )
          ),
        ];

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
          Book your ride anywhere within Ogbomoso.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div ref={pickupRef} className="relative">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-gray-700">
              Pickup location
            </label>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-xs font-bold text-green-700 hover:text-green-800"
            >
              {detectingLocation ? "Detecting..." : "Use current location"}
            </button>
          </div>

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

          {showPickupSuggestions && pickupItems.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-green-100 bg-white shadow-lg">
              {!pickup.trim() ? (
                <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-green-700">
                  Recent & Popular Places
                </div>
              ) : null}

              {pickupItems.map((item) => (
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

          {showDestinationSuggestions && destinationItems.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-green-100 bg-white shadow-lg">
              {!destination.trim() ? (
                <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-green-700">
                  Recent & Popular Places
                </div>
              ) : null}

              {destinationItems.map((item) => (
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
            {pickupCoords ? "Pickup found. " : ""}
            {dropoffCoords ? "Destination found." : ""}
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