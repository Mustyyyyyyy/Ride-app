"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

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
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Notifications</h1>
        </AnimatedCard>

        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : notifications.length ? (
            <div className="space-y-4">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-green-100 bg-green-50 p-4"
                >
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-gray-600">{item.message}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notifications yet.</p>
          )}
        </AnimatedCard>
      </main>
    </PageTransition>
  );
}