"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import StatCard from "@/components/ui/StatCard";
import ScanList from "@/components/dashboard/ScanList";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ScanSummary } from "@/types";
import { Bug, TestTube2, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, tenant } = useAuth();
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

  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tenant ? `${tenant.name} — ` : ""}Overview of all your repository scans
          </p>
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

      {/* Recent Scans */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Scans</h2>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading scans...</p>
        </div>
      ) : (
        <ScanList scans={scans.slice(0, 10)} />
      )}
    </Shell>
  );
}
