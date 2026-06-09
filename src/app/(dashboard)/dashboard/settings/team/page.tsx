"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUiStore } from "@/stores/ui-store";

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending";
  avatarUrl: string | null;
  joinedAt: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

function MemberAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${name} avatar`}
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
      {initials || "?"}
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState<string | null>(null);
  const addToast = useUiStore((s) => s.addToast);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/members");
      if (!res.ok) {
        throw new Error("Failed to load team members");
      }
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) {
        throw new Error("Unexpected response format");
      }
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type");
        if (ct?.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Failed to send invite");
        }
        throw new Error("Failed to send invite");
      }
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      addToast({ type: "success", title: "Invitation sent" });
      fetchMembers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setRoleLoading(memberId);
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: newRole as OrgMember["role"] } : m
        )
      );
      addToast({ type: "success", title: `Role updated to ${newRole}` });
    } catch {
      addToast({ type: "error", title: "Failed to update role" });
    } finally {
      setRoleLoading(null);
    }
  }

  async function handleRemoveMember() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/org/members/${removeTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove member");

      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      addToast({ type: "success", title: `${removeTarget.name} removed` });
    } catch {
      addToast({ type: "error", title: "Failed to remove member" });
    } finally {
      setRemoveLoading(false);
      setRemoveTarget(null);
    }
  }

  async function handleResendInvite(memberId: string) {
    setResendLoading(memberId);
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resend invite");

      addToast({ type: "success", title: "Invitation resent" });
    } catch {
      addToast({ type: "error", title: "Failed to resend invite" });
    } finally {
      setResendLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
            Team Management
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage your organization members and invitations.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Invite team member
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton variant="avatar" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-1/3" />
                  <Skeleton variant="text" className="w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <svg className="h-10 w-10 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={fetchMembers}>
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && members.length === 0 && (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <svg className="h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">No team members yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Invite your team members to collaborate on grant management.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setInviteOpen(true)}>
              Invite Your First Member
            </Button>
          </div>
        </Card>
      )}

      {/* Members list */}
      {!loading && !error && members.length > 0 && (
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Member
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        aria-label={`Change role for ${member.name}`}
                        options={ROLE_OPTIONS}
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={roleLoading === member.id}
                        className="!w-auto !py-2 !text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === "active" ? "success" : "warning"}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(member.id)}
                            loading={resendLoading === member.id}
                            aria-label={`Resend invite to ${member.name}`}
                          >
                            Resend
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveTarget(member)}
                          aria-label={`Remove ${member.name}`}
                          className="!text-danger-600 hover:!bg-danger-50 dark:!text-danger-400 dark:hover:!bg-danger-900/30"
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteEmail(""); setInviteError(null); }} title="Invite Team Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            id="invite-email"
            label="Email address"
            type="email"
            placeholder="colleague@nonprofit.org"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            id="invite-role"
            label="Role"
            options={ROLE_OPTIONS}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
          {inviteError && (
            <p className="text-sm text-danger-600 dark:text-danger-400">{inviteError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setInviteOpen(false); setInviteEmail(""); setInviteError(null); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={inviteLoading}>
              Send Invite
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Remove confirmation dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Team Member"
        message={removeTarget ? `Remove ${removeTarget.name} (${removeTarget.email}) from your organization? They will lose access to all grants and data.` : ""}
        confirmLabel="Remove"
        variant="danger"
        loading={removeLoading}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
