"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ScanSearch,
  LayoutDashboard,
  Plug,
  Settings,
  Bug,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: ScanSearch },
  { href: "/scans", label: "Scan History", icon: Bug },
  { href: "/connectors", label: "Connectors", icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-surface-4 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-surface-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:animate-pulse-glow transition-all">
            <span className="text-accent font-mono font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
              Repo<span className="text-accent">Rat</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-600 -mt-0.5 tracking-widest uppercase">
              AI Scanner
            </p>
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
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-surface-3 border border-transparent"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="font-body">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-4">
        <div className="flex items-center gap-2 text-zinc-600 text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-accent/60 animate-pulse" />
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
