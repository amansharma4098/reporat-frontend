"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import type { ConnectorStatus } from "@/types";
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,

  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

const trackerMeta: Record<string, { label: string; color: string }> = {
  jira: { label: "Jira Cloud", color: "#2684FF" },
  azure_boards: { label: "Azure DevOps Boards", color: "#0078D4" },
  github_issues: { label: "GitHub Issues", color: "#238636" },
  linear: { label: "Linear", color: "#5E6AD2" },
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
      // If API fails, show all trackers as not configured
      setConnectors(ALL_TRACKER_TYPES.map((type) => ({ type: type as any, connected: false })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Ensure all tracker types are shown even if the API only returns some
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
    } catch (err: any) {
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

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Connectors</h1>
          <p className="text-sm text-slate-500 mt-1">Configure bug tracker integrations</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {displayConnectors.map((c) => {
            const meta = trackerMeta[c.type] ?? { label: c.type, color: "#888" };
            const fields = TRACKER_FIELDS[c.type] ?? [];
            const isExpanded = expanded === c.type;

            return (
              <div key={c.type} className="card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.label.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-display font-semibold text-slate-800">
                          {meta.label}
                        </h3>
                        <p className="text-xs text-slate-400">{c.type}</p>
                      </div>
                    </div>

                    {c.connected ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={14} />
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                        <XCircle size={14} />
                        Not configured
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testConnector(c.type)}
                      disabled={testing === c.type}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      {testing === c.type ? (
                        <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RefreshCw size={10} />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : c.type)}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      Configure
                    </button>
                  </div>
                </div>

                {/* Expanded config — uses hardcoded fields, no schema API dependency */}
                {isExpanded && fields.length > 0 && (
                  <div className="border-t border-slate-200 p-6 space-y-4 bg-slate-50/50 rounded-b-xl">
                    {fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={credentials[c.type]?.[field.key] || ""}
                          onChange={(e) => updateCredential(c.type, field.key, e.target.value)}
                          className="input-field w-full text-sm"
                        />
                      </div>
                    ))}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => saveConfig(c.type)}
                        disabled={saving === c.type}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                      >
                        {saving === c.type ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        Save Credentials
                      </button>
                      {saveSuccess === c.type && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Saved
                        </span>
                      )}
                      {saveError === c.type && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle size={12} /> Failed to save
                        </span>
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
