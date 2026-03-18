"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/layout/Shell";
import StatCard from "@/components/ui/StatCard";
import StatusIndicator from "@/components/ui/StatusIndicator";
import IssuesTable from "@/components/dashboard/IssuesTable";
import { api } from "@/lib/api";
import { repoName, formatDate } from "@/lib/utils";
import type { ScanDetail } from "@/types";
import {
  ExternalLink,
  X,
  Trash2,
  Download,
} from "lucide-react";

const trackerLogos: Record<string, { label: string; icon: string }> = {
  jira: { label: "Jira", icon: "J" },
  azure_boards: { label: "Azure Boards", icon: "A" },
  github_issues: { label: "GitHub Issues", icon: "G" },
  linear: { label: "Linear", icon: "L" },
};

const TRACKER_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string }[]> = {
  jira: [
    { key: "url", label: "Jira URL", type: "text", placeholder: "https://your-domain.atlassian.net" },
    { key: "email", label: "Email", type: "text", placeholder: "you@example.com" },
    { key: "api_token", label: "API Token", type: "password", placeholder: "Your Jira API token" },
    { key: "project_key", label: "Project Key", type: "text", placeholder: "PROJ" },
  ],
  azure_boards: [
    { key: "org", label: "Organization", type: "text", placeholder: "your-org" },
    { key: "project", label: "Project", type: "text", placeholder: "your-project" },
    { key: "pat", label: "Personal Access Token", type: "password", placeholder: "Your Azure PAT" },
  ],
  github_issues: [
    { key: "pat", label: "Personal Access Token", type: "password", placeholder: "ghp_xxxx" },
    { key: "repo", label: "Repository", type: "text", placeholder: "owner/repo" },
  ],
  linear: [
    { key: "api_key", label: "API Key", type: "password", placeholder: "lin_api_xxxx" },
    { key: "team_id", label: "Team ID", type: "text", placeholder: "Team ID" },
  ],
};

// Severity dot color for diff view
const sevDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-400",
  info: "bg-zinc-300",
};

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "tests" | "bugs" | "diff">("issues");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Diff state
  const [diff, setDiff] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState("");

  // File bugs modal state
  const [showFileBugs, setShowFileBugs] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [useSaved, setUseSaved] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [filing, setFiling] = useState(false);
  const [filingProgress, setFilingProgress] = useState(0);
  const [filedResults, setFiledResults] = useState<{ issue_id: string; tracker: string; url: string }[]>([]);
  const [filingError, setFilingError] = useState("");

  useEffect(() => {
    if (!scanId) return;
    const fetchScan = async () => {
      try {
        const data = await api.getScan(scanId);
        setScan(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load scan details");
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
    const interval = setInterval(() => {
      api
        .getScan(scanId)
        .then((data) => {
          setScan(data);
          setError(null);
          const status = data?.status ?? "pending";
          if (status === "completed" || status === "failed") {
            clearInterval(interval);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [scanId]);

  // Fetch diff when switching to diff tab
  useEffect(() => {
    if (activeTab !== "diff" || diff || diffLoading) return;
    setDiffLoading(true);
    api.getScanDiff(scanId)
      .then((res) => setDiff(res))
      .catch((err: any) => setDiffError(err?.message || "Failed to load diff"))
      .finally(() => setDiffLoading(false));
  }, [activeTab, scanId, diff, diffLoading]);

  useEffect(() => {
    const issues = scan?.issues ?? [];
    if (issues.length > 0) {
      setSelectedIssues(new Set(issues.map((i) => i.id)));
    }
  }, [scan?.issues]);

  const openFileBugs = useCallback(() => {
    setShowFileBugs(true);
    setSelectedTracker(null);
    setCredentials({});
    setUseSaved(false);
    setFiledResults([]);
    setFilingError("");
  }, []);

  const handleFileBugs = async () => {
    if (!selectedTracker || selectedIssues.size === 0) return;
    setFiling(true);
    setFilingError("");
    setFilingProgress(0);

    try {
      const issueIds = Array.from(selectedIssues);
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
      setFiledResults(result?.filed ?? []);
      if (result?.errors?.length) {
        setFilingError(result.errors.join(", "));
      }
    } catch (err: any) {
      setFilingError(err?.message || "Failed to file bugs");
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

  const [deleting, setDeleting] = useState(false);

  const handleDeleteScan = async () => {
    if (!window.confirm("Are you sure you want to delete this scan?")) return;
    setDeleting(true);
    try {
      await api.deleteScan(scanId);
      router.push("/scans");
    } catch (err: any) {
      setError(err?.message || "Failed to delete scan");
      setDeleting(false);
    }
  };

  const handleExportPdf = () => {
    window.open(api.getScanReport(scanId), "_blank");
  };

  const trackerFields = selectedTracker ? (TRACKER_FIELDS[selectedTracker] ?? []) : [];

  if (error && !scan) {
    return (
      <Shell>
        <div className="py-12 text-center">
          <p className="text-13 font-medium text-red-600 mb-1">Failed to load scan</p>
          <p className="text-12 text-zinc-400">{error}</p>
        </div>
      </Shell>
    );
  }

  if (loading || !scan) {
    return (
      <Shell>
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-12 text-zinc-400">Loading scan...</p>
        </div>
      </Shell>
    );
  }

  const s = scan.summary ?? ({} as Record<string, any>);
  const status = scan.status ?? "pending";
  const issues = scan.issues ?? [];
  const testResults = scan.test_results ?? [];
  const bugsFiled = scan.bugs_filed ?? [];
  const bySeverity = s.by_severity ?? {};

  const tabs = [
    { key: "issues" as const, label: "Issues" },
    { key: "tests" as const, label: "Tests" },
    { key: "bugs" as const, label: "Bugs" },
    { key: "diff" as const, label: "Diff" },
  ];

  const newIssues = diff?.new_issues ?? [];
  const fixedIssues = diff?.fixed_issues ?? [];

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <StatusIndicator status={status} />
            <span className="text-11 font-mono text-zinc-400">{scanId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-22 font-semibold text-zinc-900">
            {repoName(s.repo_url ?? "")}
          </h1>
          <p className="text-12 text-zinc-400 mt-1">
            {s.started_at ? `Started ${formatDate(s.started_at)}` : "Not started"}
            {s.completed_at && ` — Completed ${formatDate(s.completed_at)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteScan}
            disabled={deleting}
            className="btn-danger flex items-center gap-1.5"
          >
            {deleting ? (
              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={13} strokeWidth={1.5} />
            )}
            Delete
          </button>
          {status === "completed" && (
            <button
              onClick={handleExportPdf}
              className="btn-secondary flex items-center gap-1.5"
            >
              <Download size={13} strokeWidth={1.5} />
              Export PDF
            </button>
          )}
          {status === "completed" && issues.length > 0 && (
            <button onClick={openFileBugs} className="btn-primary">
              File Bugs
            </button>
          )}
        </div>
      </div>

      {scan.error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
          {scan.error}
        </div>
      )}

      {error && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 text-12 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Issues" value={s.total_issues ?? 0} />
        <StatCard label="Tests Generated" value={s.tests_generated ?? 0} />
        <StatCard label="Tests Passed" value={s.tests_passed ?? 0} sub={`${s.tests_failed ?? 0} failed`} />
        <StatCard label="Bugs Filed" value={s.bugs_filed ?? 0} />
      </div>

      {/* Severity breakdown */}
      {bySeverity && Object.keys(bySeverity).length > 0 && (
        <div className="flex gap-2 mb-6">
          {Object.entries(bySeverity)
            .filter(([_, count]) => (count as number) > 0)
            .map(([sev, count]) => (
              <span key={sev} className={`badge-${sev} inline-flex items-center gap-1`}>
                <span className="font-semibold">{count as number}</span>
                <span>{sev}</span>
              </span>
            ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b border-zinc-200 mb-5">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-12 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source filters */}
      {activeTab === "issues" && issues.length > 0 && (() => {
        const sourceCounts: Record<string, number> = {};
        issues.forEach((issue) => {
          const src = issue.source ?? "unknown";
          sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
        });
        const sourceFilters = [
          { key: "all", label: "All", count: issues.length },
          { key: "static_analysis", label: "Static Analysis", count: sourceCounts["static_analysis"] ?? 0 },
          { key: "performance", label: "Performance", count: sourceCounts["performance"] ?? 0 },
          { key: "database", label: "Database", count: sourceCounts["database"] ?? 0 },
          { key: "ai_test", label: "Test Failures", count: (sourceCounts["ai_test"] ?? 0) + (sourceCounts["test_failure"] ?? 0) },
        ].filter((f) => f.key === "all" || f.count > 0);
        return (
          <div className="flex gap-0 mb-4 border-b border-zinc-100">
            {sourceFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                className={`px-3 py-2 text-12 font-medium transition-colors border-b-2 -mb-px ${
                  sourceFilter === f.key
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        );
      })()}

      {/* Tab Content */}
      {activeTab === "issues" && (
        <IssuesTable
          issues={
            sourceFilter === "all"
              ? issues
              : sourceFilter === "ai_test"
                ? issues.filter((i) => i.source === "ai_test" || i.source === "test_failure")
                : issues.filter((i) => i.source === sourceFilter)
          }
        />
      )}

      {activeTab === "tests" && (
        <div className="space-y-1">
          {testResults.length === 0 ? (
            <p className="py-8 text-center text-12 text-zinc-400">No test results</p>
          ) : (
            testResults.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${t.passed ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-12 font-mono text-zinc-600">{t.test_file}</span>
                </div>
                {t.error && (
                  <span className="text-11 font-mono text-red-500 truncate max-w-[300px]">
                    {t.error}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "bugs" && (
        <div className="space-y-1">
          {bugsFiled.length === 0 ? (
            <p className="py-8 text-center text-12 text-zinc-400">No bugs filed yet</p>
          ) : (
            bugsFiled.map((b, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <span className="text-12 font-mono text-zinc-600">{b.tracker}</span>
                {b.url && (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-11 font-medium text-zinc-500 hover:text-zinc-900"
                  >
                    View <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Diff tab */}
      {activeTab === "diff" && (
        <div>
          {diffLoading ? (
            <div className="py-8 text-center">
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-12 text-zinc-400">Loading diff...</p>
            </div>
          ) : diffError ? (
            <p className="py-8 text-center text-12 text-zinc-400">{diffError}</p>
          ) : diff?.first_scan ? (
            <p className="py-8 text-center text-12 text-zinc-400">First scan — nothing to compare</p>
          ) : (
            <div className="space-y-6">
              {/* New issues */}
              <div>
                <h3 className="text-12 font-medium text-zinc-700 mb-2">
                  New issues ({newIssues.length})
                </h3>
                {newIssues.length === 0 ? (
                  <p className="text-12 text-zinc-400 py-3">No new issues</p>
                ) : (
                  <div>
                    {newIssues.map((issue: any, i: number) => (
                      <div key={issue?.id ?? i} className="flex items-center gap-3 px-3 py-2 border-b border-red-100 bg-red-50/40 hover:bg-red-50/70 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sevDot[issue?.severity] ?? "bg-zinc-300"}`} />
                        <span className="text-11 font-mono text-zinc-500 truncate max-w-[180px]">{issue?.file_path}</span>
                        <span className="text-13 text-zinc-700 truncate flex-1">{issue?.title}</span>
                        <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex-shrink-0">NEW</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fixed issues */}
              <div>
                <h3 className="text-12 font-medium text-zinc-700 mb-2">
                  Fixed issues ({fixedIssues.length})
                </h3>
                {fixedIssues.length === 0 ? (
                  <p className="text-12 text-zinc-400 py-3">No fixed issues</p>
                ) : (
                  <div>
                    {fixedIssues.map((issue: any, i: number) => (
                      <div key={issue?.id ?? i} className="flex items-center gap-3 px-3 py-2 border-b border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sevDot[issue?.severity] ?? "bg-zinc-300"}`} />
                        <span className="text-11 font-mono text-zinc-500 truncate max-w-[180px]">{issue?.file_path}</span>
                        <span className="text-13 text-zinc-700 truncate flex-1">{issue?.title}</span>
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded flex-shrink-0">FIXED</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Bugs Modal */}
      {showFileBugs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-xl max-h-[80vh] overflow-y-auto m-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
              <h2 className="text-13 font-semibold text-zinc-900">File Bugs</h2>
              <button
                onClick={() => setShowFileBugs(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Filed results */}
              {filedResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-13 font-medium text-zinc-900">
                      Filed {filedResults.length} bug{filedResults.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {filedResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md">
                        <span className="text-12 text-zinc-600">{r.tracker} — {r.issue_id}</span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-11 font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                          >
                            Open <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {filingError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
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
                    <h3 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-3">Select tracker</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(trackerLogos).map(([type, meta]) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTracker(type);
                            setCredentials({});
                          }}
                          className={`p-3 rounded-md border text-left transition-colors ${
                            selectedTracker === type
                              ? "border-zinc-900 bg-zinc-50"
                              : "border-zinc-200 hover:border-zinc-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white font-semibold text-11">
                              {meta.icon}
                            </div>
                            <span className="text-12 font-medium text-zinc-700">{meta.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Credentials */}
                  {selectedTracker && trackerFields.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Credentials</h3>
                        <label className="flex items-center gap-2 text-11 text-zinc-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSaved}
                            onChange={(e) => setUseSaved(e.target.checked)}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                          />
                          Use saved
                        </label>
                      </div>
                      {!useSaved && (
                        <div className="space-y-3">
                          {trackerFields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-11 font-medium text-zinc-500 mb-1">
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
                                className="input-field w-full"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Issue selection */}
                  {selectedTracker && issues.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-11 font-medium text-zinc-400 uppercase tracking-wide">
                          Issues ({selectedIssues.size}/{issues.length})
                        </h3>
                        <button
                          onClick={() => {
                            if (selectedIssues.size === issues.length) {
                              setSelectedIssues(new Set());
                            } else {
                              setSelectedIssues(new Set(issues.map((i) => i.id)));
                            }
                          }}
                          className="text-11 text-zinc-500 hover:text-zinc-900 font-medium"
                        >
                          {selectedIssues.size === issues.length ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5 border border-zinc-200 rounded-md p-1.5">
                        {issues.map((issue) => (
                          <label
                            key={issue.id}
                            className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIssues.has(issue.id)}
                              onChange={() => toggleIssue(issue.id)}
                              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                            />
                            <span className={`badge-${issue.severity} text-[10px]`}>{issue.severity}</span>
                            <span className="text-12 text-zinc-600 truncate">{issue.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTracker && issues.length === 0 && (
                    <p className="py-6 text-center text-12 text-zinc-400">
                      No issues available to file
                    </p>
                  )}

                  {/* Filing progress */}
                  {filing && (
                    <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                      <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                      <span className="text-12 text-zinc-600">
                        Filing bug {filingProgress + 1} of {selectedIssues.size}...
                      </span>
                    </div>
                  )}

                  {filingError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
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
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
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
