"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Building2, Users } from "lucide-react";

type OrgMode = "create" | "join";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgMode, setOrgMode] = useState<OrgMode>("create");
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [tenants, setTenants] = useState<{ name: string; slug: string }[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantWarning, setTenantWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      const res = await api.listTenants();
      setTenants(res?.tenants ?? []);
    } catch {
      setTenants([]);
    } finally {
      setTenantsLoading(false);
    }
  };

  useEffect(() => {
    if (orgMode === "join") {
      fetchTenants();
    }
  }, [orgMode]);

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Valid email is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (orgMode === "create" && !orgName.trim()) return "Organization name is required";
    if (orgMode === "join" && !orgCode) return "Please select an organization";
    return null;
  };

  const checkTenantName = async () => {
    if (!orgName.trim()) return;
    try {
      const res = await api.checkTenant(orgName.trim());
      if (res?.exists) {
        setTenantWarning(
          `This organization already exists. Switch to "Join existing" and enter the code: ${res.slug || orgName.toLowerCase().replace(/\s+/g, "-")}`
        );
      } else {
        setTenantWarning("");
      }
    } catch {
      // endpoint may not exist yet — ignore
      setTenantWarning("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (orgMode === "create") {
        await signup(email, password, name, { tenant_name: orgName.trim() });
      } else {
        await signup(email, password, name, { join_tenant_slug: orgCode.trim() });
      }
      router.push("/");
    } catch (err: any) {
      const msg = err?.message || "Failed to create account";
      if (/already taken/i.test(msg) || /already exists/i.test(msg)) {
        setError(`Organization name already taken. Switch to "Join existing" to join it.`);
      } else if (/not found/i.test(msg) && orgMode === "join") {
        setError("Organization code not found. Check with your admin.");
      } else if (/already registered/i.test(msg) || /already exists/i.test(msg) && /email/i.test(msg)) {
        setError("ACCOUNT_EXISTS");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 bg-slate-700/50 border border-slate-600 rounded-lg px-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md page-enter">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <h1 className="font-bold text-2xl text-white tracking-tight">
              RepoRat
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && error !== "ACCOUNT_EXISTS" && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {error === "ACCOUNT_EXISTS" && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                Account already exists.{" "}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium underline">
                  Sign in instead
                </Link>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Org mode selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Organization
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-600 mb-3">
                <button
                  type="button"
                  onClick={() => { setOrgMode("create"); setError(""); setTenantWarning(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    orgMode === "create"
                      ? "bg-emerald-500/15 text-emerald-400 border-r border-emerald-500/30"
                      : "bg-slate-700/30 text-slate-400 border-r border-slate-600 hover:bg-slate-700/50"
                  }`}
                >
                  <Building2 size={14} />
                  Create new
                </button>
                <button
                  type="button"
                  onClick={() => { setOrgMode("join"); setError(""); setTenantWarning(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    orgMode === "join"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-700/30 text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  <Users size={14} />
                  Join existing
                </button>
              </div>

              {orgMode === "create" && (
                <div>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => { setOrgName(e.target.value); setTenantWarning(""); }}
                    onBlur={checkTenantName}
                    placeholder="Acme Inc."
                    className={inputClass}
                    required
                  />
                  {tenantWarning && (
                    <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      {tenantWarning}
                    </p>
                  )}
                </div>
              )}

              {orgMode === "join" && (
                <div>
                  {tenantsLoading ? (
                    <div className="flex items-center gap-2 h-11 px-4 text-slate-500 text-sm">
                      <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      Loading organizations...
                    </div>
                  ) : tenants.length === 0 ? (
                    <p className="text-sm text-slate-400 bg-slate-700/30 rounded-lg px-4 py-3">
                      No organizations found. Create a new one instead.
                    </p>
                  ) : (
                    <select
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      className={inputClass}
                      required
                    >
                      <option value="">Select an organization...</option>
                      {tenants.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.name} ({t.slug})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Creating account..." : orgMode === "create" ? "Create account" : "Join & create account"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
