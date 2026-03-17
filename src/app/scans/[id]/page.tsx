"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Shell from "@/components/layout/Shell";
import StatCard from "@/components/ui/StatCard";
import StatusIndicator from "@/components/ui/StatusIndicator";
import IssuesTable from "@/components/dashboard/IssuesTable";
import { api } from "@/lib/api";
import { repoName, formatDate } from "@/lib/utils";
import type { ScanDetail, ConnectorSchema } from "@/types";
import {
  Bug,
  TestTube2,
  FileWarning,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
} from "lucide-react";

const trackerLogos: Record<string, { label: string; color: string; icon: string }> = {
  jira: { label: "Jira", color: "#2684FF", icon: "J" },
  azure_boards: { label: "Azure Boards", color: "#0078D4", icon: "A" },
  github_issues: { label: "GitHub Issues", color: "#238636", icon: "G" },
  linear: { label: "Linear", color: "#5E6AD2", icon: "L" },
};

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"issues" | "tests" | "bugs">("issues");

  // File bugs modal state
  const [showFileBugs, setShowFileBugs] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<ConnectorSchema[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [useSaved, setUseSaved] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [filing, setFiling] = useState(false);
  const [filingProgress, setFilingProgress] = useState(0);
  const [filedResults, setFiledResults] = useState<{ issue_id: string; tracker: string; url: string }[]>([]);
  const [filingError, setFilingError] = useState("");

  useEffect(() => {
    if (!scanId) return;
    const fetchScan = () => {
      api.getScan(scanId).then(setScan).catch(() => {});
    };
    fetchScan();
    setLoading(false);
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

  // Select all issues by default when scan loads
  useEffect(() => {
    if (scan?.issues) {
      setSelectedIssues(new Set(scan.issues.map((i) => i.id)));
    }
  }, [scan?.issues]);

  const openFileBugs = useCallback(async () => {
    setShowFileBugs(true);
    setSelectedTracker(null);
    setCredentials({});
    setUseSaved(false);
    setFiledResults([]);
    setFilingError("");
    try {
      const res = await api.getConnectorSchema();
      setSchemas(res.schemas);
    } catch {
      setSchemas([]);
    }
  }, []);

  const handleFileBugs = async () => {
    if (!selectedTracker || selectedIssues.size === 0) return;
    setFiling(true);
    setFilingError("");
    setFilingProgress(0);

    try {
      const issueIds = Array.from(selectedIssues);
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFilingProgress((prev) => Math.min(prev + 1, issueIds.length - 1));
      }, 500);

      let result;
      if (useSaved) {
        result = await api.fileBugsSaved(scanId, selectedTracker, issueIds);
      } else {
        result = await api.fileBugs(scanId, selectedTracker, credentials, issueIds);
      }

      clearInterval(progressInterval);
      setFilingProgress(issueIds.length);
      setFiledResults(result.filed);
      if (result.errors?.length) {
        setFilingError(result.errors.join(", "));
      }
    } catch (err: any) {
      setFilingError(err.message || "Failed to file bugs");
    } finally {
      setFiling(false);
    }
  };

  const toggleIssue = (id: string) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentSchema = schemas.find((s) => s.type === selectedTracker);

  if (loading || !scan) {
    return (
      <Shell>
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading scan...</p>
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
            <span className="text-xs font-mono text-slate-400">{scanId.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {repoName(s.repo_url)}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            <Clock size={10} className="inline mr-1" />
            Started {formatDate(s.started_at)}
            {s.completed_at && ` — Completed ${formatDate(s.completed_at)}`}
          </p>
        </div>

        {scan.status === "completed" && scan.issues.length > 0 && (
          <button onClick={openFileBugs} className="btn-primary flex items-center gap-2">
            <Bug size={16} />
            File Bugs
          </button>
        )}
      </div>

      {scan.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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

      <div className="border-t border-slate-200 mb-6" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(["issues", "tests", "bugs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "text-slate-400 hover:text-slate-600 border border-transparent"
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
            <div className="card p-8 text-center text-slate-400 text-sm">No test results</div>
          ) : (
            scan.test_results.map((t, i) => (
              <div key={i} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {t.passed ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className="text-sm font-mono text-slate-700">{t.test_file}</span>
                </div>
                {t.error && (
                  <span className="text-xs font-mono text-red-500 truncate max-w-[300px]">
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
            <div className="card p-8 text-center text-slate-400 text-sm">No bugs filed yet</div>
          ) : (
            scan.bugs_filed.map((b, i) => (
              <div key={i} className="card-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bug size={14} className="text-emerald-500" />
                  <span className="text-sm font-mono text-slate-700">{b.tracker}</span>
                </div>
                {b.url && (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    View <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* File Bugs Modal */}
      {showFileBugs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-display font-bold text-slate-900">File Bugs</h2>
              <button
                onClick={() => setShowFileBugs(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Filed results */}
              {filedResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">
                      Successfully filed {filedResults.length} bug{filedResults.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filedResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="text-sm text-slate-700">{r.tracker} — {r.issue_id}</span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            Open <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {filingError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                      {filingError}
                    </div>
                  )}
                  <button
                    onClick={() => setShowFileBugs(false)}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Tracker selection */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Select bug tracker</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(trackerLogos).map(([type, meta]) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTracker(type);
                            setCredentials({});
                          }}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedTracker === type
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.icon}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{meta.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Credentials */}
                  {selectedTracker && currentSchema && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-700">Credentials</h3>
                        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSaved}
                            onChange={(e) => setUseSaved(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          Use saved credentials
                        </label>
                      </div>
                      {!useSaved && (
                        <div className="space-y-3">
                          {currentSchema.fields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                {field.label}
                              </label>
                              <input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={credentials[field.key] || ""}
                                onChange={(e) =>
                                  setCredentials((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="input-field w-full text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Issue selection */}
                  {selectedTracker && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-700">
                          Issues to file ({selectedIssues.size} of {scan.issues.length})
                        </h3>
                        <button
                          onClick={() => {
                            if (selectedIssues.size === scan.issues.length) {
                              setSelectedIssues(new Set());
                            } else {
                              setSelectedIssues(new Set(scan.issues.map((i) => i.id)));
                            }
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          {selectedIssues.size === scan.issues.length ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2">
                        {scan.issues.map((issue) => (
                          <label
                            key={issue.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIssues.has(issue.id)}
                              onChange={() => toggleIssue(issue.id)}
                              className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className={`badge-${issue.severity} text-[10px]`}>{issue.severity}</span>
                            <span className="text-sm text-slate-700 truncate">{issue.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filing progress */}
                  {filing && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Loader2 size={16} className="text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-700">
                        Filing bug {filingProgress + 1} of {selectedIssues.size}...
                      </span>
                    </div>
                  )}

                  {filingError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                      {filingError}
                    </div>
                  )}

                  {/* Submit */}
                  {selectedTracker && (
                    <button
                      onClick={handleFileBugs}
                      disabled={filing || selectedIssues.size === 0}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {filing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Bug size={16} />
                      )}
                      {filing ? "Filing..." : `File ${selectedIssues.size} Bug${selectedIssues.size !== 1 ? "s" : ""}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
