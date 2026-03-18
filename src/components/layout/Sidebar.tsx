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
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-tight">
              RepoRat
            </h1>
            {tenant && (
              <p className="text-xs text-slate-400 truncate max-w-[140px] leading-tight">
                {tenant.name}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-700/50 px-4 py-4">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
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
