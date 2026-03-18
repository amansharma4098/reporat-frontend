"use client";

import { useState } from "react";
import type { Issue } from "@/types";
import SeverityBadge from "@/components/ui/SeverityBadge";
import { X } from "lucide-react";

const sourceDot: Record<string, string> = {
  static_analysis: "bg-zinc-400",
  performance: "bg-amber-400",
  database: "bg-blue-400",
  ai_test: "bg-red-400",
  test_failure: "bg-red-400",
};

export default function IssuesTable({ issues }: { issues: Issue[] }) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  if (!issues?.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-13 text-zinc-400">No issues found</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-[80px_80px_1fr_1.5fr] gap-4 px-3 py-2 border-b border-zinc-200">
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Severity</span>
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Source</span>
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">File</span>
        <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Title</span>
      </div>
      {/* Rows */}
      {issues.map((issue) => (
        <button
          key={issue.id}
          onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
          className={`grid grid-cols-[80px_80px_1fr_1.5fr] gap-4 items-center px-3 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors duration-100 w-full text-left ${
            selectedIssue?.id === issue.id ? "bg-zinc-50" : ""
          }`}
        >
          <div>
            <SeverityBadge severity={issue.severity} />
          </div>
          <span className="text-11 text-zinc-400 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sourceDot[issue.source] ?? "bg-zinc-300"}`} />
            {issue.source?.replace("_", " ") ?? "unknown"}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-12 font-mono text-zinc-500 truncate">
              {issue.file_path}
            </span>
            {issue.line_number && (
              <span className="text-11 font-mono text-zinc-300">
                :{issue.line_number}
              </span>
            )}
          </div>
          <span className="text-13 text-zinc-700 truncate">
            {issue.title}
          </span>
        </button>
      ))}

      {/* Detail panel */}
      {selectedIssue && (
        <div className="mt-3 border-l-2 border-zinc-900 bg-zinc-50 rounded-r-md p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-13 font-semibold text-zinc-900">{selectedIssue.title}</h3>
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-11 text-zinc-400 block mb-1">Severity</span>
              <SeverityBadge severity={selectedIssue.severity} />
            </div>
            <div>
              <span className="text-11 text-zinc-400 block mb-1">Source</span>
              <span className="text-12 text-zinc-600">
                {selectedIssue.source?.replace("_", " ") ?? "unknown"}
              </span>
            </div>
            <div>
              <span className="text-11 text-zinc-400 block mb-1">File</span>
              <span className="text-12 font-mono text-zinc-600">
                {selectedIssue.file_path}
                {selectedIssue.line_number ? `:${selectedIssue.line_number}` : ""}
              </span>
            </div>
          </div>

          {selectedIssue.description && (
            <div className="mb-4">
              <span className="text-11 text-zinc-400 block mb-1">Description</span>
              <p className="text-12 text-zinc-600 whitespace-pre-wrap leading-relaxed">
                {selectedIssue.description}
              </p>
            </div>
          )}

          {selectedIssue.raw_output && (
            <details className="mt-4">
              <summary className="text-11 text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors font-medium">
                Raw Output
              </summary>
              <pre className="mt-2 bg-zinc-950 text-zinc-400 rounded-md p-4 text-11 overflow-x-auto max-h-64 overflow-y-auto font-mono">
                {selectedIssue.raw_output}
              </pre>
            </details>
          )}
        </div>
      )}
    </>
  );
}
