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
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  member: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    api.listTeamMembers()
      .then((res) => setMembers(res.members))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentMember = members.find((m) => m.email === user?.email);
  const canInvite = currentMember?.role === "owner" || currentMember?.role === "admin";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const res = await api.inviteMember(inviteEmail, inviteRole);
      setInviteSuccess(res.message || `Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      api.listTeamMembers().then((r) => setMembers(r.members)).catch(() => {});
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization members</p>
      </div>

      {/* Invite form */}
      {canInvite && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <UserPlus size={16} />
            Invite a team member
          </h2>
          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="input-field w-full"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
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
              Invite
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
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading team...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Users size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-semibold">No team members yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role] || User;
                return (
                  <tr
                    key={member.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
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
                    <td className="px-6 py-4 text-sm text-gray-500">
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
