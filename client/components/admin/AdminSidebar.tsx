"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/rides", label: "Rides" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-[2rem] border border-green-100 bg-white p-5 shadow-sm">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-600 text-lg font-black text-white">
            O
          </div>
          <div>
            <h2 className="text-2xl font-black text-green-700">ORIDE</h2>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-2xl px-4 py-3 font-semibold transition ${
                active
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-gray-700 hover:bg-green-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}