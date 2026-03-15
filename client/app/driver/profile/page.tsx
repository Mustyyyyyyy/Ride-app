"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function DriverProfilePage() {
  const { token } = useAuth();

  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await driverApi.getProfile(token);
        const profile = data?.profile;

        setVehicleModel(profile?.vehicle_model || "");
        setPlateNumber(profile?.plate_number || "");
        setVehicleColor(profile?.vehicle_color || "");
        setIsOnline(!!profile?.is_online);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      }
    }

    loadProfile();
  }, [token]);

  const handleSave = async () => {
    setMessage("");
    setError("");

    try {
      await driverApi.updateProfile(
        {
          vehicle_model: vehicleModel,
          plate_number: plateNumber,
          vehicle_color: vehicleColor,
          is_online: isOnline,
        },
        token
      );

      setMessage("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Driver Profile</h1>
        </AnimatedCard>

        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <input
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Vehicle Model"
              className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
            />

            <input
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="Plate Number"
              className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
            />

            <input
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
              placeholder="Vehicle Color"
              className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
            />

            <label className="flex items-center gap-3 text-gray-700">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
              />
              Go Online
            </label>

            <AnimatedButton
              onClick={handleSave}
              className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
            >
              Save Profile
            </AnimatedButton>

            {message ? <p className="text-green-700">{message}</p> : null}
            {error ? <p className="text-red-600">{error}</p> : null}
          </div>
        </AnimatedCard>
      </main>
    </PageTransition>
  );
}