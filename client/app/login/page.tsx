"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const user = await login({
        email,
        password,
      });

      if (user.role === "driver") {
        router.replace("/driver/dashboard");
        return;
      }

      if (user.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      router.replace("/passenger/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white px-4 py-10 text-gray-900">
      <div className="mx-auto grid min-h-[85vh] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm lg:block"
        >
          <div className="mb-8 inline-flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-green-600 text-xl font-black text-white">
              O
            </div>
            <div>
              <h1 className="text-2xl font-black text-green-700">ORIDE</h1>
              <p className="text-sm text-gray-500">Smart mobility for everyday movement</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
              Welcome back
            </p>

            <h2 className="mt-5 text-5xl font-black leading-tight tracking-tight text-gray-900">
              Ride smarter with a cleaner, faster transport experience.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-600">
              Access your passenger, driver, or admin account and continue where you left off.
              Book rides, manage trips, track wallet activity, and stay in control from one place.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm text-gray-500">Fast Booking</p>
              <h3 className="mt-2 text-xl font-black text-green-700">Instant access</h3>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm text-gray-500">Wallet System</p>
              <h3 className="mt-2 text-xl font-black text-green-700">Easy payments</h3>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm text-gray-500">Live Operations</p>
              <h3 className="mt-2 text-xl font-black text-green-700">Real tracking</h3>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 28, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-green-700"
            >
              ← Back to home
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-white px-3 py-2 shadow-sm">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-green-700">
                Secure Access
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm md:p-10">
            <div className="mb-8">
              <p className="mb-3 inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                Sign In
              </p>

              <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                Welcome to ORIDE
              </h1>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Enter your account details to continue to your dashboard.
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

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>

                  <Link
  href="/forgot-password"
  className="text-sm font-semibold text-green-700 transition hover:text-green-800"
>
  Forgot password?
</Link>
                </div>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={loading ? {} : { y: -2 }}
                whileTap={loading ? {} : { scale: 0.99 }}
                className="w-full rounded-2xl bg-green-600 px-4 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </motion.button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-green-100" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                ORIDE
              </span>
              <div className="h-px flex-1 bg-green-100" />
            </div>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-green-700 transition hover:text-green-800"
              >
                Create one
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}