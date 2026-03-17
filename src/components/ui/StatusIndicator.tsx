import { cn } from "@/lib/utils";
import { statusLabels } from "@/lib/utils";
import type { ScanStatus } from "@/types";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

const statusConfig: Record<string, { color: string; icon: typeof Loader2 }> = {
  pending: { color: "text-zinc-500", icon: Clock },
  cloning: { color: "text-blue-400", icon: Loader2 },
  analyzing: { color: "text-yellow-400", icon: Loader2 },
  generating_tests: { color: "text-purple-400", icon: Loader2 },
  running_tests: { color: "text-orange-400", icon: Loader2 },
  filing_bugs: { color: "text-cyan-400", icon: Loader2 },
  completed: { color: "text-accent", icon: CheckCircle2 },
  failed: { color: "text-red-400", icon: XCircle },
};

export default function StatusIndicator({ status }: { status: ScanStatus }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const isSpinning = !["completed", "failed", "pending"].includes(status);

  return (
    <div className={cn("flex items-center gap-2", config.color)}>
      <Icon size={14} className={isSpinning ? "animate-spin" : ""} />
      <span className="text-xs font-mono">{statusLabels[status] || status}</span>
    </div>
  );
}
