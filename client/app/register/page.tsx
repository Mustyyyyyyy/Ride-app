"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";

function getRedirectPath(role: string) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "driver") return "/driver/dashboard";
  return "/passenger/dashboard";
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const user = await register({
        name,
        email,
        phone,
        password,
        role,
      });

      router.push(getRedirectPath(user.role));
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white px-4 py-10 text-gray-900">
      <div className="mx-auto grid min-h-[85vh] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_1fr]">
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
              <p className="text-sm text-gray-500">Modern urban transport platform</p>
            </div>
          </div>

          <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
            Create Account
          </p>

          <h2 className="mt-5 text-5xl font-black leading-tight tracking-tight text-gray-900">
            Join a smarter ride ecosystem built for passengers and drivers.
          </h2>

          <p className="mt-5 text-lg leading-8 text-gray-600">
            Create your ORIDE account to book rides, manage trips, access driver tools,
            track wallet activity, and enjoy a more organized transport experience.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm text-gray-500">Passenger Experience</p>
              <h3 className="mt-2 text-xl font-black text-green-700">Fast ride requests</h3>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm text-gray-500">Driver Experience</p>
              <h3 className="mt-2 text-xl font-black text-green-700">Trip and wallet control</h3>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm text-gray-500">Platform Access</p>
              <h3 className="mt-2 text-xl font-black text-green-700">One system, multiple roles</h3>
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
                New User
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm md:p-10">
            <div className="mb-8">
              <p className="mb-3 inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                Register
              </p>

              <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                Create your ORIDE account
              </h1>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Set up your account as a passenger or driver and get started right away.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
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
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08000000000"
                    className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Register as
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("passenger")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      role === "passenger"
                        ? "border-green-500 bg-green-50 ring-4 ring-green-100"
                        : "border-green-100 bg-white hover:bg-green-50"
                    }`}
                  >
                    <p className="font-bold text-gray-900">Passenger</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Book rides and manage your trips.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("driver")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      role === "driver"
                        ? "border-green-500 bg-green-50 ring-4 ring-green-100"
                        : "border-green-100 bg-white hover:bg-green-50"
                    }`}
                  >
                    <p className="font-bold text-gray-900">Driver</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Accept trips and manage earnings.
                    </p>
                  </button>
                </div>
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
                {loading ? "Creating account..." : "Create Account"}
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-green-700 transition hover:text-green-800"
              >
                Login
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}