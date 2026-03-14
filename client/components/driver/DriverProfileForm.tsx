"use client";

import { useState } from "react";

type DriverProfileFormProps = {
  initialData?: {
    vehicle_model?: string;
    plate_number?: string;
    vehicle_color?: string;
    is_online?: boolean;
  };
  onSave: (payload: {
    vehicle_model: string;
    plate_number: string;
    vehicle_color: string;
    is_online: boolean;
  }) => Promise<void>;
};

export default function DriverProfileForm({
  initialData,
  onSave,
}: DriverProfileFormProps) {
  const [vehicleModel, setVehicleModel] = useState(
    initialData?.vehicle_model || ""
  );
  const [plateNumber, setPlateNumber] = useState(
    initialData?.plate_number || ""
  );
  const [vehicleColor, setVehicleColor] = useState(
    initialData?.vehicle_color || ""
  );
  const [isOnline, setIsOnline] = useState(!!initialData?.is_online);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setMessage("");
    setError("");

    try {
      setLoading(true);

      await onSave({
        vehicle_model: vehicleModel,
        plate_number: plateNumber,
        vehicle_color: vehicleColor,
        is_online: isOnline,
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
        value={vehicleColor}
        onChange={(e) => setVehicleColor(e.target.value)}
        placeholder="Vehicle color"
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