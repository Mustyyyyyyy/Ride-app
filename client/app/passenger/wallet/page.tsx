"use client";

import { useEffect, useState } from "react";
import { passengerApi, paymentApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function PassengerWalletPage() {
  const { token, hydrated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadWallet(currentToken: string) {
    const [walletData, txData, accountData] = await Promise.all([
      passengerApi.getWallet(currentToken),
      passengerApi.getTransactions(currentToken),
      paymentApi.getVirtualAccount(currentToken),
    ]);

    setBalance(Number(walletData?.wallet?.balance || 0));
    setTransactions(txData?.transactions || []);
    setAccount(accountData?.account || null);
  }

  useEffect(() => {
    async function run() {
      if (!hydrated) return;

      if (!token) {
        setLoading(false);
        setError("You are not logged in.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        await loadWallet(token);
      } catch (err: any) {
        setError(err.message || "Failed to load wallet");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [hydrated, token]);

  if (!hydrated || loading) {
    return <main className="text-white">Loading wallet...</main>;
  }

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-black text-white">Wallet</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-sm text-slate-400">Available Balance</p>
            <h2 className="mt-3 text-5xl font-black text-white">
              ₦{balance.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-black text-white">Fund by Transfer</h2>
            <p className="mt-2 text-slate-400">
              Transfer to the account below.
            </p>

            {account ? (
              <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-white">
                  <strong>Bank:</strong> {account.bank_name}
                </p>
                <p className="text-white">
                  <strong>Account Number:</strong> {account.account_number}
                </p>
                <p className="text-white">
                  <strong>Account Name:</strong> {account.account_name}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-slate-400">No transfer account available yet.</p>
            )}

            {error ? <p className="mt-4 text-red-300">{error}</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-black text-white">Transactions</h2>
          <div className="mt-4 space-y-3">
            {transactions.length ? (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div>
                    <p className="font-semibold text-white">{tx.type}</p>
                    <p className="text-sm text-slate-400">
                      {tx.reference || "No reference"}
                    </p>
                  </div>
                  <p className="font-bold text-white">
                    ₦{Number(tx.amount || 0).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No transactions yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}