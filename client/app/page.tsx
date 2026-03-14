import Link from "next/link";

const features = [
  {
    title: "Fast ride booking",
    text: "Request a ride in seconds with a clean, mobile-first experience built for speed and clarity.",
  },
  {
    title: "Live driver flow",
    text: "Track driver acceptance, ride progress, and trip completion with real-time ride events.",
  },
  {
    title: "Wallet and trip history",
    text: "Manage balances, monitor payments, and review past rides from one polished dashboard.",
  },
  {
    title: "Admin visibility",
    text: "Oversee drivers, passengers, rides, support tickets, and safety reports from a powerful back office.",
  },
];

const stats = [
  { label: "Average wait time", value: "3 min" },
  { label: "Driver uptime", value: "99.9%" },
  { label: "Cities ready", value: "12+" },
];

const steps = [
  {
    number: "01",
    title: "Create an account",
    text: "Register as a passenger, driver, or admin with a secure role-based flow.",
  },
  {
    number: "02",
    title: "Connect to live rides",
    text: "Book rides, accept requests, and receive status updates instantly.",
  },
  {
    number: "03",
    title: "Manage everything",
    text: "Control operations across dashboards, wallet, notifications, support, and more.",
  },
];

export default function HomePage() {
  return (
    <main className="oride-shell oride-grid-bg">
      <section className="border-b border-white/10">
        <div className="oride-container flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500 font-black text-slate-950 shadow-lg shadow-green-500/25">
              O
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">ORIDE</p>
              <p className="text-xs text-slate-400">Ride smarter, move faster</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="oride-btn-primary rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="oride-container grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="oride-badge mb-6 w-fit">
              <span className="oride-dot" />
              Real-time ride platform
            </div>

            <h1 className="oride-section-title max-w-4xl">
              Build, scale, and manage your{" "}
              <span className="oride-text-gradient">next-generation ride app</span>.
            </h1>

            <p className="oride-section-subtitle mt-6 max-w-2xl">
              ORIDE is a modern ride-hailing platform designed for passengers, drivers. It combines fast booking, role-based dashboards, wallet,
              support, and real-time trip events into one clean product experience.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="oride-btn-primary rounded-2xl px-6 py-4 text-center font-bold"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="oride-btn-secondary rounded-2xl px-6 py-4 text-center font-bold"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="oride-glass rounded-2xl px-5 py-4"
                >
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="oride-glass w-full rounded-[2rem] p-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Live dispatch overview</p>
                    <h2 className="mt-1 text-xl font-black text-white">
                      Operational command panel
                    </h2>
                  </div>
                  <div className="rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                    Active
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Passenger trip</p>
                      <span className="text-xs text-green-300">Matched</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Challenge, Ibadan → UI Gate
                    </p>
                    <div className="mt-4 h-2 rounded-full bg-slate-800">
                      <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-green-400 to-sky-400" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Online drivers</p>
                      <p className="mt-2 text-3xl font-black text-white">128</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Completed today</p>
                      <p className="mt-2 text-3xl font-black text-white">1,482</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        "Auth",
                        "Wallet",
                        "Rides",
                        "Drivers",
                        "Notifications",
                        "Admin",
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-6">
        <div className="oride-container">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="oride-card p-6">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-green-500/15 text-green-300" />
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="oride-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-300">
              How it works
            </p>
            <h2 className="oride-section-title mt-3 max-w-xl">
              A clean workflow from onboarding to active trips.
            </h2>
          </div>

          <div className="grid gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="oride-glass flex gap-4 rounded-3xl p-5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-white">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="oride-container">
          <div className="oride-glass rounded-[2rem] px-6 py-10 text-center lg:px-12">
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="oride-btn-primary rounded-2xl px-6 py-4 font-bold"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="oride-btn-secondary rounded-2xl px-6 py-4 font-bold"
              >
                Open Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}