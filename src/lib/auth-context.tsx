"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api, setTokens, clearTokens } from "@/lib/api";
import type { User, Tenant } from "@/types";

interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, tenant_name: string) => Promise<void>;
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
    async (email: string, password: string, name: string, tenant_name: string) => {
      const res = await api.signup(email, password, name, tenant_name);
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

  // On mount, try to refresh token
  useEffect(() => {
    api
      .refreshToken()
      .then((ok) => {
        if (ok) {
          return api.getMe().then((res) => setUser(res.user));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
