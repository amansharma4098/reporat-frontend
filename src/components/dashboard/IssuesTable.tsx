"use client";

import { useState } from "react";
import type { Issue } from "@/types";
import SeverityBadge from "@/components/ui/SeverityBadge";
import { FileCode, AlertTriangle, X } from "lucide-react";

export default function IssuesTable({ issues }: { issues: Issue[] }) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  if (!issues?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <AlertTriangle size={24} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">No issues found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                Severity
              </th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                Source
              </th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                File
              </th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                Title
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, idx) => (
              <tr
                key={issue.id}
                onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer text-sm ${
                  selectedIssue?.id === issue.id ? "bg-violet-50/50" : idx % 2 === 1 ? "bg-slate-50/30" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <SeverityBadge severity={issue.severity} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500">
                    {issue.source?.replace("_", " ") ?? "unknown"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <FileCode size={12} className="text-slate-400" />
                    <span className="text-xs font-mono text-slate-600 truncate max-w-[200px]">
                      {issue.file_path}
                    </span>
                    {issue.line_number && (
                      <span className="text-[10px] font-mono text-slate-400">
                        :{issue.line_number}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 truncate block max-w-[300px]">
                    {issue.title}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Issue detail panel */}
      {selectedIssue && (
        <div className="mt-4 border-l-4 border-violet-500 bg-violet-50/30 rounded-lg p-5 animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{selectedIssue.title}</h3>
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-xs text-slate-500 block mb-1">Severity</span>
              <SeverityBadge severity={selectedIssue.severity} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Source</span>
              <span className="text-sm text-slate-700">
                {selectedIssue.source?.replace("_", " ") ?? "unknown"}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">File</span>
              <span className="text-sm font-mono text-slate-700">
                {selectedIssue.file_path}
                {selectedIssue.line_number ? `:${selectedIssue.line_number}` : ""}
              </span>
            </div>
          </div>

          {selectedIssue.description && (
            <div className="mb-4">
              <span className="text-xs text-slate-500 block mb-1">Description</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {selectedIssue.description}
              </p>
            </div>
          )}

          {selectedIssue.raw_output && (
            <details className="mt-4">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 transition-colors font-medium">
                Raw Output
              </summary>
              <pre className="mt-2 bg-slate-900 text-slate-300 rounded-lg p-4 text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono">
                {selectedIssue.raw_output}
              </pre>
            </details>
          )}
        </div>
      )}
    </>
  );
}
