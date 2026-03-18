"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api, API_BASE, setTokens, clearTokens } from "@/lib/api";
import { getCookie, setCookie, deleteCookie } from "@/lib/cookies";
import type { User, Tenant } from "@/types";

interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    opts: { tenant_name?: string; join_tenant_slug?: string }
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    setTenant(res.tenant);
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      opts: { tenant_name?: string; join_tenant_slug?: string }
    ) => {
      const res = await api.signup(email, password, name, opts);
      setTokens(res.access_token, res.refresh_token);
      setUser(res.user);
      setTenant(res.tenant);
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setTenant(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  // ── On mount: restore session from cookies ──────────────────────────────
  useEffect(() => {
    const restore = async () => {
      // 1. Try existing access token from cookie
      const token = getCookie("rr_token");
      if (token) {
        try {
          const res = await fetch(API_BASE + "/api/auth/me", {
            headers: { Authorization: "Bearer " + token },
          });
          if (res.ok) {
            const data = await res.json();
            // Sync token into memory so apiFetch picks it up
            setTokens(token, getCookie("rr_refresh") || "");
            setUser(data.user);
            if (data.tenant) setTenant(data.tenant);
            setLoading(false);
            return;
          }
        } catch {
          // token invalid or network error — fall through to refresh
        }
      }

      // 2. Access token missing or /me failed — try refresh
      const refresh = getCookie("rr_refresh");
      if (refresh) {
        try {
          const res = await fetch(API_BASE + "/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refresh }),
          });
          if (res.ok) {
            const data = await res.json();
            const newAccess = data.access_token;
            const newRefresh = data.refresh_token || refresh;
            setCookie("rr_token", newAccess, 1800);
            setCookie("rr_refresh", newRefresh, 604800);
            setTokens(newAccess, newRefresh);

            // Now call /me with the fresh token
            const meRes = await fetch(API_BASE + "/api/auth/me", {
              headers: { Authorization: "Bearer " + newAccess },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              setUser(meData.user);
              if (meData.tenant) setTenant(meData.tenant);
              setLoading(false);
              return;
            }
          }
        } catch {
          // refresh failed — fall through
        }
      }

      // 3. Nothing worked — user is not authenticated
      clearTokens();
      setLoading(false);
    };

    restore();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, tenant, loading, isAuthenticated, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
