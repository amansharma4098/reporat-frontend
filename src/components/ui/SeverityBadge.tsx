import { cn } from "@/lib/utils";
import type { Severity } from "@/types";

const styles: Record<Severity, string> = {
  critical: "badge-critical",
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
  info: "badge-info",
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={cn(styles[severity])}>{severity}</span>;
}
