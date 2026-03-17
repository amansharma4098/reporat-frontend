"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { RepoSource, BugTrackerType } from "@/types";
import { ScanSearch, GitBranch, Zap, Shield, Bug } from "lucide-react";

const repoSources: { value: RepoSource; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "azure_devops", label: "Azure DevOps" },
  { value: "gitlab", label: "GitLab" },
];

const bugTrackers: { value: BugTrackerType; label: string }[] = [
  { value: "github_issues", label: "GitHub Issues" },
  { value: "jira", label: "Jira" },
  { value: "azure_boards", label: "Azure Boards" },
  { value: "linear", label: "Linear" },
];

interface Props {
  onScanStarted: (scanId: string) => void;
}

export default function ScanForm({ onScanStarted }: Props) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [repoSource, setRepoSource] = useState<RepoSource>("github");
  const [bugTracker, setBugTracker] = useState<BugTrackerType>("github_issues");
  const [staticAnalysis, setStaticAnalysis] = useState(true);
  const [aiTests, setAiTests] = useState(true);
  const [fileBugs, setFileBugs] = useState(true);
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
        bug_tracker: bugTracker,
        run_static_analysis: staticAnalysis,
        run_ai_tests: aiTests,
        file_bugs: fileBugs,
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
    <div className="space-y-6">
      {/* Repo URL */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
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
          <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
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
          <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
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

      {/* Bug Tracker */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
          <Bug size={12} className="inline mr-1" />
          Bug Tracker
        </label>
        <select
          value={bugTracker}
          onChange={(e) => setBugTracker(e.target.value as BugTrackerType)}
          className="input-field w-full"
        >
          {bugTrackers.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <Toggle label="Static Analysis" icon={Shield} checked={staticAnalysis} onChange={setStaticAnalysis} />
        <Toggle label="AI Tests" icon={Zap} checked={aiTests} onChange={setAiTests} />
        <Toggle label="File Bugs" icon={Bug} checked={fileBugs} onChange={setFileBugs} />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm font-mono bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? (
          <span className="animate-spin">&#x25E0;</span>
        ) : (
          <ScanSearch size={16} />
        )}
        {loading ? "Starting Scan..." : "Start Scan"}
      </button>
    </div>
  );
}

function Toggle({
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
        checked
          ? "bg-accent/10 text-accent border-accent/30"
          : "bg-surface-3 text-zinc-500 border-surface-4"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
