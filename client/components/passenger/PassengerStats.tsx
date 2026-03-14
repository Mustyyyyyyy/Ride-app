const stats = [
  {
    title: "Completed Trips",
    value: "18",
    subtitle: "Your finished rides",
  },
  {
    title: "Pending Trips",
    value: "2",
    subtitle: "Waiting for driver action",
  },
  {
    title: "Saved Amount",
    value: "₦12,500",
    subtitle: "Promo and fare savings",
  },
  {
    title: "Rating",
    value: "4.9",
    subtitle: "Passenger account score",
  },
];

export default function PassengerStats() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
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