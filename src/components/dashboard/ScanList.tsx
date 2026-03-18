"use client";

import Link from "next/link";
import type { ScanSummary } from "@/types";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { repoName, timeAgo } from "@/lib/utils";
import { ExternalLink, Bug, TestTube2, FileWarning, ScanSearch, Trash2 } from "lucide-react";

interface ScanListProps {
  scans: ScanSummary[];
  onDeleteScan?: (scanId: string) => void;
}

export default function ScanList({ scans, onDeleteScan }: ScanListProps) {
  if (!scans.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Bug size={28} className="text-slate-300" />
        </div>
        <p className="text-slate-500 font-semibold">No scans yet</p>
        <p className="text-slate-400 text-sm mt-1 mb-4">Start your first scan to see results here</p>
        <Link href="/scan" className="btn-primary inline-flex items-center gap-2">
          <ScanSearch size={16} />
          Start scanning
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scans.map((scan) => (
        <Link
          key={scan.scan_id}
          href={`/scans/${scan.scan_id}`}
          className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm hover:border-violet-300 hover:shadow-md transition-all duration-200 cursor-pointer group block"
        >
          <div className="flex items-center gap-4">
            <StatusIndicator status={scan.status} />
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                {repoName(scan.repo_url)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {timeAgo(scan.started_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <FileWarning size={12} />
              <span className="font-medium">{scan.total_issues}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <TestTube2 size={12} />
              <span className="text-emerald-600 font-medium">{scan.tests_passed}</span>
              <span className="text-slate-300">/</span>
              <span className="text-red-500 font-medium">{scan.tests_failed}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Bug size={12} />
              <span className="font-medium">{scan.bugs_filed}</span>
            </div>
            {onDeleteScan && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteScan(scan.scan_id);
                }}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete scan"
              >
                <Trash2 size={14} />
              </button>
            )}
            <ExternalLink size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
