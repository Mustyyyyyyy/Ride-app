"use client";

type Props = {
  ride: any;
  onUpdate: (status: string) => Promise<void>;
};

export default function DriverTripActions({ ride, onUpdate }: Props) {
  const canStart = ride.status === "accepted";
  const canComplete = ride.status === "ongoing";
  const canCancel = ["accepted", "ongoing"].includes(ride.status);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-2xl font-black text-white">Trip Actions</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => onUpdate("ongoing")}
          disabled={!canStart}
          className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Start Ride
        </button>

        <button
          onClick={() => onUpdate("completed")}
          disabled={!canComplete}
          className="rounded-xl bg-green-600 px-s4 py-2 font-bold text-white disabled:opacity-50"
        >
          Complete Ride
        </button>

        <button
          onClick={() => onUpdate("cancelled")}
          disabled={!canCancel}
          className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          Cancel Ride
        </button>
      </div>
    </section>
  );
}