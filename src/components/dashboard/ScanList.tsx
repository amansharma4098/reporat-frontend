"use client";

import Link from "next/link";
import type { ScanSummary } from "@/types";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { repoName, timeAgo } from "@/lib/utils";
import { ExternalLink, Bug, TestTube2, FileWarning } from "lucide-react";

export default function ScanList({ scans }: { scans: ScanSummary[] }) {
  if (!scans.length) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Bug size={28} className="text-slate-400" />
        </div>
        <p className="text-slate-600 font-display">No scans yet</p>
        <p className="text-slate-400 text-sm mt-1">Start your first scan to see results here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scans.map((scan) => (
        <Link
          key={scan.scan_id}
          href={`/scans/${scan.scan_id}`}
          className="card-hover block p-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusIndicator status={scan.status} />
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">
                  {repoName(scan.repo_url)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {timeAgo(scan.started_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <FileWarning size={12} />
                <span>{scan.total_issues}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <TestTube2 size={12} />
                <span className="text-emerald-600">{scan.tests_passed}</span>
                <span className="text-slate-300">/</span>
                <span className="text-red-500">{scan.tests_failed}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Bug size={12} />
                <span>{scan.bugs_filed}</span>
              </div>
              <ExternalLink size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
