"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

const navItems = [
  { href: "/passenger/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/passenger/book-ride", label: "Book Ride", icon: "📍" },
  { href: "/passenger/rides", label: "My Rides", icon: "🚕" },
  { href: "/passenger/wallet", label: "Wallet", icon: "💰" },
  { href: "/passenger/notifications", label: "Notifications", icon: "🔔" },
  { href: "/passenger/support", label: "Support", icon: "🛟" },
];

export default function PassengerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex h-full flex-col justify-between rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div>
        <div className="mb-6 border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600 font-black text-black shadow-lg">
              O
            </div>

            <div>
              <p className="text-lg font-black text-white">ORIDE</p>
              <p className="text-xs text-slate-400">Passenger Panel</p>
            </div>
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-green-300">
            Signed in as
          </p>

          <h3 className="mt-2 text-lg font-bold text-white">
            {user?.name || "Passenger"}
          </h3>

          <p className="mt-1 truncate text-sm text-slate-400">
            {user?.email || "No email"}
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className={`text-lg transition ${
                    active ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>

                {active && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6">
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-white/10 bg-red-500/10 px-4 py-3 font-semibold text-red-300 transition-all hover:bg-red-500/20 hover:text-red-200"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}