"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, Clock, LogOut, Mail, RotateCw, Shield, Trash2, UserPlus, X } from "lucide-react";
import { api, type Invite, type Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { InviteModal, Modal } from "@/components/Modals";
import { Avatar, PageHeader, ROLE_META, RoleBadge, timeAgo } from "@/components/ui";

const PERMISSIONS: { label: string; roles: Role[] }[] = [
  { label: "View spaces, lists & tasks", roles: ["OWNER", "ADMIN", "MEMBER", "GUEST"] },
  { label: "Comment on tasks", roles: ["OWNER", "ADMIN", "MEMBER", "GUEST"] },
  { label: "Create, edit & delete tasks", roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Create folders & lists", roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Create & delete spaces", roles: ["OWNER", "ADMIN"] },
  { label: "Delete folders & lists", roles: ["OWNER", "ADMIN"] },
  { label: "Invite & remove members", roles: ["OWNER", "ADMIN"] },
  { label: "Make or remove admins", roles: ["OWNER"] },
  { label: "Delete workspace", roles: ["OWNER"] },
];

export default function MembersPage() {
  const ws = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviting, setInviting] = useState(false);
  const [resent, setResent] = useState<{ email: string; link: string; emailed: boolean } | null>(null);

  const loadInvites = useCallback(async () => {
    if (!ws.current || !ws.can.manage) return;
    setInvites(await api<Invite[]>(`/workspaces/${ws.current.id}/invites`).catch(() => []));
  }, [ws.current?.id, ws.can.manage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const myRole = ws.current?.role;
  // Which roles can I hand out to this member?
  const assignable = (target: Role): Role[] => {
    if (target === "OWNER") return [];
    if (myRole === "OWNER") return ["ADMIN", "MEMBER", "GUEST"];
    if (myRole === "ADMIN" && target !== "ADMIN") return ["MEMBER", "GUEST"];
    return [];
  };

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      <PageHeader
        title="Team Members"
        subtitle={<>{ws.members.length} member{ws.members.length === 1 ? "" : "s"} in <span className="font-semibold text-accent">{ws.current?.name}</span></>}
        actions={
          ws.can.manage && (
            <button className="btn-accent" onClick={() => setInviting(true)}>
              <UserPlus size={16} /> Invite by email
            </button>
          )
        }
      />

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1fr_180px_120px_60px] gap-4 border-b border-line bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-faint sm:grid">
          <span>Member</span><span>Role</span><span>Joined</span><span />
        </div>
        {ws.members.map((m) => {
          const role = m.role as Role;
          const options = m.id === user?.id ? [] : assignable(role);
          const removable = m.id !== user?.id && role !== "OWNER" && (myRole === "OWNER" || (myRole === "ADMIN" && role !== "ADMIN"));
          return (
            <div key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 last:border-0 sm:grid-cols-[1fr_180px_120px_60px]">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={m} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-fg">
                    {m.name} {m.id === user?.id && <span className="text-xs font-normal text-faint">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
              </div>
              <div>
                {options.length ? (
                  <select
                    value={role}
                    onChange={(e) =>
                      run(async () => {
                        await api(`/workspaces/${ws.current!.id}/members/${m.id}`, { method: "PATCH", body: { role: e.target.value } });
                        await ws.refreshMembers();
                      })
                    }
                    className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs font-semibold text-fg outline-none [&>option]:bg-surface-2"
                  >
                    {!options.includes(role) && <option value={role}>{ROLE_META[role].label}</option>}
                    {options.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                  </select>
                ) : (
                  <RoleBadge role={role} />
                )}
              </div>
              <span className="hidden text-xs text-muted sm:block">{m.joinedAt ? timeAgo(m.joinedAt) : "—"}</span>
              <div className="hidden justify-end sm:flex">
                {removable && (
                  <button
                    onClick={() =>
                      confirm(`Remove ${m.name} from the workspace?`) &&
                      run(async () => {
                        await api(`/workspaces/${ws.current!.id}/members/${m.id}`, { method: "DELETE" });
                        await ws.refreshMembers();
                      })
                    }
                    className="rounded-lg p-2 text-faint hover:bg-red-500/10 hover:text-red-500"
                    title="Remove member"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                {m.id === user?.id && role !== "OWNER" && (
                  <button
                    onClick={() =>
                      confirm("Leave this workspace?") &&
                      run(async () => {
                        await api(`/workspaces/${ws.current!.id}/members/${m.id}`, { method: "DELETE" });
                        await ws.refresh();
                        router.push("/app");
                      })
                    }
                    className="rounded-lg p-2 text-faint hover:bg-red-500/10 hover:text-red-500"
                    title="Leave workspace"
                  >
                    <LogOut size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {ws.can.manage && (
        <>
          <h2 className="mt-10 mb-3 flex items-center gap-2 text-sm font-bold text-fg">
            <Mail size={16} className="text-accent" /> Pending invites
            <span className="rounded-full bg-surface-3 px-2 text-xs text-muted">{invites.length}</span>
          </h2>
          {invites.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line-strong px-5 py-6 text-sm text-muted">No pending invites. Invited people appear here until they accept.</p>
          ) : (
            <div className="panel divide-y divide-line overflow-hidden">
              {invites.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-line-strong text-faint"><Mail size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{inv.email}</p>
                    <p className="flex items-center gap-1 text-xs text-faint">
                      <Clock size={11} /> Invited by {inv.invitedBy.name} · {timeAgo(inv.createdAt)} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RoleBadge role={inv.role} />
                  <button
                    className="btn-soft px-2.5 py-1.5 text-xs"
                    onClick={() =>
                      run(async () => {
                        const r = await api<{ emailed: boolean; link: string }>(`/invites/${inv.id}/resend`, { method: "POST" });
                        setResent({ ...r, email: inv.email });
                      })
                    }
                  >
                    <RotateCw size={13} /> Resend
                  </button>
                  <button
                    className="rounded-lg p-2 text-faint hover:bg-red-500/10 hover:text-red-500"
                    title="Revoke invite"
                    onClick={() => run(async () => { await api(`/invites/${inv.id}`, { method: "DELETE" }); await loadInvites(); })}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="mt-10 mb-3 flex items-center gap-2 text-sm font-bold text-fg"><Shield size={16} className="text-accent" /> Roles &amp; permissions</h2>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-faint">Permission</th>
              {(Object.keys(ROLE_META) as Role[]).map((r) => (
                <th key={r} className="px-3 py-3 text-center"><RoleBadge role={r} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.label} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5 text-muted">{p.label}</td>
                {(Object.keys(ROLE_META) as Role[]).map((r) => (
                  <td key={r} className="px-3 py-2.5 text-center">
                    {p.roles.includes(r) ? <Check size={16} className="mx-auto text-accent" /> : <span className="text-faint">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} onInvited={loadInvites} />}
      {resent && (
        <Modal title="Invite resent" onClose={() => setResent(null)}>
          <p className="mb-3 text-sm text-muted">
            {resent.emailed ? <>A fresh invite email was sent to <b className="text-fg">{resent.email}</b>. The old link no longer works.</> : <>Share this new link with <b className="text-fg">{resent.email}</b> (the old link no longer works):</>}
          </p>
          <input readOnly value={resent.link} onFocus={(e) => e.target.select()} className="field font-mono text-xs" />
          <div className="mt-5 flex justify-end">
            <button className="btn-accent" onClick={() => { navigator.clipboard.writeText(resent.link); setResent(null); }}>Copy &amp; close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
