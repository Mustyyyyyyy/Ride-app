"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import { getSocket } from "@/lib/socket";

type Point = {
  lat: number;
  lng: number;
};

type Props = {
  rideId: number | string;
  pickup: Point;
  dropoff: Point;
};

export default function RideLiveMap({ rideId, pickup, dropoff }: Props) {
  const mapRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  const [driver, setDriver] = useState<Point | null>(null);
  const [animatedDriver, setAnimatedDriver] = useState<Point | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("joinRideRoom", rideId);

    const handleLocationUpdate = (data: any) => {
      if (!data) return;

      const nextDriver = {
        lat: Number(data.lat),
        lng: Number(data.lng),
      };

      setDriver(nextDriver);
    };

    socket.on("driver:locationUpdate", handleLocationUpdate);

    return () => {
      socket.off("driver:locationUpdate", handleLocationUpdate);
    };
  }, [rideId]);

  useEffect(() => {
    if (!driver) return;

    if (!animatedDriver) {
      setAnimatedDriver(driver);
      mapRef.current?.flyTo({
        center: [driver.lng, driver.lat],
        speed: 0.8,
      });
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = { ...animatedDriver };
    const end = { ...driver };
    const duration = 800;
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);

      const lat = start.lat + (end.lat - start.lat) * eased;
      const lng = start.lng + (end.lng - start.lng) * eased;

      const current = { lat, lng };
      setAnimatedDriver(current);

      mapRef.current?.flyTo({
        center: [lng, lat],
        speed: 0.6,
        essential: true,
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [driver]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function getRoute() {
      const sourcePoint = animatedDriver || driver;
      if (!sourcePoint) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${sourcePoint.lng},${sourcePoint.lat};${dropoff.lng},${dropoff.lat}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );

        const data = await res.json();
        const routeData = data?.routes?.[0];

        if (!routeData) return;

        setRoute(routeData.geometry);
        setEta(routeData.duration || null);
        setDistance(routeData.distance || null);
      } catch (error) {
        console.error("Failed to fetch route:", error);
      }
    }

    getRoute();
  }, [animatedDriver, driver, dropoff.lng, dropoff.lat]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-sm">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: pickup.lng,
          latitude: pickup.lat,
          zoom: 13,
        }}
        style={{ width: "100%", height: 420 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <Marker longitude={pickup.lng} latitude={pickup.lat}>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-green-600 text-lg text-white shadow-lg">
            📍
          </div>
        </Marker>

        <Marker longitude={dropoff.lng} latitude={dropoff.lat}>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-900 text-lg text-white shadow-lg">
            🏁
          </div>
        </Marker>

        {animatedDriver && (
          <Marker longitude={animatedDriver.lng} latitude={animatedDriver.lat}>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl shadow-lg ring-2 ring-green-500">
              🚗
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
                "line-opacity": 0.9,
              }}
            />
          </Source>
        )}
      </Map>

      <div className="flex flex-wrap items-center gap-3 border-t border-green-100 bg-green-50 px-5 py-4 text-sm text-gray-700">
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-green-700">
          Live Tracking
        </span>

        {eta !== null ? (
          <span>
            ETA: <strong>{Math.max(1, Math.round(eta / 60))} mins</strong>
          </span>
        ) : (
          <span>
            ETA: <strong>Calculating...</strong>
          </span>
        )}

        {distance !== null ? (
          <span>
            Distance: <strong>{(distance / 1000).toFixed(1)} km</strong>
          </span>
        ) : (
          <span>
            Distance: <strong>Calculating...</strong>
          </span>
        )}
      </div>
    </div>
  );
}