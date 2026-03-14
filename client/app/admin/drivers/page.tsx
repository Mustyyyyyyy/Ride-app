"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

type DriverItem = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  vehicle_model?: string;
  plate_number?: string;
  vehicle_color?: string;
  is_online?: boolean;
};

export default function AdminDriversPage() {
  const { token, hydrated } = useAuth();
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
      <h1 className="text-3xl font-black text-white">Drivers</h1>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-slate-400">Loading drivers...</p>
        ) : drivers.length ? (
          drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-bold text-white">{driver.name}</p>
                  <p className="text-sm text-slate-400">{driver.email}</p>
                  <p className="text-sm text-slate-500">{driver.phone || "-"}</p>
                </div>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    driver.is_online
                      ? "bg-green-500/20 text-green-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {driver.is_online ? "Online" : "Offline"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Vehicle</p>
                  <p className="font-semibold text-white">
                    {driver.vehicle_model || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Plate</p>
                  <p className="font-semibold text-white">
                    {driver.plate_number || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Color</p>
                  <p className="font-semibold text-white">
                    {driver.vehicle_color || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No drivers found.</p>
        )}
      </div>
    </div>
  );
}