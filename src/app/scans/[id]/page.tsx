"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Shell from "@/components/layout/Shell";
import StatCard from "@/components/ui/StatCard";
import StatusIndicator from "@/components/ui/StatusIndicator";
import IssuesTable from "@/components/dashboard/IssuesTable";
import { api } from "@/lib/api";
import { repoName, formatDate } from "@/lib/utils";
import type { ScanDetail } from "@/types";
import {
  Bug,
  TestTube2,
  FileWarning,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"issues" | "tests" | "bugs">("issues");

  useEffect(() => {
    if (!scanId) return;
    const fetchScan = () => {
      api.getScan(scanId).then(setScan).catch(() => {});
    };
    fetchScan();
    setLoading(false);
    // Poll if not complete
    const interval = setInterval(() => {
      api.getScan(scanId).then((data) => {
        setScan(data);
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [scanId]);

  if (loading || !scan) {
    return (
      <Shell>
        <div className="card p-12 text-center">
          <div className="animate-spin text-accent text-2xl mb-3">&#x25E0;</div>
          <p className="text-zinc-500 text-sm font-mono">Loading scan...</p>
        </div>
      </Shell>
    );
  }

  const s = scan.summary;

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StatusIndicator status={scan.status} />
            <span className="text-xs font-mono text-zinc-600">{scanId.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-zinc-100">
            {repoName(s.repo_url)}
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            <Clock size={10} className="inline mr-1" />
            Started {formatDate(s.started_at)}
            {s.completed_at && ` - Completed ${formatDate(s.completed_at)}`}
          </p>
        </div>
      </div>

      {scan.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-mono">
          {scan.error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Issues" value={s.total_issues} icon={FileWarning} accent />
        <StatCard label="Tests Generated" value={s.tests_generated} icon={TestTube2} />
        <StatCard
          label="Tests Passed"
          value={s.tests_passed}
          icon={CheckCircle2}
          sub={`${s.tests_failed} failed`}
        />
        <StatCard label="Bugs Filed" value={s.bugs_filed} icon={Bug} />
      </div>

      {/* Severity breakdown */}
      {s.by_severity && (
        <div className="flex gap-3 mb-8">
          {Object.entries(s.by_severity).map(([sev, count]) =>
            count > 0 ? (
              <div key={sev} className={`badge-${sev} flex items-center gap-1.5`}>
                <span>{count}</span>
                <span>{sev}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="glow-line mb-6" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(["issues", "tests", "bugs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono rounded-lg transition-all ${
              activeTab === tab
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            {tab === "issues" && <FileWarning size={12} className="inline mr-1.5" />}
            {tab === "tests" && <TestTube2 size={12} className="inline mr-1.5" />}
            {tab === "bugs" && <Bug size={12} className="inline mr-1.5" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "issues" && <IssuesTable issues={scan.issues} />}

      {activeTab === "tests" && (
        <div className="space-y-2">
          {scan.test_results.length === 0 ? (
            <div className="card p-8 text-center text-zinc-500 text-sm">No test results</div>
          ) : (
            scan.test_results.map((t, i) => (
              <div key={i} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {t.passed ? (
                    <CheckCircle2 size={16} className="text-accent" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <span className="text-sm font-mono text-zinc-300">{t.test_file}</span>
                </div>
                {t.error && (
                  <span className="text-xs font-mono text-red-400 truncate max-w-[300px]">
                    {t.error}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "bugs" && (
        <div className="space-y-2">
          {scan.bugs_filed.length === 0 ? (
            <div className="card p-8 text-center text-zinc-500 text-sm">No bugs filed</div>
          ) : (
            scan.bugs_filed.map((b, i) => (
              <div key={i} className="card-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bug size={14} className="text-accent" />
                  <span className="text-sm font-mono text-zinc-300">{b.tracker}</span>
                </div>
                {b.url && (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
                  >
                    View <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Shell>
  );
}
