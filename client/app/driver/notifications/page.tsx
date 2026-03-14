"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function DriverNotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    driverApi
      .getNotifications(token)
      .then((data) => setNotifications(data?.notifications || []))
      .catch((err) => setError(err.message || "Failed to load notifications"));
  }, [token]);

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">Notifications</h1>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        {error ? (
          <p className="text-red-300">{error}</p>
        ) : notifications.length ? (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
              >
                <p className="font-bold text-white">{item.title}</p>
                <p className="mt-1 text-slate-400">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No notifications yet.</p>
        )}
      </section>
    </main>
  );
}