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
    <aside className="w-full rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 lg:w-72">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500 text-lg font-black text-slate-950">
            O
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">ORIDE</h2>
            <p className="text-sm text-slate-400">Admin Panel</p>
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
                  ? "bg-green-500 text-slate-950"
                  : "bg-slate-950/60 text-slate-200 hover:bg-slate-800"
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