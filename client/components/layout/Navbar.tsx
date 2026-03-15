"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/passenger/dashboard", label: "Dashboard" },
  { href: "/passenger/book-ride", label: "Book Ride" },
  { href: "/passenger/rides", label: "My Rides" },
  { href: "/passenger/wallet", label: "Wallet" },
  { href: "/passenger/notifications", label: "Notifications" },
  { href: "/passenger/support", label: "Support" },
];

export default function PassengerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold">
          O
        </div>

        <div>
          <h2 className="font-bold text-green-700">ORIDE</h2>
          <p className="text-xs text-gray-500">Passenger Panel</p>
        </div>
      </div>

      <nav className="space-y-2">

        {nav.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl font-medium transition ${
                active
                  ? "bg-green-600 text-white"
                  : "bg-white border border-green-100 hover:bg-green-50 text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

      </nav>

      <button className="mt-6 w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-100 transition">
        Logout
      </button>

    </aside>
  );
}