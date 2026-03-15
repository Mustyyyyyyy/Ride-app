"use client";

import { useEffect, useState } from "react";
import { passengerApi, paymentApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

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
    return <main className="text-gray-900">Loading wallet...</main>;
  }

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Wallet</h1>
        </AnimatedCard>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-6">
            <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Available Balance</p>
              <h2 className="mt-3 text-5xl font-black text-green-700">
                ₦{balance.toLocaleString()}
              </h2>
            </AnimatedCard>

            <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900">Fund by Transfer</h2>
              <p className="mt-2 text-gray-500">
                Transfer to the account below. Your wallet updates after payment confirmation.
              </p>

              {account ? (
                <div className="mt-5 space-y-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-gray-900">
                    <strong>Bank:</strong> {account.bank_name}
                  </p>
                  <p className="text-gray-900">
                    <strong>Account Number:</strong> {account.account_number}
                  </p>
                  <p className="text-gray-900">
                    <strong>Account Name:</strong> {account.account_name}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-gray-500">No transfer account available yet.</p>
              )}

              {error ? <p className="mt-4 text-red-600">{error}</p> : null}
            </AnimatedCard>
          </section>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900">Transactions</h2>
            <div className="mt-4 space-y-3">
              {transactions.length ? (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{tx.type}</p>
                      <p className="text-sm text-gray-500">
                        {tx.reference || "No reference"}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      ₦{Number(tx.amount || 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No transactions yet.</p>
              )}
            </div>
          </AnimatedCard>
        </div>
      </main>
    </PageTransition>
  );
}