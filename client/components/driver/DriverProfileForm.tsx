"use client";

import { useState } from "react";

type DriverProfileFormProps = {
  initialData?: {
    vehicleModel?: string;
    plateNumber?: string;
    vehicleType?: string;
    vehicleBrand?: string;
    isOnline?: boolean;
  };
  onSave: (payload: {
    vehicleModel: string;
    plateNumber: string;
    vehicleType: string;
    vehicleBrand: string;
    isOnline: boolean;
  }) => Promise<void>;
};

export default function DriverProfileForm({
  initialData,
  onSave,
}: DriverProfileFormProps) {
  const [vehicleModel, setVehicleModel] = useState(
    initialData?.vehicleModel || ""
  );
  const [plateNumber, setPlateNumber] = useState(
    initialData?.plateNumber || ""
  );
  const [vehicleType, setVehicleType] = useState(
    initialData?.vehicleType || ""
  );
  const [vehicleBrand, setVehicleBrand] = useState(
    initialData?.vehicleBrand || ""
  );
  const [isOnline, setIsOnline] = useState(!!initialData?.isOnline);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setMessage("");
    setError("");

    try {
      setLoading(true);

      await onSave({
        vehicleModel: vehicleModel,
        plateNumber: plateNumber,
        vehicleType: vehicleType,
        vehicleBrand: vehicleBrand,
        isOnline: isOnline,
      });

      setMessage("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 space-y-4">
      <input
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        placeholder="Vehicle model"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
      />

      <input
        value={plateNumber}
        onChange={(e) => setPlateNumber(e.target.value)}
        placeholder="Plate number"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
      />

      <input
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        placeholder="Vehicle type"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
      />

      <input
        value={vehicleBrand}
        onChange={(e) => setVehicleBrand(e.target.value)}
        placeholder="Vehicle brand"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
      />

      <label className="flex items-center gap-3 text-white">
        <input
          type="checkbox"
          checked={isOnline}
          onChange={(e) => setIsOnline(e.target.checked)}
        />
        Go Online
      </label>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 font-bold text-white disabled:opacity-70"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>

      {message ? <p className="text-green-300">{message}</p> : null}
      {error ? <p className="text-red-300">{error}</p> : null}
    </section>
  );
}