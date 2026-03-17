import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
  sub?: string;
}

export default function StatCard({ label, value, icon: Icon, accent, sub }: StatCardProps) {
  return (
    <div className={cn("card p-5 group", accent && "border-accent/20 bg-accent/[0.03]")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
          <p className={cn("text-2xl font-display font-bold", accent ? "text-accent" : "text-zinc-100")}>
            {value}
          </p>
          {sub && <p className="text-xs text-zinc-600 mt-1 font-mono">{sub}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", accent ? "bg-accent/10" : "bg-surface-3")}>
          <Icon size={20} className={accent ? "text-accent" : "text-zinc-500"} />
        </div>
      </div>
    </div>
  );
}
