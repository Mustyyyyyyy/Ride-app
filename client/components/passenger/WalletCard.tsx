const transactions = [
  { title: "Wallet Top-up", amount: "+₦5,000", time: "Today, 9:12 AM" },
  { title: "Ride Payment", amount: "-₦2,400", time: "Yesterday, 6:45 PM" },
  { title: "Promo Credit", amount: "+₦800", time: "2 days ago" },
];

export default function WalletCard() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            Wallet
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">₦24,800</h2>
          <p className="mt-2 text-sm text-slate-400">
            Available balance for rides and payments.
          </p>
        </div>

        <button className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-bold text-white">
          Fund Wallet
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {transactions.map((tx) => (
          <div
            key={`${tx.title}-${tx.time}`}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-white">{tx.title}</p>
              <p className="mt-1 text-xs text-slate-400">{tx.time}</p>
            </div>

            <p
              className={`font-bold ${
                tx.amount.startsWith("+") ? "text-green-300" : "text-red-300"
              }`}
            >
              {tx.amount}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}