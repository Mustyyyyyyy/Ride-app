type DriverStatsProps = {
  stats: {
    total_trips: number;
    completed_trips: number;
    ongoing_trips: number;
    total_earnings: number;
  };
  walletBalance: number;
};

export default function DriverStats({
  stats,
  walletBalance,
}: DriverStatsProps) {
  const items = [
    {
      title: "Total Trips",
      value: stats.total_trips,
      subtitle: "All assigned rides",
    },
    {
      title: "Completed Trips",
      value: stats.completed_trips,
      subtitle: "Successfully finished",
    },
    {
      title: "Ongoing Trips",
      value: stats.ongoing_trips,
      subtitle: "Active right now",
    },
    {
      title: "Wallet Balance",
      value: `₦${Number(walletBalance || 0).toLocaleString()}`,
      subtitle: "Current driver balance",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20"
        >
          <p className="text-sm font-medium text-slate-400">{item.title}</p>
          <h3 className="mt-3 text-3xl font-black text-white">{item.value}</h3>
          <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
        </div>
      ))}
    </section>
  );
}