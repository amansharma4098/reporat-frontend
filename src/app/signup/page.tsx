"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

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
          `This organization already exists. Switch to "Join existing" and select it.`
        );
      } else {
        setTenantWarning("");
      }
    } catch {
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
      } else if (/already registered/i.test(msg) || (/already exists/i.test(msg) && /email/i.test(msg))) {
        setError("ACCOUNT_EXISTS");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center">
              <span className="text-white font-semibold text-13">R</span>
            </div>
            <span className="font-semibold text-[18px] text-zinc-900 tracking-tight">RepoRat</span>
          </div>
          <p className="text-12 text-zinc-400 mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && error !== "ACCOUNT_EXISTS" && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {error === "ACCOUNT_EXISTS" && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
                Account already exists.{" "}
                <Link href="/login" className="text-zinc-900 font-medium underline">
                  Sign in instead
                </Link>
              </div>
            )}

            <div>
              <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                  Confirm
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            {/* Org mode selector */}
            <div>
              <label className="block text-11 font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Organization
              </label>
              <div className="flex rounded-md overflow-hidden border border-zinc-200 mb-3">
                <button
                  type="button"
                  onClick={() => { setOrgMode("create"); setError(""); setTenantWarning(""); }}
                  className={`flex-1 px-3 py-2 text-12 font-medium transition-colors duration-150 ${
                    orgMode === "create"
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-white text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Create new
                </button>
                <button
                  type="button"
                  onClick={() => { setOrgMode("join"); setError(""); setTenantWarning(""); }}
                  className={`flex-1 px-3 py-2 text-12 font-medium transition-colors duration-150 border-l border-zinc-200 ${
                    orgMode === "join"
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-white text-zinc-400 hover:text-zinc-600"
                  }`}
                >
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
                    className="input-field w-full"
                    required
                  />
                  {tenantWarning && (
                    <p className="mt-2 text-11 text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      {tenantWarning}
                    </p>
                  )}
                </div>
              )}

              {orgMode === "join" && (
                <div>
                  {tenantsLoading ? (
                    <div className="flex items-center gap-2 h-9 px-3 text-zinc-400 text-12">
                      <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                      Loading organizations...
                    </div>
                  ) : tenants.length === 0 ? (
                    <p className="text-12 text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2.5">
                      No organizations found. Create a new one instead.
                    </p>
                  ) : (
                    <select
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      className="input-field w-full"
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
              className="btn-primary w-full h-9 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Creating account..." : orgMode === "create" ? "Create account" : "Join & create account"}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-12 text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
