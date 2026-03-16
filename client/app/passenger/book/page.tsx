"use client";

import { useState } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import useAuth from "@/hooks/useAuth";
import { rideApi } from "@/lib/api";

export default function BookRidePage() {
  const { user, token } = useAuth();

  const [pickup, setPickup] = useState<any>(null);
  const [dropoff, setDropoff] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  async function fetchRoute(p1: any, p2: any) {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );

    const data = await res.json();
    const r = data?.routes?.[0];

    if (r) setRoute(r.geometry);
  }

  const handleMapClick = async (e: any) => {
    const { lng, lat } = e.lngLat;

    if (!pickup) {
      setPickup({ lat, lng });
    } else if (!dropoff) {
      const dest = { lat, lng };
      setDropoff(dest);
      await fetchRoute(pickup, dest);
    }
  };

  const handleRequestRide = async () => {
  if (!pickup || !dropoff) return;

  if (!user?.id) {
    alert("You must be logged in");
    return;
  }

  try {
    setLoading(true);

    await rideApi.requestRide(
      {
        passenger_id: Number(user.id),
        pickup: "Selected on map",
        dropoff: "Selected on map",
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        ride_type: "standard",
        payment_method: "wallet",
      },
      token
    );

    alert("Ride requested!");
    setPickup(null);
    setDropoff(null);
    setRoute(null);
  } catch (err) {
    console.error(err);
    alert("Failed to request ride");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl">

      <Map
        initialViewState={{
          longitude: 3.3792,
          latitude: 6.5244,
          zoom: 12,
        }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
      >

        {pickup && (
          <Marker longitude={pickup.lng} latitude={pickup.lat}>
            <div className="h-10 w-10 rounded-full bg-green-600 grid place-items-center text-white">
              📍
            </div>
          </Marker>
        )}

        {dropoff && (
          <Marker longitude={dropoff.lng} latitude={dropoff.lat}>
            <div className="h-10 w-10 rounded-full bg-black grid place-items-center text-white">
              🏁
            </div>
          </Marker>
        )}

        {route && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: "Feature",
              geometry: route,
              properties: {},
            }}
          >
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#16a34a",
                "line-width": 5,
              }}
            />
          </Source>
        )}

      </Map>

      <div className="absolute bottom-6 left-1/2 w-[90%] max-w-xl -translate-x-1/2 rounded-2xl bg-white p-6 shadow-lg">

        <p className="font-bold text-gray-900">
          {!pickup
            ? "Tap map to select pickup"
            : !dropoff
            ? "Tap map to select destination"
            : "Ready to request ride"}
        </p>

        <button
          onClick={handleRequestRide}
          disabled={!pickup || !dropoff || loading}
          className="mt-4 w-full rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-40"
        >
          {loading ? "Requesting Ride..." : "Request Ride"}
        </button>

      </div>
    </div>
  );
}