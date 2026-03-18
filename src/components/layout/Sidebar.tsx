"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  ScanSearch,
  Bug,
  Zap,
  Plug,
  Settings,
  Users,
  LogOut,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: ScanSearch },
  { href: "/scans", label: "Scan History", icon: Bug },
  { href: "/performance", label: "Performance", icon: Zap },
];

const settingsNav = [
  { href: "/connectors", label: "Connectors", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/team", label: "Team", icon: Users },
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-13 transition-colors duration-100",
        active
          ? "bg-zinc-100 text-zinc-900 font-medium"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
      )}
    >
      <Icon size={16} strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#fafafa] border-r border-zinc-200 flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center">
            <span className="text-white text-11 font-semibold leading-none">R</span>
          </div>
          <span className="text-[15px] font-semibold text-zinc-900 tracking-tight">RepoRat</span>
        </Link>
        {tenant && (
          <p className="text-11 text-zinc-400 mt-1 truncate pl-7">{tenant.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 overflow-y-auto">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest px-2.5 mb-1">Main</p>
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </div>

        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest px-2.5 mt-6 mb-1">Settings</p>
        <div className="space-y-0.5">
          {settingsNav.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-zinc-200 px-3 py-3">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-11 font-medium flex-shrink-0">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-13 font-medium text-zinc-700 truncate">{user.name}</p>
                <p className="text-11 text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors duration-100 flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
