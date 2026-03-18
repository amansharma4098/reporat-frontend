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
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
        accent && "border-violet-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={cn("text-3xl font-bold mt-1", accent ? "text-violet-600" : "text-slate-900")}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            accent ? "bg-violet-50" : "bg-slate-50"
          )}
        >
          <Icon size={20} className={accent ? "text-violet-600" : "text-slate-400"} />
        </div>
      </div>
    </div>
  );
}
