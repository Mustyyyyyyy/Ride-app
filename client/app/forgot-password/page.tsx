"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      const data = await authApi.forgotPassword({ email });
      setMessage(data.message || "Reset link sent");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white px-4 py-10 text-gray-900">
      <div className="mx-auto flex min-h-[85vh] max-w-xl items-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full"
        >
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-700"
            >
              ← Back to login
            </Link>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm md:p-10">
            {!success ? (
              <>
                <div className="mb-8">
                  <p className="mb-3 inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                    Password Reset
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                    Forgot your password?
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    Enter your email and we’ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-green-600 px-4 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-4xl text-green-700">
                  ✉
                </div>

                <h2 className="mt-6 text-3xl font-black text-gray-900">
                  Check your email
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {message ||
                    "We sent your reset link. Open your inbox and follow the link to create a new password."}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-green-600 px-5 py-3 text-center font-bold text-white hover:bg-green-700"
                  >
                    Open Gmail
                  </a>

                  <Link
                    href="/login"
                    className="rounded-2xl border border-green-100 bg-white px-5 py-3 text-center font-bold text-green-700 hover:bg-green-50"
                  >
                    Back to login
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}