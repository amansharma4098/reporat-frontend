import type {
  ScanRequest,
  ScanDetail,
  ScanSummary,
  ConnectorStatus,
  ConnectorSchema,
  AuthResponse,
  User,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://reporat-backend-production.up.railway.app";

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ---------------------------------------------------------------------------
// Token management — memory cache backed by cookies
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  accessToken = getCookie("reporat_access_token");
  return accessToken;
}

function getRefreshToken(): string | null {
  if (refreshTokenValue) return refreshTokenValue;
  refreshTokenValue = getCookie("reporat_refresh_token");
  return refreshTokenValue;
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshTokenValue = refresh;
  setCookie("reporat_access_token", access, 1800); // 30 min
  setCookie("reporat_refresh_token", refresh, 604800); // 7 days
}

export function clearTokens() {
  accessToken = null;
  refreshTokenValue = null;
  deleteCookie("reporat_access_token");
  deleteCookie("reporat_refresh_token");
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — try refresh
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || `API error: ${retry.status}`);
      }
      return retry.json();
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token ?? rt);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string, name: string, tenant_name: string) =>
    apiFetch<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name, tenant_name }),
    }),

  getMe: () => apiFetch<{ user: User; tenant?: import("@/types").Tenant }>("/api/auth/me"),

  refreshToken: () => tryRefresh(),

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

  getConnectorSchema: () =>
    apiFetch<{ schemas: ConnectorSchema[] }>("/api/connectors/schema"),

  saveConnectorConfig: (type: string, credentials: Record<string, string>) =>
    apiFetch<{ success: boolean; message: string }>(
      `/api/connectors/${type}/config`,
      { method: "POST", body: JSON.stringify(credentials) }
    ),

  // File bugs
  fileBugs: (
    scanId: string,
    tracker_type: string,
    credentials: Record<string, string>,
    issue_ids: string[]
  ) =>
    apiFetch<{ filed: { issue_id: string; tracker: string; url: string }[]; errors: string[] }>(
      `/api/scan/${scanId}/file-bugs`,
      {
        method: "POST",
        body: JSON.stringify({ tracker_type, credentials, issue_ids }),
      }
    ),

  fileBugsSaved: (scanId: string, tracker_type: string, issue_ids: string[]) =>
    apiFetch<{ filed: { issue_id: string; tracker: string; url: string }[]; errors: string[] }>(
      `/api/scan/${scanId}/file-bugs/saved`,
      {
        method: "POST",
        body: JSON.stringify({ tracker_type, issue_ids }),
      }
    ),

  // Team
  listTeamMembers: () =>
    apiFetch<{ members: { id: string; email: string; name: string; role: string; joined_at: string }[] }>(
      "/api/team"
    ),

  inviteMember: (email: string, role: string) =>
    apiFetch<{ success: boolean; message: string }>(
      "/api/team/invite",
      { method: "POST", body: JSON.stringify({ email, role }) }
    ),

  // WebSocket URL
  getWSUrl: (scanId: string) => {
    const wsBase = API_BASE.replace("http", "ws");
    return `${wsBase}/api/scan/ws/${scanId}`;
  },
};
