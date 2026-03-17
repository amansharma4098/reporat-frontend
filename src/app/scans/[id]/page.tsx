"use client";

import { useEffect, useState, useCallback } from "react";
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
  X,
  Loader2,
} from "lucide-react";

const trackerLogos: Record<string, { label: string; color: string; icon: string }> = {
  jira: { label: "Jira", color: "#2684FF", icon: "J" },
  azure_boards: { label: "Azure Boards", color: "#0078D4", icon: "A" },
  github_issues: { label: "GitHub Issues", color: "#238636", icon: "G" },
  linear: { label: "Linear", color: "#5E6AD2", icon: "L" },
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

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "tests" | "bugs">("issues");

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

  const trackerFields = selectedTracker ? (TRACKER_FIELDS[selectedTracker] ?? []) : [];

  if (error && !scan) {
    return (
      <Shell>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <XCircle size={24} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 text-sm font-medium mb-1">Failed to load scan</p>
          <p className="text-gray-400 text-xs">{error}</p>
        </div>
      </Shell>
    );
  }

  if (loading || !scan) {
    return (
      <Shell>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading scan...</p>
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
    { key: "issues" as const, label: "Issues", icon: FileWarning },
    { key: "tests" as const, label: "Tests", icon: TestTube2 },
    { key: "bugs" as const, label: "Bugs", icon: Bug },
  ];

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {status === "completed" ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
                <CheckCircle2 size={12} /> Completed
              </span>
            ) : status === "failed" ? (
              <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                <XCircle size={12} /> Failed
              </span>
            ) : (
              <StatusIndicator status={status} />
            )}
            <span className="text-xs font-mono text-gray-400">{scanId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {repoName(s.repo_url ?? "")}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            <Clock size={10} className="inline mr-1" />
            {s.started_at ? `Started ${formatDate(s.started_at)}` : "Not started"}
            {s.completed_at && ` — Completed ${formatDate(s.completed_at)}`}
          </p>
        </div>

        {status === "completed" && issues.length > 0 && (
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

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Issues" value={s.total_issues ?? 0} icon={FileWarning} accent />
        <StatCard label="Tests Generated" value={s.tests_generated ?? 0} icon={TestTube2} />
        <StatCard
          label="Tests Passed"
          value={s.tests_passed ?? 0}
          icon={CheckCircle2}
          sub={`${s.tests_failed ?? 0} failed`}
        />
        <StatCard label="Bugs Filed" value={s.bugs_filed ?? 0} icon={Bug} />
      </div>

      {/* Severity breakdown */}
      {bySeverity && Object.keys(bySeverity).length > 0 && (
        <div className="flex gap-3 mb-8">
          {Object.entries(bySeverity)
            .filter(([_, count]) => (count as number) > 0)
            .map(([sev, count]) => (
              <div key={sev} className={`badge-${sev} inline-flex items-center gap-1.5`}>
                <span className="font-semibold">{count as number}</span>
                <span>{sev}</span>
              </div>
            ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <TabIcon size={12} className="inline mr-1.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "issues" && <IssuesTable issues={issues} />}

      {activeTab === "tests" && (
        <div className="space-y-2">
          {testResults.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">No test results</div>
          ) : (
            testResults.map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {t.passed ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className="text-sm font-mono text-gray-700">{t.test_file}</span>
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
          {bugsFiled.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">No bugs filed yet</div>
          ) : (
            bugsFiled.map((b, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <Bug size={14} className="text-emerald-600" />
                  <span className="text-sm font-mono text-gray-700">{b.tracker}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm modal-overlay">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 modal-card">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">File Bugs</h2>
              <button
                onClick={() => setShowFileBugs(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                        <span className="text-sm text-gray-700">{r.tracker} — {r.issue_id}</span>
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
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Select bug tracker</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(trackerLogos).map(([type, meta]) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTracker(type);
                            setCredentials({});
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTracker === type
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Credentials */}
                  {selectedTracker && trackerFields.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Credentials</h3>
                        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSaved}
                            onChange={(e) => setUseSaved(e.target.checked)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          Use saved credentials
                        </label>
                      </div>
                      {!useSaved && (
                        <div className="space-y-3">
                          {trackerFields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        <h3 className="text-sm font-medium text-gray-700">
                          Issues to file ({selectedIssues.size} of {issues.length})
                        </h3>
                        <button
                          onClick={() => {
                            if (selectedIssues.size === issues.length) {
                              setSelectedIssues(new Set());
                            } else {
                              setSelectedIssues(new Set(issues.map((i) => i.id)));
                            }
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          {selectedIssues.size === issues.length ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                        {issues.map((issue) => (
                          <label
                            key={issue.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIssues.has(issue.id)}
                              onChange={() => toggleIssue(issue.id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className={`badge-${issue.severity} text-[10px]`}>{issue.severity}</span>
                            <span className="text-sm text-gray-700 truncate">{issue.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTracker && issues.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
                      No issues available to file
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
