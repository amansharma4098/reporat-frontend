"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { RepoSource } from "@/types";

const repoSources: { value: RepoSource; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "azure_devops", label: "Azure DevOps" },
  { value: "gitlab", label: "GitLab" },
];

interface Props {
  onScanStarted: (scanId: string) => void;
}

export default function ScanForm({ onScanStarted }: Props) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [repoSource, setRepoSource] = useState<RepoSource>("github");
  const [staticAnalysis, setStaticAnalysis] = useState(true);
  const [aiTests, setAiTests] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!repoUrl.trim()) {
      setError("Repo URL is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await api.triggerScan({
        repo_url: repoUrl.trim(),
        branch,
        repo_source: repoSource,
        run_static_analysis: staticAnalysis,
        run_ai_tests: aiTests,
        include_patterns: ["*.py", "*.js", "*.ts"],
        exclude_patterns: ["node_modules", ".git", "__pycache__", "venv"],
      });
      onScanStarted(result.scan_id);
    } catch (err: any) {
      setError(err.message || "Failed to start scan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Repo URL */}
      <div>
        <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
          Repository URL
        </label>
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="input-field w-full"
        />
      </div>

      {/* Branch + Source */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            Branch
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            Source
          </label>
          <select
            value={repoSource}
            onChange={(e) => setRepoSource(e.target.value as RepoSource)}
            className="input-field w-full"
          >
            {repoSources.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-4">
        <ToggleSwitch label="Static Analysis" checked={staticAnalysis} onChange={setStaticAnalysis} />
        <ToggleSwitch label="AI Tests" checked={aiTests} onChange={setAiTests} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full h-9 flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : null}
        {loading ? "Starting..." : "Start Scan"}
      </button>
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5"
    >
      <div
        className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${
          checked ? "bg-zinc-900" : "bg-zinc-200"
        }`}
      >
        <div
          className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[16px]" : "translate-x-[2px]"
          }`}
        />
      </div>
      <span className={`text-12 font-medium ${checked ? "text-zinc-700" : "text-zinc-400"}`}>
        {label}
      </span>
    </button>
  );
}
