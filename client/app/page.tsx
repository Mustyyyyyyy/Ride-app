"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    title: "Fast Ride Booking",
    text: "Book a ride in seconds with a clean and simple passenger flow.",
  },
  {
    title: "Driver Management",
    text: "Drivers can go online, accept trips, manage earnings, and track activity.",
  },
  {
    title: "Wallet & Payments",
    text: "Manage wallet funding, trip deductions, and financial records in one place.",
  },
  {
    title: "Real-Time Operations",
    text: "Built to support live ride flow, trip status updates, and admin monitoring.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create an account",
    text: "Sign up as a passenger or driver and access the right dashboard instantly.",
  },
  {
    number: "02",
    title: "Request or accept rides",
    text: "Passengers book rides while drivers receive and manage active requests.",
  },
  {
    number: "03",
    title: "Track trips and payments",
    text: "Follow ride activity, wallet balance, trip history, and notifications.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-green-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-green-600 text-lg font-black text-white">
              O
            </div>
            <div>
              <h1 className="text-xl font-black text-green-700">ORIDE</h1>
              <p className="text-xs text-gray-500">Smarter urban transport</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-green-700">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-semibold text-gray-600 hover:text-green-700">
              How it works
            </a>
            <a href="#roles" className="text-sm font-semibold text-gray-600 hover:text-green-700">
              Roles
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-green-100 bg-white px-4 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-green-700">
                Mobility Platform
              </span>
            </div>

            <h2 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight text-gray-900 md:text-6xl">
              A modern ride platform for{" "}
              <span className="text-green-700">passengers, drivers, and admins</span>.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              ORIDE helps passengers request rides quickly, gives drivers control over trips and earnings,
              and lets administrators manage the platform from one clean dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-green-700"
              >
                Create Account
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-green-100 bg-white px-6 py-3.5 text-sm font-bold text-green-700 transition hover:bg-green-50"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Passengers</p>
                <h3 className="mt-2 text-2xl font-black text-green-700">Easy booking</h3>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Drivers</p>
                <h3 className="mt-2 text-2xl font-black text-green-700">Trip control</h3>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Admin</p>
                <h3 className="mt-2 text-2xl font-black text-green-700">Live oversight</h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative"
          >
            <div className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-sm md:p-6">
              <div className="rounded-[1.7rem] border border-green-100 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-100">
                      ORIDE Overview
                    </p>
                    <h3 className="mt-3 text-3xl font-black leading-tight">
                      Clean transport workflow with modern control.
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-bold">
                    Live
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-sm text-green-50">Wallet</p>
                    <h4 className="mt-2 text-2xl font-black">Smart funding</h4>
                    <p className="mt-2 text-sm text-green-50/90">
                      Handle wallet activity and payments with a simpler flow.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-sm text-green-50">Trips</p>
                    <h4 className="mt-2 text-2xl font-black">Ride lifecycle</h4>
                    <p className="mt-2 text-sm text-green-50/90">
                      Manage request, acceptance, progress, and completion stages.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-sm text-green-50">Support</p>
                    <h4 className="mt-2 text-2xl font-black">Issue tracking</h4>
                    <p className="mt-2 text-sm text-green-50/90">
                      Keep riders and drivers connected through structured support.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-sm text-green-50">Admin</p>
                    <h4 className="mt-2 text-2xl font-black">Operational view</h4>
                    <p className="mt-2 text-sm text-green-50/90">
                      Monitor users, rides, drivers, and support activity.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Passengers</p>
                  <p className="mt-2 text-xl font-black text-green-700">Request rides</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Drivers</p>
                  <p className="mt-2 text-xl font-black text-green-700">Manage trips</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm text-gray-500">Admins</p>
                  <p className="mt-2 text-xl font-black text-green-700">Control platform</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
              Features
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              Built to run a modern ride operation from one platform
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              ORIDE combines booking, driver tools, support handling, wallet management,
              and admin control into a cleaner product experience.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-lg font-black text-green-700">
                  0{index + 1}
                </div>
                <h3 className="mt-5 text-xl font-black text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
              How it works
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              A simple flow from onboarding to active ride operations
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Whether you are booking a ride, driving for the platform, or managing the system,
              the workflow stays organized and easy to follow.
            </p>
          </div>

          <div className="space-y-5">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-lg font-black text-white">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">{step.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
              Roles
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              Designed for every part of the platform
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-2xl font-black text-gray-900">Passenger</h3>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                Book rides, check ride status, manage wallet balance, and track notifications and support tickets.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                Join as Passenger
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-2xl font-black text-gray-900">Driver</h3>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                Accept trips, manage ride progress, track earnings, update profile details, and control online status.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                Join as Driver
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-2xl font-black text-gray-900">Admin</h3>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                Oversee users, drivers, rides, and support issues with a more structured and centralized dashboard.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex rounded-2xl border border-green-100 bg-green-50 px-5 py-3 text-sm font-bold text-green-700 hover:bg-green-100"
              >
                Admin Access
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 md:pb-24">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-[2.3rem] border border-green-100 bg-green-600 p-8 text-white shadow-sm md:p-12"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-100">
                  Ready to begin?
                </p>
                <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                  Start using ORIDE today.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-green-50">
                  Create an account, access your dashboard, and experience a more polished
                  ride booking and management workflow.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-green-700 transition hover:bg-green-50"
                >
                  Create Account
                </Link>

                <Link
                  href="/login"
                  className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}