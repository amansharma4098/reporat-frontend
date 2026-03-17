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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-3 flex items-center justify-center">
          <Bug size={28} className="text-zinc-600" />
        </div>
        <p className="text-zinc-400 font-display">No scans yet</p>
        <p className="text-zinc-600 text-sm mt-1">Start your first scan to see results here</p>
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
                <p className="text-sm font-mono text-zinc-200 group-hover:text-accent transition-colors">
                  {repoName(scan.repo_url)}
                </p>
                <p className="text-xs text-zinc-600 font-mono mt-0.5">
                  {timeAgo(scan.started_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <FileWarning size={12} />
                <span>{scan.total_issues}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <TestTube2 size={12} />
                <span className="text-accent">{scan.tests_passed}</span>
                <span className="text-zinc-700">/</span>
                <span className="text-red-400">{scan.tests_failed}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Bug size={12} />
                <span>{scan.bugs_filed}</span>
              </div>
              <ExternalLink size={14} className="text-zinc-700 group-hover:text-accent transition-colors" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
