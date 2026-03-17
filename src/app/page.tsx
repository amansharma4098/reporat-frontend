"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import StatCard from "@/components/ui/StatCard";
import ScanList from "@/components/dashboard/ScanList";
import { api } from "@/lib/api";
import type { ScanSummary } from "@/types";
import { Bug, TestTube2, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

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

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of all your repository scans</p>
        </div>
        <Link href="/scan" className="btn-primary flex items-center gap-2">
          <ScanSearch size={16} />
          New Scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Scans" value={scans.length} icon={ScanSearch} sub={`${completedScans} completed`} />
        <StatCard label="Issues Found" value={totalIssues} icon={Bug} accent />
        <StatCard label="Tests Generated" value={totalTests} icon={TestTube2} />
        <StatCard label="Bugs Filed" value={totalBugs} icon={ShieldCheck} />
      </div>

      {/* Glow line */}
      <div className="glow-line mb-8" />

      {/* Recent Scans */}
      <div className="mb-4">
        <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">Recent Scans</h2>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin text-accent text-2xl mb-3">&#x25E0;</div>
          <p className="text-zinc-500 text-sm font-mono">Loading scans...</p>
        </div>
      ) : (
        <ScanList scans={scans.slice(0, 10)} />
      )}
    </Shell>
  );
}
