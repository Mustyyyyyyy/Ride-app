"use client";

import { useEffect, useState } from "react";
import { driverApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

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

  if (error && !data) return <main className="text-red-600">{error}</main>;
  if (!data) return <main className="text-gray-900">Loading wallet...</main>;

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Driver Wallet</h1>
        </AnimatedCard>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Available Balance</p>
            <h2 className="mt-3 text-5xl font-black text-green-700">
              ₦{Number(data.wallet.balance || 0).toLocaleString()}
            </h2>

            <div className="mt-6 space-y-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
              />

              <AnimatedButton
                onClick={handleWithdraw}
                className="w-full rounded-2xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700"
              >
                Withdraw Funds
              </AnimatedButton>

              {message ? <p className="text-green-700">{message}</p> : null}
              {error ? <p className="text-red-600">{error}</p> : null}
            </div>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900">Transactions</h2>
            <div className="mt-4 space-y-3">
              {data.transactions.length ? (
                data.transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="rounded-xl border border-green-100 bg-green-50 p-4"
                  >
                    <p className="font-semibold text-gray-900">{tx.type}</p>
                    <p className="text-sm text-gray-500">{tx.reference}</p>
                    <p className="mt-1 text-gray-900">
                      ₦{Number(tx.amount || 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No transactions yet.</p>
              )}
            </div>
          </AnimatedCard>
        </section>
      </main>
    </PageTransition>
  );
}