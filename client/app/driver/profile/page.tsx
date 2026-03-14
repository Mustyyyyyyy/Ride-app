"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import DriverProfileForm from "@/components/driver/DriverProfileForm";

export default function DriverProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    driverApi
      .getProfile(token)
      .then((data) => setProfile(data?.profile || {}))
      .catch((err) => setError(err.message || "Failed to load profile"));
  }, [token]);

  const handleSave = async (payload: {
    vehicle_model: string;
    plate_number: string;
    vehicle_color: string;
    is_online: boolean;
  }) => {
    await driverApi.updateProfile(payload, token);
    const data = await driverApi.getProfile(token);
    setProfile(data?.profile || {});
  };

  if (error) {
    return <main className="text-red-300">{error}</main>;
  }

  if (!profile) {
    return <main className="text-white">Loading profile...</main>;
  }

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">Driver Profile</h1>
      </div>

      <DriverProfileForm initialData={profile} onSave={handleSave} />
    </main>
  );
}