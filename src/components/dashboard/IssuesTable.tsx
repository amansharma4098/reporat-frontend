"use client";

import type { Issue } from "@/types";
import SeverityBadge from "@/components/ui/SeverityBadge";
import { FileCode, AlertTriangle } from "lucide-react";

export default function IssuesTable({ issues }: { issues: Issue[] }) {
  if (!issues.length) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle size={24} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-500 text-sm">No issues found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-4 bg-surface-3/50">
            <th className="text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-4 py-3">
              Severity
            </th>
            <th className="text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-4 py-3">
              Source
            </th>
            <th className="text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-4 py-3">
              File
            </th>
            <th className="text-left text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-4 py-3">
              Title
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              key={issue.id}
              className="border-b border-surface-4/50 hover:bg-surface-3/30 transition-colors"
            >
              <td className="px-4 py-3">
                <SeverityBadge severity={issue.severity} />
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-mono text-zinc-500">
                  {issue.source.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <FileCode size={12} className="text-zinc-600" />
                  <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]">
                    {issue.file_path}
                  </span>
                  {issue.line_number && (
                    <span className="text-[10px] font-mono text-zinc-600">
                      :{issue.line_number}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-zinc-300 truncate block max-w-[300px]">
                  {issue.title}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
