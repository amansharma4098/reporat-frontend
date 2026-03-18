"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import type { ConnectorStatus } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";

const trackerMeta: Record<string, { label: string; description: string }> = {
  jira: { label: "Jira Cloud", description: "Atlassian Jira issue tracking" },
  azure_boards: { label: "Azure DevOps", description: "Azure Boards work items" },
  github_issues: { label: "GitHub Issues", description: "GitHub issue tracker" },
  linear: { label: "Linear", description: "Linear project management" },
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

const ALL_TRACKER_TYPES = Object.keys(trackerMeta);

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.listConnectors();
      setConnectors(res?.connectors ?? []);
    } catch {
      setConnectors(ALL_TRACKER_TYPES.map((type) => ({ type: type as any, connected: false })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const displayConnectors: ConnectorStatus[] = ALL_TRACKER_TYPES.map((type) => {
    const existing = connectors.find((c) => c.type === type);
    return existing ?? { type: type as any, connected: false };
  });

  const testConnector = async (type: string) => {
    setTesting(type);
    try {
      const result = await api.testConnector(type);
      setConnectors((prev) =>
        prev.map((c) => (c.type === type ? { ...c, connected: result?.connected ?? false } : c))
      );
    } catch {
      // silently fail
    }
    setTesting(null);
  };

  const saveConfig = async (type: string) => {
    const creds = credentials[type];
    if (!creds) return;
    setSaving(type);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      await api.saveConnectorConfig(type, creds);
      setSaveSuccess(type);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      setSaveError(type);
      setTimeout(() => setSaveError(null), 5000);
    }
    setSaving(null);
  };

  const updateCredential = (type: string, key: string, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [type]: { ...prev[type], [key]: value },
    }));
  };

  const toggleExpand = (type: string) => {
    setExpanded((prev) => (prev === type ? null : type));
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">Connectors</h1>
        <button onClick={fetchData} className="btn-secondary">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {displayConnectors.map((c) => {
            const meta = trackerMeta[c.type] ?? { label: c.type, description: "" };
            const fields = TRACKER_FIELDS[c.type] ?? [];
            const isExpanded = expanded === c.type;

            return (
              <div key={c.type} className="bg-white rounded-lg border border-zinc-200 transition-colors duration-150 hover:border-zinc-300">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-13 font-medium text-zinc-900">{meta.label}</h3>
                      <p className="text-11 text-zinc-400 mt-0.5">{meta.description}</p>
                    </div>
                    {c.connected ? (
                      <div className="flex items-center gap-1.5 text-11 font-medium text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-11 font-medium text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                        Not configured
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testConnector(c.type)}
                      disabled={testing === c.type}
                      className="btn-secondary text-11 px-2.5 py-1"
                    >
                      {testing === c.type ? "Testing..." : "Test"}
                    </button>
                    <button
                      onClick={() => toggleExpand(c.type)}
                      className="btn-secondary text-11 px-2.5 py-1 flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      Configure
                    </button>
                  </div>
                </div>

                {/* Expanded config */}
                {isExpanded && fields.length > 0 && (
                  <div className="border-t border-zinc-200 p-4 space-y-3 bg-zinc-50/50">
                    {fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-11 font-medium text-zinc-500 mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={credentials[c.type]?.[field.key] || ""}
                          onChange={(e) => updateCredential(c.type, field.key, e.target.value)}
                          className="input-field w-full"
                        />
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => saveConfig(c.type)}
                        disabled={saving === c.type}
                        className="btn-primary text-11 px-3 py-1.5"
                      >
                        {saving === c.type ? "Saving..." : "Save"}
                      </button>
                      {saveSuccess === c.type && (
                        <span className="text-11 text-emerald-600">Saved</span>
                      )}
                      {saveError === c.type && (
                        <span className="text-11 text-red-500">Failed to save</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
