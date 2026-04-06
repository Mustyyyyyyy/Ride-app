"use client";

import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

type Props = {
  ride: any;
  onAccept: (rideId: number | string) => void;
  accepting?: boolean;
};

export default function AvailableRideCard({
  ride,
  onAccept,
  accepting,
}: Props) {
  return (
    <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {ride.pickup} → {ride.dropoff}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Passenger: {ride.passenger_name || "Unknown"}
          </p>
          <p className="mt-1 text-sm font-semibold text-green-700">
            ₦{Number(ride.fare || 0).toLocaleString()}
          </p>
        </div>

        <AnimatedButton
          onClick={() => onAccept(ride.id)}
          disabled={accepting}
          className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {accepting ? "Accepting..." : "Accept Ride"}
        </AnimatedButton>
      </div>
    </AnimatedCard>
  );
}