import { cn } from "@/lib/utils";
import { statusLabels } from "@/lib/utils";
import type { ScanStatus } from "@/types";

const dotColor: Record<string, string> = {
  pending: "bg-zinc-300",
  cloning: "bg-blue-500 animate-pulse",
  analyzing: "bg-blue-500 animate-pulse",
  generating_tests: "bg-blue-500 animate-pulse",
  running_tests: "bg-blue-500 animate-pulse",
  filing_bugs: "bg-blue-500 animate-pulse",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

export default function StatusIndicator({ status }: { status: ScanStatus }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", dotColor[status] || "bg-zinc-300")} />
      <span className="text-12 text-zinc-500">{statusLabels[status] || status}</span>
    </div>
  );
}
