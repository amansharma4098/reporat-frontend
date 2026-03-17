import type {
  ScanRequest,
  ScanDetail,
  ScanSummary,
  ConnectorStatus,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Scans
  triggerScan: (request: ScanRequest) =>
    apiFetch<{ scan_id: string; status: string; message: string }>(
      "/api/scan",
      { method: "POST", body: JSON.stringify(request) }
    ),

  listScans: () =>
    apiFetch<{ scans: ScanSummary[] }>("/api/scan"),

  getScan: (scanId: string) =>
    apiFetch<ScanDetail>(`/api/scan/${scanId}`),

  getScanSummary: (scanId: string) =>
    apiFetch<ScanSummary>(`/api/scan/${scanId}/summary`),

  // Connectors
  listConnectors: () =>
    apiFetch<{ connectors: ConnectorStatus[] }>("/api/connectors"),

  testConnector: (type: string) =>
    apiFetch<{ type: string; connected: boolean; message: string }>(
      `/api/connectors/${type}/test`,
      { method: "POST" }
    ),

  // WebSocket URL
  getWSUrl: (scanId: string) => {
    const wsBase = API_BASE.replace("http", "ws");
    return `${wsBase}/api/scan/ws/${scanId}`;
  },
};
