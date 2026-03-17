const rides = [
  {
    id: "RID-1021",
    route: "Challenge → UI Gate",
    fare: "₦2,400",
    status: "Completed",
    date: "Today, 8:30 AM",
  },
  {
    id: "RID-1014",
    route: "Bodija → Dugbe",
    fare: "₦1,700",
    status: "Completed",
    date: "Yesterday, 5:50 PM",
  },
  {
    id: "RID-1008",
    route: "Mokola → Ring Road",
    fare: "₦2,100",
    status: "Pending",
    date: "Yesterday, 1:15 PM",
  },
];

export default function RideHistory() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            Ride History
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Recent Trips</h2>
        </div>

        <button className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          View All
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
        <div className="hidden grid-cols-4 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-slate-400 md:grid">
          <p>Ride ID</p>
          <p>Route</p>
          <p>Fare</p>
          <p>Status</p>
        </div>

        {rides.map((ride) => (
          <div
            key={ride.id}
            className="grid gap-3 border-t border-white/10 bg-slate-900/40 px-5 py-4 md:grid-cols-4 md:items-center"
          >
            <div>
              <p className="text-xs text-slate-500 md:hidden">Ride ID</p>
              <p className="font-semibold text-white">{ride.id}</p>
              <p className="mt-1 text-xs text-slate-400">{ride.date}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 md:hidden">Route</p>
              <p className="text-white">{ride.route}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 md:hidden">Fare</p>
              <p className="font-semibold text-white">{ride.fare}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 md:hidden">Status</p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  ride.status === "Completed"
                    ? "bg-green-500/15 text-green-300"
                    : "bg-yellow-500/15 text-yellow-300"
                }`}
              >
                {ride.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}