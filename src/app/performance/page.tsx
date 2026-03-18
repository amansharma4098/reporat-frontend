"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Grade helpers                                                      */
/* ------------------------------------------------------------------ */

const gradeColors: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-200",
  B: "bg-blue-50 text-blue-700 border-blue-200",
  C: "bg-amber-50 text-amber-700 border-amber-200",
  D: "bg-orange-50 text-orange-700 border-orange-200",
  F: "bg-red-50 text-red-700 border-red-200",
};

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 50) return "C";
  if (score >= 25) return "D";
  return "F";
}

function responseTimeColor(ms: number): string {
  if (ms < 200) return "text-emerald-600";
  if (ms <= 500) return "text-amber-600";
  return "text-red-600";
}

const sevBadge: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  high: "bg-orange-50 text-orange-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-blue-50 text-blue-700",
  info: "bg-zinc-100 text-zinc-500",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<"loadtest" | "frontend">("loadtest");

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">Performance</h1>
        <p className="text-13 text-zinc-400 mt-1">
          Test API speed, frontend quality, and code performance
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-zinc-200 mb-5">
        <div className="flex gap-0">
          {(
            [
              { key: "loadtest" as const, label: "API Load Test" },
              { key: "frontend" as const, label: "Frontend Audit" },
            ] as const
          ).map((tab) => (
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

      {activeTab === "loadtest" && <LoadTestTab />}
      {activeTab === "frontend" && <FrontendAuditTab />}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  API Load Test Tab                                                  */
/* ------------------------------------------------------------------ */

function LoadTestTab() {
  const [targetUrl, setTargetUrl] = useState("");
  const [concurrentUsers, setConcurrentUsers] = useState(10);
  const [duration, setDuration] = useState(10);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleRun = async () => {
    if (!targetUrl.trim()) return;
    setRunning(true);
    setError("");
    setResult(null);
    cleanup();

    try {
      const res = await api.runLoadTest({
        target_url: targetUrl.trim(),
        concurrent_users: concurrentUsers,
        duration_seconds: duration,
      });

      const testId = res?.id ?? res?.test_id;
      if (!testId) {
        // Result returned inline
        setResult(res);
        setRunning(false);
        return;
      }

      // Poll for result
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await api.getLoadTestResult(testId);
          const status = pollRes?.status;
          if (status === "completed" || status === "done" || pollRes?.result) {
            setResult(pollRes?.result ?? pollRes);
            setRunning(false);
            cleanup();
          } else if (status === "failed" || status === "error") {
            setError(pollRes?.error ?? "Load test failed");
            setRunning(false);
            cleanup();
          }
        } catch {
          setError("Failed to fetch load test result");
          setRunning(false);
          cleanup();
        }
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to start load test");
      setRunning(false);
    }
  };

  const grade = result?.grade ?? (result?.score != null ? scoreToGrade(result.score) : null);
  const endpoints = result?.endpoints ?? result?.endpoint_results ?? [];

  return (
    <div>
      {/* Form */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-11 font-medium text-zinc-500 mb-1">Target URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="input-field w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Concurrent Users</label>
              <input
                type="number"
                value={concurrentUsers}
                onChange={(e) => setConcurrentUsers(Number(e.target.value) || 1)}
                min={1}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field w-full"
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleRun}
            disabled={running || !targetUrl.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {running && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {running ? "Running..." : "Run Load Test"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-[pageEnter_0.2s_ease-out]">
          {/* Grade + summary stats */}
          <div className="flex items-start gap-6 mb-6">
            {/* Grade badge */}
            {grade && (
              <div
                className={`w-[72px] h-[72px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${gradeColors[grade] ?? "bg-zinc-50 text-zinc-700 border-zinc-200"}`}
              >
                <span className="text-[32px] font-bold leading-none">{grade}</span>
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3 flex-1">
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <p className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Total Requests</p>
                <p className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-none">
                  {result.total_requests ?? "--"}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <p className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Avg Response</p>
                <p className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-none">
                  {result.avg_response_ms != null ? `${Math.round(result.avg_response_ms)}ms` : "--"}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <p className="text-11 font-medium text-zinc-400 uppercase tracking-wide">P95 Response</p>
                <p className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-none">
                  {result.p95_response_ms != null ? `${Math.round(result.p95_response_ms)}ms` : "--"}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-3">
                <p className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Throughput</p>
                <p className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-none">
                  {result.throughput != null ? `${Number(result.throughput).toFixed(1)} req/s` : "--"}
                </p>
              </div>
            </div>
          </div>

          {/* Endpoint breakdown */}
          {endpoints.length > 0 && (
            <div>
              <h3 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-3">
                Endpoint Breakdown
              </h3>
              {/* Table header */}
              <div className="grid grid-cols-[1.5fr_80px_80px_80px_80px_100px] gap-3 px-3 py-2 border-b border-zinc-200">
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Endpoint</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Avg</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">P95</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">P99</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Errors</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Throughput</span>
              </div>
              {endpoints.map((ep: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.5fr_80px_80px_80px_80px_100px] gap-3 items-center px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-12 font-mono text-zinc-600 truncate">
                    {ep.endpoint ?? ep.path ?? ep.url ?? "--"}
                  </span>
                  <span className={`text-12 font-mono ${ep.avg_ms != null ? responseTimeColor(ep.avg_ms) : "text-zinc-400"}`}>
                    {ep.avg_ms != null ? `${Math.round(ep.avg_ms)}ms` : "--"}
                  </span>
                  <span className={`text-12 font-mono ${ep.p95_ms != null ? responseTimeColor(ep.p95_ms) : "text-zinc-400"}`}>
                    {ep.p95_ms != null ? `${Math.round(ep.p95_ms)}ms` : "--"}
                  </span>
                  <span className={`text-12 font-mono ${ep.p99_ms != null ? responseTimeColor(ep.p99_ms) : "text-zinc-400"}`}>
                    {ep.p99_ms != null ? `${Math.round(ep.p99_ms)}ms` : "--"}
                  </span>
                  <span className={`text-12 font-mono ${(ep.errors ?? 0) > 0 ? "text-red-600" : "text-zinc-400"}`}>
                    {ep.errors ?? 0}
                  </span>
                  <span className="text-12 font-mono text-zinc-600">
                    {ep.throughput != null ? `${Number(ep.throughput).toFixed(1)} req/s` : "--"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!running && !result && !error && (
        <div className="py-12 text-center">
          <p className="text-13 text-zinc-400">Run a load test to see results</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Frontend Audit Tab                                                 */
/* ------------------------------------------------------------------ */

function FrontendAuditTab() {
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!url.trim()) return;
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await api.runFrontendPerf(url.trim());
      setResult(res?.result ?? res);
    } catch (err: any) {
      setError(err?.message || "Failed to run frontend audit");
    } finally {
      setRunning(false);
    }
  };

  const score = result?.score ?? null;
  const grade = score != null ? scoreToGrade(score) : null;
  const metrics = result?.metrics ?? {};
  const issues = result?.issues ?? [];

  const metricItems = [
    { label: "Load Time", value: metrics.load_time_ms != null ? `${(metrics.load_time_ms / 1000).toFixed(2)}s` : null, ok: metrics.load_time_ms != null ? metrics.load_time_ms < 3000 : null },
    { label: "TTFB", value: metrics.ttfb_ms != null ? `${Math.round(metrics.ttfb_ms)}ms` : null, ok: metrics.ttfb_ms != null ? metrics.ttfb_ms < 600 : null },
    { label: "Page Size", value: metrics.page_size_bytes != null ? `${(metrics.page_size_bytes / 1024).toFixed(0)} KB` : null, ok: metrics.page_size_bytes != null ? metrics.page_size_bytes < 3000000 : null },
    { label: "Resources", value: metrics.resource_count ?? null, ok: metrics.resource_count != null ? metrics.resource_count < 80 : null },
    { label: "HTTPS", value: metrics.https != null ? (metrics.https ? "Yes" : "No") : null, ok: metrics.https ?? null },
    { label: "Compression", value: metrics.compression != null ? (metrics.compression ? "Yes" : "No") : null, ok: metrics.compression ?? null },
  ];

  return (
    <div>
      {/* Form */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-11 font-medium text-zinc-500 mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="input-field w-full"
            />
          </div>
          <button
            onClick={handleRun}
            disabled={running || !url.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {running && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {running ? "Running..." : "Run Audit"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-[pageEnter_0.2s_ease-out]">
          {/* Score circle + Metrics grid */}
          <div className="flex items-start gap-6 mb-6">
            {/* Score circle */}
            {score != null && grade && (
              <div
                className={`w-[88px] h-[88px] rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0 ${gradeColors[grade] ?? "bg-zinc-50 text-zinc-700 border-zinc-200"}`}
              >
                <span className="text-[28px] font-bold leading-none">{score}</span>
                <span className="text-[10px] font-medium mt-0.5 opacity-70">/ 100</span>
              </div>
            )}

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-3 flex-1">
              {metricItems.map((m) => (
                <div
                  key={m.label}
                  className="bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-11 font-medium text-zinc-400 uppercase tracking-wide">{m.label}</p>
                    <p className="text-[18px] font-semibold text-zinc-900 mt-0.5 leading-none">
                      {m.value ?? "--"}
                    </p>
                  </div>
                  {m.ok != null && (
                    <span className={`text-13 font-medium ${m.ok ? "text-emerald-500" : "text-red-500"}`}>
                      {m.ok ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Issues list */}
          {issues.length > 0 && (
            <div>
              <h3 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-3">
                Issues ({issues.length})
              </h3>
              <div className="grid grid-cols-[80px_1fr_2fr] gap-4 px-3 py-2 border-b border-zinc-200">
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Severity</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Title</span>
                <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Description</span>
              </div>
              {issues.map((issue: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[80px_1fr_2fr] gap-4 items-center px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block w-fit ${
                      sevBadge[issue.severity] ?? "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {issue.severity ?? "info"}
                  </span>
                  <span className="text-13 text-zinc-700 truncate">{issue.title ?? "--"}</span>
                  <span className="text-12 text-zinc-500 truncate">{issue.description ?? "--"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!running && !result && !error && (
        <div className="py-12 text-center">
          <p className="text-13 text-zinc-400">Run a frontend audit to see results</p>
        </div>
      )}
    </div>
  );
}
