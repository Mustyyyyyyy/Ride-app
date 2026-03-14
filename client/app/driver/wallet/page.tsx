"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function DriverWalletPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadWallet = async () => {
    const result = await driverApi.getWallet(token);
    setData(result);
  };

  useEffect(() => {
    loadWallet().catch((err) =>
      setError(err.message || "Failed to load wallet")
    );
  }, [token]);

  const handleWithdraw = async () => {
    setMessage("");
    setError("");

    try {
      await driverApi.withdrawWallet({ amount: Number(amount) }, token);
      setAmount("");
      setMessage("Withdrawal successful");
      await loadWallet();
    } catch (err: any) {
      setError(err.message || "Failed to withdraw funds");
    }
  };

  if (error && !data) return <main className="text-red-300">{error}</main>;
  if (!data) return <main className="text-white">Loading wallet...</main>;

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">Driver Wallet</h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <p className="text-sm text-slate-400">Available Balance</p>
          <h2 className="mt-3 text-5xl font-black text-white">
            ₦{Number(data.wallet.balance || 0).toLocaleString()}
          </h2>

          <div className="mt-6 space-y-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter withdrawal amount"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
            />

            <button
              onClick={handleWithdraw}
              className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 font-bold text-white"
            >
              Withdraw Funds
            </button>

            {message ? <p className="text-green-300">{message}</p> : null}
            {error ? <p className="text-red-300">{error}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-black text-white">Transactions</h2>
          <div className="mt-4 space-y-3">
            {data.transactions.length ? (
              data.transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-semibold text-white">{tx.type}</p>
                  <p className="text-sm text-slate-400">{tx.reference}</p>
                  <p className="mt-1 text-white">
                    ₦{Number(tx.amount || 0).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No transactions yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}