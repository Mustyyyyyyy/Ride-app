"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

type Ticket = {
  id: number;
  subject: string;
  category: string;
  message: string;
  status: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
};

export default function AdminSupportPage() {
  const { token, hydrated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadTickets() {
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      const res = await adminApi.getSupportTickets(token);
      setTickets(res.tickets || []);
    } catch (err: any) {
      setError(err.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(ticketId: number, status: string) {
    if (!token) return;

    try {
      setUpdatingId(ticketId);
      await adminApi.updateSupportStatus(ticketId, { status }, token);
      await loadTickets();
    } catch (err: any) {
      setError(err.message || "Failed to update ticket");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    if (!hydrated || !token) return;
    loadTickets();
  }, [hydrated, token]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
      <h1 className="text-3xl font-black text-white">Support Tickets</h1>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-slate-400">Loading tickets...</p>
        ) : tickets.length ? (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-bold text-white">{ticket.subject}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {ticket.user_name || "User"} • {ticket.user_email || "-"}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{ticket.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-green-300">
                    {ticket.category}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="block rounded-full bg-slate-800 px-3 py-1 text-center text-xs font-bold text-white">
                    {ticket.status}
                  </span>

                  <button
                    onClick={() => handleStatus(ticket.id, "resolved")}
                    disabled={updatingId === ticket.id}
                    className="w-full rounded-xl bg-green-500 px-3 py-2 text-sm font-bold text-slate-950"
                  >
                    {updatingId === ticket.id ? "Updating..." : "Mark Resolved"}
                  </button>

                  <button
                    onClick={() => handleStatus(ticket.id, "open")}
                    disabled={updatingId === ticket.id}
                    className="w-full rounded-xl bg-slate-700 px-3 py-2 text-sm font-bold text-white"
                  >
                    Reopen
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No support tickets found.</p>
        )}
      </div>
    </div>
  );
}