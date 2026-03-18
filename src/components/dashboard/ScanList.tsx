"use client";

import Link from "next/link";
import type { ScanSummary } from "@/types";
import { repoName, timeAgo } from "@/lib/utils";
import { Trash2, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const dotColor: Record<string, string> = {
  pending: "bg-zinc-300",
  cloning: "bg-blue-500 animate-pulse",
  analyzing: "bg-blue-500 animate-pulse",
  generating_tests: "bg-blue-500 animate-pulse",
  running_tests: "bg-blue-500 animate-pulse",
  filing_bugs: "bg-blue-500 animate-pulse",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

interface ScanListProps {
  scans: ScanSummary[];
  onDeleteScan?: (scanId: string) => void;
}

export default function ScanList({ scans, onDeleteScan }: ScanListProps) {
  if (!scans.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-13 font-medium text-zinc-400">No scans yet</p>
        <p className="text-12 text-zinc-400 mt-1 mb-4">Start your first scan to see results here</p>
        <Link href="/scan" className="btn-primary inline-flex items-center gap-1.5">
          <ScanSearch size={14} strokeWidth={1.5} />
          Start scanning
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_200px_40px] gap-4 px-3 py-2 border-b border-zinc-200">
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Repository</span>
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Status</span>
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Stats</span>
        <span />
      </div>
      {/* Rows */}
      {scans.map((scan) => (
        <Link
          key={scan.scan_id}
          href={`/scans/${scan.scan_id}`}
          className="grid grid-cols-[1fr_100px_200px_40px] gap-4 items-center px-3 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors duration-100 group"
        >
          <div>
            <p className="text-13 font-medium text-zinc-900">{repoName(scan.repo_url)}</p>
            <p className="text-12 text-zinc-400">{timeAgo(scan.started_at)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", dotColor[scan.status] || "bg-zinc-300")} />
            <span className="text-12 text-zinc-500 capitalize">{scan.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-11 bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">{scan.total_issues} issues</span>
            <span className="text-11 bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">{scan.tests_generated} tests</span>
            {scan.bugs_filed > 0 && (
              <span className="text-11 bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">{scan.bugs_filed} bugs</span>
            )}
          </div>
          <div className="flex justify-end">
            {onDeleteScan && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteScan(scan.scan_id);
                }}
                className="p-1 text-zinc-300 hover:text-zinc-500 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                title="Delete scan"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
