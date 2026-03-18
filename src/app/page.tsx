"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import StatCard from "@/components/ui/StatCard";
import ScanList from "@/components/dashboard/ScanList";
import { api } from "@/lib/api";
import { repoName, timeAgo } from "@/lib/utils";
import type { ScanSummary } from "@/types";
import Link from "next/link";

const eventDot: Record<string, string> = {
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  bug: "bg-zinc-500",
};

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listScans()
      .then((res) => setScans(res.scans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalIssues = scans.reduce((acc, s) => acc + s.total_issues, 0);
  const totalTests = scans.reduce((acc, s) => acc + s.tests_generated, 0);
  const totalBugs = scans.reduce((acc, s) => acc + s.bugs_filed, 0);
  const completedScans = scans.filter((s) => s.status === "completed").length;

  // Build activity feed from scan data
  const activity = scans
    .filter((s) => s.status === "completed" || s.status === "failed")
    .slice(0, 5)
    .map((s) => {
      const name = repoName(s.repo_url);
      if (s.status === "failed") {
        return { type: "failed", text: `Scan failed: ${name}`, time: s.completed_at || s.started_at };
      }
      if (s.bugs_filed > 0) {
        return { type: "bug", text: `${s.bugs_filed} bug${s.bugs_filed !== 1 ? "s" : ""} filed: ${name}`, time: s.completed_at || s.started_at };
      }
      return { type: "completed", text: `Scan completed: ${name} — ${s.total_issues} issues`, time: s.completed_at || s.started_at };
    });

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">Overview</h1>
        <Link href="/scan" className="btn-primary">
          New Scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Scans" value={scans.length} sub={`${completedScans} completed`} />
        <StatCard label="Issues Found" value={totalIssues} />
        <StatCard label="Tests Generated" value={totalTests} />
        <StatCard label="Bugs Filed" value={totalBugs} />
      </div>

      {/* Recent Scans */}
      <div className="mb-3">
        <h2 className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Recent Scans</h2>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-12 text-zinc-400">Loading scans...</p>
        </div>
      ) : (
        <ScanList scans={scans.slice(0, 10)} />
      )}

      {/* Activity feed */}
      {activity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-3">Activity</h2>
          <div className="space-y-0">
            {activity.map((event, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-zinc-100">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${eventDot[event.type] ?? "bg-zinc-300"}`} />
                <span className="text-12 text-zinc-600 flex-1">{event.text}</span>
                <span className="text-11 text-zinc-400 flex-shrink-0">{event.time ? timeAgo(event.time) : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
