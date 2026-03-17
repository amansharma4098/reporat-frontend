"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import type { ConnectorStatus } from "@/types";
import { Plug, CheckCircle2, XCircle, RefreshCw, ExternalLink } from "lucide-react";

const trackerMeta: Record<string, { label: string; color: string; docs: string }> = {
  jira: { label: "Jira Cloud", color: "#2684FF", docs: "https://support.atlassian.com/jira-cloud-administration/docs/manage-api-tokens-for-your-atlassian-account/" },
  azure_boards: { label: "Azure DevOps Boards", color: "#0078D4", docs: "https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate" },
  github_issues: { label: "GitHub Issues", color: "#238636", docs: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" },
  linear: { label: "Linear", color: "#5E6AD2", docs: "https://linear.app/docs/api" },
};

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchConnectors = () => {
    setLoading(true);
    api.listConnectors()
      .then((res) => setConnectors(res.connectors))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchConnectors(); }, []);

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

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-zinc-100">Connectors</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure bug tracker integrations</p>
        </div>
        <button onClick={fetchConnectors} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin text-accent text-2xl mb-3">&#x25E0;</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {connectors.map((c) => {
            const meta = trackerMeta[c.type] || { label: c.type, color: "#888", docs: "#" };
            return (
              <div key={c.type} className="card-hover p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: meta.color + "20" }}
                    >
                      <Plug size={18} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-semibold text-zinc-200">
                        {meta.label}
                      </h3>
                      <p className="text-xs font-mono text-zinc-600">{c.type}</p>
                    </div>
                  </div>

                  {c.connected ? (
                    <div className="flex items-center gap-1.5 text-accent text-xs font-mono">
                      <CheckCircle2 size={14} />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
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
                      <span className="animate-spin">&#x25E0;</span>
                    ) : (
                      <RefreshCw size={10} />
                    )}
                    Test
                  </button>
                  <a
                    href={meta.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-zinc-600 hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    Setup Docs <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 card p-6">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
          Configuration
        </h2>
        <p className="text-sm text-zinc-400 mb-3">
          Add your API tokens in the backend <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-xs">.env</code> file.
          Each connector needs specific credentials to connect.
        </p>
        <pre className="bg-surface-0 rounded-lg p-4 text-xs font-mono text-zinc-500 overflow-x-auto">
{`# Example .env configuration
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=PROJ`}
        </pre>
      </div>
    </Shell>
  );
}
