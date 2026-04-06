"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

type DriverItem = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  vehicle_model?: string;
  plate_number?: string;
  vehicle_type?: string;
  is_online?: boolean;
};

export default function AdminDriversPage() {
  const { token, hydrated } = useAuth();
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!hydrated || !token) return;

      try {
        setLoading(true);
        setError("");
        const res = await adminApi.getDrivers(token);
        setDrivers(res.drivers || []);
      } catch (err: any) {
        setError(err.message || "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, hydrated]);

  const handleDelete = async (driverId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmed) return;
    if (!token) return;

    try {
      setDeletingId(driverId);
      setError("");

      await adminApi.deleteDriver(driverId, token);

      setDrivers((prev) => prev.filter((driver) => driver.id !== driverId));
    } catch (err: any) {
      setError(err.message || "Failed to delete driver");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageTransition>
      <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900">Drivers</h1>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading drivers...</p>
          ) : drivers.length ? (
            drivers.map((driver) => (
              <div
                key={driver.id}
                className="rounded-2xl border border-green-100 bg-green-50 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {driver.name}
                    </p>
                    <p className="text-sm text-gray-500">{driver.email}</p>
                    <p className="text-sm text-gray-500">{driver.phone || "-"}</p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        driver.is_online
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {driver.is_online ? "Online" : "Offline"}
                    </span>

                    <button
                      onClick={() => handleDelete(driver.id)}
                      disabled={deletingId === driver.id}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === driver.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Vehicle</p>
                    <p className="font-semibold text-gray-900">
                      {driver.vehicle_model || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Plate</p>
                    <p className="font-semibold text-gray-900">
                      {driver.plate_number || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-semibold text-gray-900">
                      {driver.vehicle_type || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No drivers found.</p>
          )}
        </div>
      </AnimatedCard>
    </PageTransition>
  );
}