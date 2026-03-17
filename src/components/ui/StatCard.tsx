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
    <div className={cn("card p-5 group", accent && "border-emerald-200 bg-emerald-50/50")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className={cn("text-2xl font-display font-bold", accent ? "text-emerald-600" : "text-slate-900")}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", accent ? "bg-emerald-100" : "bg-slate-100")}>
          <Icon size={20} className={accent ? "text-emerald-600" : "text-slate-400"} />
        </div>
      </div>
    </div>
  );
}
