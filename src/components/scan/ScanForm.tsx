"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { RepoSource } from "@/types";
import { ScanSearch, GitBranch, Zap, Shield } from "lucide-react";

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
    <div className="space-y-5">
      {/* Repo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
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

      {/* Branch + Source Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <GitBranch size={12} className="inline mr-1" />
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Repo Source
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

      {/* Toggle switches */}
      <div className="flex gap-4">
        <ToggleSwitch label="Static Analysis" icon={Shield} checked={staticAnalysis} onChange={setStaticAnalysis} />
        <ToggleSwitch label="AI Tests" icon={Zap} checked={aiTests} onChange={setAiTests} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full h-11 flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <ScanSearch size={16} />
        )}
        {loading ? "Starting Scan..." : "Start Scan"}
      </button>
    </div>
  );
}

function ToggleSwitch({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: any;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      {/* Switch track */}
      <div
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
          checked ? "bg-emerald-500" : "bg-gray-200"
        }`}
      >
        {/* Switch thumb */}
        <div
          className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={checked ? "text-emerald-600" : "text-gray-400"} />
        <span className={`text-sm font-medium ${checked ? "text-gray-700" : "text-gray-400"}`}>
          {label}
        </span>
      </div>
    </button>
  );
}
