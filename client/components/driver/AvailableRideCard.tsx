"use client";

type Ride = {
  id: number | string;
  pickup: string;
  dropoff?: string;
  destination?: string;
  price?: number | string;
  passenger_name?: string;
  status?: string;
};

type AvailableRideCardProps = {
  ride: Ride;
  onAccept: (rideId: number | string) => void;
  accepting?: boolean;
};

export default function AvailableRideCard({
  ride,
  onAccept,
  accepting = false,
}: AvailableRideCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-green-300">
            Ride #{ride.id}
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">
            {ride.pickup} → {ride.dropoff || ride.destination}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Passenger: {ride.passenger_name || "Unknown"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Status: {ride.status || "pending"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400">Fare</p>
          <p className="mt-1 text-2xl font-black text-white">
            ₦{Number(ride.price || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <button
        onClick={() => onAccept(ride.id)}
        disabled={accepting}
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {accepting ? "Accepting..." : "Accept Ride"}
      </button>
    </div>
  );
}