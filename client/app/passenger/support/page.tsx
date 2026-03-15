"use client";

import { FormEvent, useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { passengerApi } from "@/lib/api";
import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function PassengerSupportPage() {
  const { token, hydrated } = useAuth();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTickets(currentToken: string) {
    const data = await passengerApi.getSupportTickets(currentToken);
    setTickets(data?.tickets || []);
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
        await loadTickets(token);
      } catch (err: any) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [hydrated, token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    setFeedback("");
    setError("");

    try {
      await passengerApi.createSupportTicket(
        { subject, category, message },
        token
      );

      setSubject("");
      setCategory("general");
      setMessage("");
      setFeedback("Support ticket submitted successfully");
      await loadTickets(token);
    } catch (err: any) {
      setError(err.message || "Failed to submit support ticket");
    }
  };

  if (!hydrated || loading) {
    return <main className="text-gray-900">Loading support...</main>;
  }

  return (
    <PageTransition>
      <main className="space-y-6">
        <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-gray-900">Support</h1>
        </AnimatedCard>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
              >
                <option value="general">General</option>
                <option value="ride">Ride Issue</option>
                <option value="payment">Payment Issue</option>
                <option value="wallet">Wallet</option>
              </select>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Explain the issue"
                className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900"
              />

              <AnimatedButton
                type="submit"
                className="w-full rounded-2xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700"
              >
                Submit Ticket
              </AnimatedButton>

              {feedback ? <p className="text-green-700">{feedback}</p> : null}
              {error ? <p className="text-red-600">{error}</p> : null}
            </form>
          </AnimatedCard>

          <AnimatedCard className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900">My Tickets</h2>
            <div className="mt-4 space-y-3">
              {tickets.length ? (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-green-100 bg-green-50 p-4"
                  >
                    <p className="font-bold text-gray-900">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-gray-600">{ticket.category}</p>
                    <p className="mt-1 text-sm text-gray-600">{ticket.status}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No support tickets yet.</p>
              )}
            </div>
          </AnimatedCard>
        </div>
      </main>
    </PageTransition>
  );
}