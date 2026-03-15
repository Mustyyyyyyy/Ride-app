"use client";

import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedCard from "@/components/ui/AnimatedCard";

type Props = {
  ride: any;
  onUpdate: (status: string) => Promise<void>;
};

export default function DriverTripActions({ ride, onUpdate }: Props) {
  const canStart = ride.status === "accepted";
  const canComplete = ride.status === "ongoing";
  const canCancel = ["accepted", "ongoing"].includes(ride.status);

  return (
    <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-gray-900">Trip Actions</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <AnimatedButton
          onClick={() => onUpdate("ongoing")}
          disabled={!canStart}
          className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Start Ride
        </AnimatedButton>

        <AnimatedButton
          onClick={() => onUpdate("completed")}
          disabled={!canComplete}
          className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Complete Ride
        </AnimatedButton>

        <AnimatedButton
          onClick={() => onUpdate("cancelled")}
          disabled={!canCancel}
          className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Cancel Ride
        </AnimatedButton>
      </div>
    </AnimatedCard>
  );
}