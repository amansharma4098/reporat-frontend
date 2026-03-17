"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import type { ConnectorStatus, ConnectorSchema } from "@/types";
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

const trackerMeta: Record<string, { label: string; color: string; docs: string }> = {
  jira: { label: "Jira Cloud", color: "#2684FF", docs: "https://support.atlassian.com/jira-cloud-administration/docs/manage-api-tokens-for-your-atlassian-account/" },
  azure_boards: { label: "Azure DevOps Boards", color: "#0078D4", docs: "https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate" },
  github_issues: { label: "GitHub Issues", color: "#238636", docs: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" },
  linear: { label: "Linear", color: "#5E6AD2", docs: "https://linear.app/docs/api" },
};

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [schemas, setSchemas] = useState<ConnectorSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.listConnectors().then((res) => setConnectors(res.connectors)).catch(() => {}),
      api.getConnectorSchema().then((res) => setSchemas(res.schemas)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const testConnector = async (type: string) => {
    setTesting(type);
    try {
      const result = await api.testConnector(type);
      setConnectors((prev) =>
        prev.map((c) => (c.type === type ? { ...c, connected: result.connected } : c))
      );
    } catch {}
    setTesting(null);
  };

  const saveConfig = async (type: string) => {
    const creds = credentials[type];
    if (!creds) return;
    setSaving(type);
    setSaveSuccess(null);
    try {
      await api.saveConnectorConfig(type, creds);
      setSaveSuccess(type);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {}
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
          {connectors.map((c) => {
            const meta = trackerMeta[c.type] || { label: c.type, color: "#888", docs: "#" };
            const schema = schemas.find((s) => s.type === c.type);
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
                    <a
                      href={meta.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors ml-auto"
                    >
                      Docs <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {/* Expanded config */}
                {isExpanded && schema && (
                  <div className="border-t border-slate-200 p-6 space-y-4 bg-slate-50/50 rounded-b-xl">
                    {schema.fields.map((field) => (
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
