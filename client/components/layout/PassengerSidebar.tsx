"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

const navItems = [
  { href: "/passenger/dashboard", label: "Dashboard" },
  { href: "/passenger/book-ride", label: "Book Ride" },
  { href: "/passenger/rides", label: "My Rides" },
  { href: "/passenger/wallet", label: "Wallet" },
  { href: "/passenger/notifications", label: "Notifications" },
  { href: "/passenger/support", label: "Support" },
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
    <aside className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-6 border-b border-white/10 pb-5">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500 font-black text-slate-950">
            O
          </div>
          <div>
            <p className="text-lg font-black text-white">ORIDE</p>
            <p className="text-xs text-slate-400">Passenger Panel</p>
          </div>
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-green-300">
          Signed in as
        </p>
        <h3 className="mt-2 text-lg font-bold text-white">
          {user?.name || "Passenger"}
        </h3>
        <p className="mt-1 text-sm text-slate-400">{user?.email || "No email"}</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                  : "bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-2xl border border-white/10 bg-red-500/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/20"
      >
        Logout
      </button>
    </aside>
  );
}