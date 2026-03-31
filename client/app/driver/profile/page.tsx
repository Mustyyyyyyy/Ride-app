"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { getSocket } from "@/lib/socket";

export default function DriverProfilePage() {
  const { token, user } = useAuth();

  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleImage, setVehicleImage] = useState("");
  const [rideCategories, setRideCategories] = useState<string[]>(["standard"]);
  const [isOnline, setIsOnline] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
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
        setVehicleImage(profile?.vehicle_image || "");
        setRideCategories(profile?.ride_categories || ["standard"]);
        setIsOnline(!!profile?.is_online);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      }
    }

    loadProfile();
  }, [token]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socket.emit("joinDriver", { driverId: user.id });
    socket.emit("updateDriverCategories", {
      categories: rideCategories,
    });
  }, [user?.id, rideCategories]);

  const toggleCategory = (category: string) => {
    setRideCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    try {
      setUploadingImage(true);
      const res = await driverApi.uploadVehicleImage(file, token);
      setVehicleImage(res?.vehicle_image || "");
      setMessage("Vehicle image uploaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setMessage("");
    setError("");

    try {
      await driverApi.updateProfile(
        {
          vehicle_model: vehicleModel,
          plate_number: plateNumber,
          vehicle_color: vehicleColor,
          vehicle_image: vehicleImage,
          ride_categories: rideCategories,
          is_online: isOnline,
        },
        token
      );

      const socket = getSocket();
      socket.emit("updateDriverCategories", {
        categories: rideCategories,
      });

      setMessage("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">
            Driver Profile
          </h1>
        </AnimatedCard>

        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="font-bold text-gray-900">Vehicle Image</p>

              {vehicleImage ? (
                <img
                  src={vehicleImage}
                  alt="Vehicle"
                  className="h-48 w-full rounded-2xl object-cover border border-green-100"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-green-200 bg-green-50 text-sm text-gray-500">
                  No vehicle image uploaded yet
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-2xl border border-green-100 px-4 py-3"
              />

              {uploadingImage ? (
                <p className="text-sm text-green-700">Uploading image...</p>
              ) : null}
            </div>

            <input
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Vehicle Model"
              className="w-full rounded-2xl border border-green-100 px-4 py-3"
            />

            <input
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="Plate Number"
              className="w-full rounded-2xl border border-green-100 px-4 py-3"
            />

            <input
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
              placeholder="Vehicle Color"
              className="w-full rounded-2xl border border-green-100 px-4 py-3"
            />

            <div className="space-y-2">
              <p className="font-bold text-gray-900">Ride Categories</p>

              <div className="flex flex-wrap gap-3">
                {["standard", "comfort", "premium"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-xl px-4 py-2 font-semibold ${
                      rideCategories.includes(cat)
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 p-4">
              <div>
                <p className="font-bold text-gray-900">Driver Availability</p>
                <p className="text-sm text-gray-500">
                  {isOnline
                    ? "You can receive ride requests"
                    : "You are offline"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOnline((prev) => !prev)}
                className={`relative inline-flex h-10 w-20 items-center rounded-full ${
                  isOnline ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 rounded-full bg-white transition ${
                    isOnline ? "translate-x-11" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <AnimatedButton
              onClick={handleSave}
              className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white"
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