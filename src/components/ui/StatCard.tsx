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
        "bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
        accent && "border-emerald-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={cn("text-3xl font-bold mt-1", accent ? "text-emerald-600" : "text-gray-900")}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            accent ? "bg-emerald-50" : "bg-gray-50"
          )}
        >
          <Icon size={20} className={accent ? "text-emerald-600" : "text-gray-400"} />
        </div>
      </div>
    </div>
  );
}
