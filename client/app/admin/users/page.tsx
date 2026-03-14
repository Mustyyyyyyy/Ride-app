"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

type UserItem = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_verified?: boolean;
};

export default function AdminUsersPage() {
  const { token, hydrated } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!hydrated || !token) return;

      try {
        setLoading(true);
        setError("");
        const res = await adminApi.getUsers(token);
        setUsers(res.users || []);
      } catch (err: any) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, hydrated]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
      <h1 className="text-3xl font-black text-white">Users</h1>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Verified</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4" colSpan={5}>
                  Loading users...
                </td>
              </tr>
            ) : users.length ? (
              users.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="px-3 py-4">{user.name}</td>
                  <td className="px-3 py-4">{user.email}</td>
                  <td className="px-3 py-4">{user.phone || "-"}</td>
                  <td className="px-3 py-4 capitalize">{user.role}</td>
                  <td className="px-3 py-4">
                    {user.is_verified ? "Yes" : "No"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-4" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}