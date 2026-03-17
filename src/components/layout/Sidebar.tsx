"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  ScanSearch,
  LayoutDashboard,
  Plug,
  Bug,
  Users,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: ScanSearch },
  { href: "/scans", label: "Scan History", icon: Bug },
  { href: "/connectors", label: "Connectors", icon: Plug },
  { href: "/team", label: "Team", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <span className="text-emerald-600 font-mono font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-900 tracking-tight">
              Repo<span className="text-emerald-500">Rat</span>
            </h1>
            {tenant && (
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wide truncate max-w-[140px]">
                {tenant.name}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-l-2 border-transparent"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="font-body">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-200">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
