"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
}

const roleBadge: Record<string, string> = {
  owner: "bg-zinc-900 text-white",
  admin: "bg-zinc-100 text-zinc-700",
  member: "bg-zinc-100 text-zinc-500",
};

export default function TeamPage() {
  const { user, tenant } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.listTeamMembers();
        const fetched = res?.members ?? [];
        if (user && fetched.length > 0) {
          const idx = fetched.findIndex((m: Member) => m.email === user.email);
          if (idx > 0) {
            const [current] = fetched.splice(idx, 1);
            fetched.unshift(current);
          }
        }
        setMembers(fetched);
      } catch {
        setFetchFailed(true);
        if (user) {
          setMembers([
            {
              id: user.id || "self",
              email: user.email,
              name: user.name,
              role: "owner",
              joined_at: user.created_at || new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [user]);

  const currentMember = members.find((m) => m.email === user?.email);
  const canInvite = fetchFailed || currentMember?.role === "owner" || currentMember?.role === "admin";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const res = await api.inviteMember(inviteEmail, inviteRole);
      setInviteSuccess(res?.message || `Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      try {
        const r = await api.listTeamMembers();
        if (r?.members) setMembers(r.members);
      } catch {
        // ignore
      }
    } catch (err: any) {
      setInviteError(err?.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const tenantName = tenant?.name || "Your Organization";

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-22 font-semibold text-zinc-900">Team</h1>
        <p className="text-12 text-zinc-400 mt-1">{tenantName}</p>
      </div>

      {/* Invite form */}
      {canInvite && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
          <h2 className="text-11 font-medium text-zinc-400 uppercase tracking-wide mb-3">
            Invite member
          </h2>
          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-11 font-medium text-zinc-500 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="input-field w-full"
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-11 font-medium text-zinc-500 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="input-field w-full"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="btn-primary flex items-center gap-1.5"
            >
              {inviting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              Send Invite
            </button>
          </form>

          {inviteSuccess && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-12 rounded-md px-3 py-2">
              {inviteSuccess}
            </div>
          )}
          {inviteError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-12 rounded-md px-3 py-2">
              {inviteError}
            </div>
          )}
        </div>
      )}

      {/* Members table */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-12 text-zinc-400">Loading team...</p>
        </div>
      ) : members.length === 0 ? (
        <p className="py-12 text-center text-13 text-zinc-400">No team members yet</p>
      ) : (
        <div>
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_100px_120px] gap-4 px-3 py-2 border-b border-zinc-200">
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Name</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Email</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Role</span>
            <span className="text-11 font-medium text-zinc-400 uppercase tracking-wide">Joined</span>
          </div>
          {/* Rows */}
          {members.map((member) => {
            const isCurrentUser = member.email === user?.email;
            return (
              <div
                key={member.id}
                className={`grid grid-cols-[1fr_1fr_100px_120px] gap-4 items-center px-3 py-3 border-b border-zinc-100 transition-colors ${
                  isCurrentUser ? "bg-zinc-50" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-11 font-semibold">
                    {member.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-13 font-medium text-zinc-900">{member.name}</span>
                    {isCurrentUser && (
                      <span className="text-11 text-zinc-400">(you)</span>
                    )}
                  </div>
                </div>
                <span className="text-12 text-zinc-500">{member.email}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-11 font-medium w-fit ${
                  roleBadge[member.role] || roleBadge.member
                }`}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span className="text-12 text-zinc-400">
                  {new Date(member.joined_at).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
