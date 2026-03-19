"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/drivers", label: "Drivers", icon: "◌" },
  { href: "/admin/rides", label: "Rides", icon: "⇄" },
  { href: "/admin/support", label: "Support", icon: "⌕" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full">
      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl text-sm ${
                  active
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                {link.icon}
              </span>

              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          System
        </p>
        <p className="mt-3 text-sm font-semibold text-white">
          Admin Control Panel
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Monitor rides, users, drivers and support activity in one place.
        </p>
      </div>
    </aside>
  );
}