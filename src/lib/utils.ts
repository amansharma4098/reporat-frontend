import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function repoName(url: string) {
  try {
    const parts = url.replace(/\.git$/, "").split("/");
    return parts.slice(-2).join("/");
  } catch {
    return url;
  }
}

export const statusLabels: Record<string, string> = {
  pending: "Queued",
  cloning: "Cloning Repo",
  analyzing: "Static Analysis",
  generating_tests: "Generating Tests",
  running_tests: "Running Tests",
  filing_bugs: "Filing Bugs",
  completed: "Completed",
  failed: "Failed",
};

export const severityOrder = ["critical", "high", "medium", "low", "info"];
