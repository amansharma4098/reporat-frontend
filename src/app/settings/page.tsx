"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import { Trash2, Copy, Check } from "lucide-react";

// ── Webhooks Section ──────────────────────────────────────────────────────────

interface WebhookConfig {
  id: string;
  source: string;
  auto_scan: boolean;
  url?: string;
}

const sourceInstructions: Record<string, string> = {
  github:
    "Go to your GitHub repo \u2192 Settings \u2192 Webhooks \u2192 Add webhook \u2192 Paste this as Payload URL \u2192 Content type: application/json \u2192 Select \u2018Just the push event\u2019 \u2192 Add webhook",
  gitlab:
    "Go to your GitLab repo \u2192 Settings \u2192 Webhooks \u2192 Paste URL \u2192 Check \u2018Push events\u2019 \u2192 Add webhook",
  azure_devops:
    "Go to Azure DevOps \u2192 Project Settings \u2192 Service Hooks \u2192 Create \u2192 Web Hooks \u2192 Paste URL",
};

const sourceLabels: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  azure_devops: "Azure DevOps",
};

function CopyableUrl({ url, id }: { url: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 text-[12px] font-mono text-zinc-600 truncate select-all">
        {url}
      </code>
      <button
        onClick={copy}
        className="flex items-center gap-1 px-2 py-1.5 text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded-md transition-colors flex-shrink-0"
        title="Copy URL"
      >
        {copied ? (
          <>
            <Check size={13} />
            <span className="text-11 text-emerald-600">Copied!</span>
          </>
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
}

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [source, setSource] = useState("github");
  const [autoScan, setAutoScan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justCreated, setJustCreated] = useState<WebhookConfig | null>(null);

  const fetchWebhooks = async () => {
    try {
      const res = await api.getWebhookConfigs();
      setWebhooks(res?.configs ?? res?.webhooks ?? []);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.createWebhookConfig({ source, auto_scan: autoScan });
      setWebhooks((prev) => [...prev, res]);
      setJustCreated(res);
      setShowForm(false);
      setSource("github");
      setAutoScan(true);
    } catch (err: any) {
      setError(err?.message || "Failed to create webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWebhookConfig(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      if (justCreated?.id === id) setJustCreated(null);
    } catch {
      // ignore
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[14px] font-semibold text-zinc-900">Webhooks</h2>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setJustCreated(null); }} className="btn-secondary text-12">
            Add webhook
          </button>
        )}
      </div>
      <p className="text-12 text-zinc-400 mb-4">Auto-scan repos on git push</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-12 rounded-md px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field w-full">
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="azure_devops">Azure DevOps</option>
              </select>
            </div>
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Auto scan</label>
              <button
                type="button"
                onClick={() => setAutoScan(!autoScan)}
                className="flex items-center gap-2 mt-1"
              >
                <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${autoScan ? "bg-zinc-900" : "bg-zinc-200"}`}>
                  <div className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ${autoScan ? "translate-x-[16px]" : "translate-x-[2px]"}`} />
                </div>
                <span className="text-12 text-zinc-600">{autoScan ? "Enabled" : "Disabled"}</span>
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-12">
              {saving ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-12">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Newly created webhook — prominent URL display */}
      {justCreated?.url && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-13 font-medium text-zinc-900">
              Webhook created for {sourceLabels[justCreated.source] ?? justCreated.source}
            </span>
          </div>
          <CopyableUrl url={justCreated.url} id={justCreated.id} />
          <p className="text-11 text-zinc-500 leading-relaxed">
            {sourceInstructions[justCreated.source] ?? "Paste this URL into your repository\u2019s webhook settings."}
          </p>
          <button onClick={() => setJustCreated(null)} className="text-11 text-zinc-400 hover:text-zinc-600 font-medium">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center">
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
        </div>
      ) : webhooks.length === 0 ? (
        <p className="text-12 text-zinc-400 py-4">No webhooks configured</p>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => (
            <div key={w.id} className="border border-zinc-200 rounded-md p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-13 font-medium text-zinc-900">{sourceLabels[w.source] ?? w.source}</span>
                  <span className={`text-11 px-1.5 py-0.5 rounded ${w.auto_scan ? "bg-zinc-100 text-zinc-600" : "bg-zinc-50 text-zinc-400"}`}>
                    {w.auto_scan ? "Auto-scan on" : "Auto-scan off"}
                  </span>
                </div>
                <button onClick={() => handleDelete(w.id)} className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors">
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
              {w.url && <CopyableUrl url={w.url} id={w.id} />}
              <p className="text-11 text-zinc-400 leading-relaxed">
                {sourceInstructions[w.source] ?? "Paste this URL into your repository\u2019s webhook settings."}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notifications Section ─────────────────────────────────────────────────────

interface NotificationConfig {
  id: string;
  type: string;
  webhook_url: string;
  notify_on: string;
}

function NotificationsSection() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("slack");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyOn, setNotifyOn] = useState("all");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean } | null>(null);

  const fetchConfigs = async () => {
    try {
      const res = await api.getNotificationConfigs();
      setConfigs(res?.configs ?? res?.notifications ?? []);
    } catch {
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleCreate = async () => {
    if (!webhookUrl.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.createNotificationConfig({ type, webhook_url: webhookUrl, notify_on: notifyOn });
      setConfigs((prev) => [...prev, res]);
      setShowForm(false);
      setWebhookUrl("");
      setType("slack");
      setNotifyOn("all");
    } catch (err: any) {
      setError(err?.message || "Failed to create notification");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    setTestResult(null);
    try {
      await api.testNotification(id);
      setTestResult({ id, ok: true });
    } catch {
      setTestResult({ id, ok: false });
    } finally {
      setTesting(null);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotificationConfig(id);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  const notifyLabels: Record<string, string> = {
    all: "All scans",
    failed: "Failed only",
    critical: "Critical issues only",
  };

  return (
    <div className="py-6 border-t border-zinc-200">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[14px] font-semibold text-zinc-900">Notifications</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-secondary text-12">
            Add notification
          </button>
        )}
      </div>
      <p className="text-12 text-zinc-400 mb-4">Get notified when scans complete</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-12 rounded-md px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field w-full">
                <option value="slack">Slack</option>
                <option value="discord">Discord</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-11 font-medium text-zinc-500 mb-1">Webhook URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="input-field w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-11 font-medium text-zinc-500 mb-1">Notify on</label>
            <select value={notifyOn} onChange={(e) => setNotifyOn(e.target.value)} className="input-field w-64">
              <option value="all">All scans</option>
              <option value="failed">Failed only</option>
              <option value="critical">Critical issues only</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-12">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); }} className="btn-secondary text-12">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center">
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
        </div>
      ) : configs.length === 0 ? (
        <p className="text-12 text-zinc-400 py-4">No notifications configured</p>
      ) : (
        <div className="space-y-2">
          {configs.map((c) => (
            <div key={c.id} className="border border-zinc-200 rounded-md px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-13 font-medium text-zinc-900 capitalize">{c.type}</span>
                <span className="text-11 bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                  {notifyLabels[c.notify_on] ?? c.notify_on}
                </span>
                <span className="text-11 font-mono text-zinc-400 truncate max-w-[200px]">{c.webhook_url}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTest(c.id)}
                  disabled={testing === c.id}
                  className="btn-secondary text-11 px-2.5 py-1"
                >
                  {testing === c.id ? "Sending..." : "Test"}
                </button>
                {testResult?.id === c.id && (
                  <span className={`text-11 ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}>
                    {testResult.ok ? "Sent" : "Failed"}
                  </span>
                )}
                <button onClick={() => handleDelete(c.id)} className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors">
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-11 text-zinc-400 mt-3">
        Create a Slack incoming webhook at api.slack.com/messaging/webhooks
      </p>
    </div>
  );
}

// ── Schedules Section ─────────────────────────────────────────────────────────

interface Schedule {
  id: string;
  repo_url: string;
  branch: string;
  repo_source: string;
  interval: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
}

function SchedulesSection() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [repoSource, setRepoSource] = useState("github");
  const [interval, setInterval_] = useState("daily");
  const [saving, setSaving] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await api.getSchedules();
      setSchedules(res?.schedules ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleCreate = async () => {
    if (!repoUrl.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.createSchedule({ repo_url: repoUrl, branch, repo_source: repoSource, interval: interval });
      setSchedules((prev) => [...prev, res]);
      setShowForm(false);
      setRepoUrl("");
      setBranch("main");
    } catch (err: any) {
      setError(err?.message || "Failed to create schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await api.toggleSchedule(id);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: res?.enabled ?? !s.enabled } : s))
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  };

  const intervalLabels: Record<string, string> = {
    "6h": "Every 6 hours",
    "12h": "Every 12 hours",
    daily: "Daily",
    weekly: "Weekly",
  };

  const repoNameFromUrl = (url: string) => {
    try {
      const parts = url.replace(/\.git$/, "").split("/");
      return parts.slice(-2).join("/");
    } catch {
      return url;
    }
  };

  return (
    <div className="py-6 border-t border-zinc-200">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[14px] font-semibold text-zinc-900">Scheduled scans</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-secondary text-12">
            Add schedule
          </button>
        )}
      </div>
      <p className="text-12 text-zinc-400 mb-4">Automatically scan repos on a schedule</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-12 rounded-md px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 mb-4 space-y-3">
          <div>
            <label className="block text-11 font-medium text-zinc-500 mb-1">Repository URL</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="input-field w-full"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Branch</label>
              <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Source</label>
              <select value={repoSource} onChange={(e) => setRepoSource(e.target.value)} className="input-field w-full">
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="azure_devops">Azure DevOps</option>
              </select>
            </div>
            <div>
              <label className="block text-11 font-medium text-zinc-500 mb-1">Interval</label>
              <select value={interval} onChange={(e) => setInterval_(e.target.value)} className="input-field w-full">
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-12">
              {saving ? "Creating..." : "Create"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); }} className="btn-secondary text-12">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center">
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
        </div>
      ) : schedules.length === 0 ? (
        <p className="text-12 text-zinc-400 py-4">No scheduled scans</p>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_100px_100px_50px_32px] gap-3 px-3 py-2 border-b border-zinc-200">
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Repository</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Interval</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Last run</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Next run</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">On</span>
            <span />
          </div>
          {schedules.map((s) => (
            <div key={s.id} className="grid grid-cols-[1fr_100px_100px_100px_50px_32px] gap-3 items-center px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
              <div>
                <p className="text-13 font-medium text-zinc-900">{repoNameFromUrl(s.repo_url)}</p>
                <p className="text-11 text-zinc-400">{s.branch}</p>
              </div>
              <span className="text-12 text-zinc-500">{intervalLabels[s.interval] ?? s.interval}</span>
              <span className="text-11 text-zinc-400">{s.last_run ? new Date(s.last_run).toLocaleDateString() : "—"}</span>
              <span className="text-11 text-zinc-400">{s.next_run ? new Date(s.next_run).toLocaleDateString() : "—"}</span>
              <button onClick={() => handleToggle(s.id)} className="flex items-center">
                <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${s.enabled ? "bg-zinc-900" : "bg-zinc-200"}`}>
                  <div className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ${s.enabled ? "translate-x-[16px]" : "translate-x-[2px]"}`} />
                </div>
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors">
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">Settings</h1>
      </div>

      <WebhooksSection />
      <NotificationsSection />
      <SchedulesSection />
    </Shell>
  );
}
