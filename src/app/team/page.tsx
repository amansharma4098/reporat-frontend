"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Users, Mail, UserPlus, Shield, Crown, User } from "lucide-react";

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleBadges: Record<string, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  member: "bg-slate-100 text-slate-600 border-slate-200",
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
        // Ensure current user is first and shown as owner if present
        if (user && fetched.length > 0) {
          const idx = fetched.findIndex((m) => m.email === user.email);
          if (idx > 0) {
            const [current] = fetched.splice(idx, 1);
            fetched.unshift(current);
          }
        }
        setMembers(fetched);
      } catch {
        // Endpoint doesn't exist or failed — fallback to current user as owner
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

  // Current user is owner/admin — show invite form
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
      // Try to refresh members list
      try {
        const r = await api.listTeamMembers();
        if (r?.members) setMembers(r.members);
      } catch {
        // ignore — keep existing list
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Team — {tenantName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your organization members</p>
      </div>

      {/* Invite form */}
      {canInvite && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <UserPlus size={16} />
            Invite a team member
          </h2>
          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="input-field w-full"
                required
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
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
              className="btn-primary flex items-center gap-2"
            >
              {inviting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail size={14} />
              )}
              Send Invite
            </button>
          </form>

          {inviteSuccess && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-lg px-4 py-2">
              {inviteSuccess}
            </div>
          )}
          {inviteError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
              {inviteError}
            </div>
          )}
        </div>
      )}

      {/* Members table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading team...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Users size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">No team members yet</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role] || User;
                const isCurrentUser = member.email === user?.email;
                return (
                  <tr
                    key={member.id}
                    className={`border-b border-slate-100 transition-colors ${
                      isCurrentUser ? "bg-violet-50/30" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold">
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{member.name}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] text-slate-400 font-medium">(you)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {member.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          roleBadges[member.role] || roleBadges.member
                        }`}
                      >
                        <RoleIcon size={12} />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
