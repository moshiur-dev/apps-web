"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { api, type Activity } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import { Avatar, EmptyState, PageHeader, Spinner, timeAgo } from "@/components/ui";

const VERBS: Record<string, { text: string; color: string }> = {
  "workspace.created": { text: "created workspace", color: "#34d399" },
  "workspace.updated": { text: "updated workspace", color: "#5aa2e8" },
  "space.created": { text: "created space", color: "#34d399" },
  "space.deleted": { text: "deleted space", color: "#f05d4f" },
  "folder.created": { text: "created folder", color: "#34d399" },
  "folder.deleted": { text: "deleted folder", color: "#f05d4f" },
  "list.created": { text: "created list", color: "#34d399" },
  "list.deleted": { text: "deleted list", color: "#f05d4f" },
  "task.created": { text: "created task", color: "#34d399" },
  "subtask.created": { text: "added subtask", color: "#34d399" },
  "task.deleted": { text: "deleted task", color: "#f05d4f" },
  "task.status": { text: "changed status of", color: "#e9b949" },
  "task.assigned": { text: "assigned", color: "#5aa2e8" },
  "task.priority": { text: "changed priority of", color: "#f0a43a" },
  "task.due": { text: "changed due date of", color: "#2fb6a4" },
  "comment.added": { text: "commented on", color: "#5aa2e8" },
  "invite.sent": { text: "invited", color: "#2fb6a4" },
  "invite.revoked": { text: "revoked invite for", color: "#f05d4f" },
  "member.joined": { text: "joined the workspace", color: "#34d399" },
  "member.left": { text: "left the workspace", color: "#f05d4f" },
  "member.removed": { text: "removed", color: "#f05d4f" },
  "member.role_changed": { text: "changed role of", color: "#d0708a" },
};

const GROUPS = [
  { id: "all", label: "All" },
  { id: "task", label: "Tasks" },
  { id: "comment", label: "Comments" },
  { id: "member", label: "Members" },
  { id: "invite", label: "Invites" },
  { id: "space", label: "Structure" },
];

export default function ActivityPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const [items, setItems] = useState<Activity[] | null>(null);
  const [group, setGroup] = useState("all");

  useEffect(() => {
    if (!ws.current) return;
    setItems(null);
    api<Activity[]>(`/workspaces/${ws.current.id}/activity?take=200`).then(setItems).catch(() => setItems([]));
  }, [ws.current?.id, ws.taskVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(
    () =>
      (items ?? []).filter((a) => {
        if (group === "all") return true;
        if (group === "space") return /^(space|folder|list|workspace)\./.test(a.action);
        return a.action.startsWith(group);
      }),
    [items, group],
  );

  // Group by calendar day
  const days = useMemo(() => {
    const out: { day: string; items: Activity[] }[] = [];
    for (const a of shown) {
      const day = new Date(a.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      const last = out[out.length - 1];
      if (last?.day === day) last.items.push(a);
      else out.push({ day, items: [a] });
    }
    return out;
  }, [shown]);

  const open = (a: Activity) => {
    if (!a.link) return;
    const url = new URL(a.link, window.location.origin);
    router.push(url.pathname);
    const task = url.searchParams.get("task");
    if (task) ws.setOpenTaskId(task);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
      <PageHeader title="Activity Audit Log" subtitle="Who did what, and when — across the whole workspace." />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGroup(g.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${group === g.id ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-muted hover:text-fg"}`}
          >
            {g.label}
          </button>
        ))}
      </div>
      {!items ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : days.length === 0 ? (
        <EmptyState icon={<ActivityIcon size={22} />} title="No activity yet" />
      ) : (
        days.map(({ day, items: list }) => (
          <section key={day} className="mb-8">
            <p className="label-xs mb-3">{day}</p>
            <ol className="relative ml-4 border-l border-line">
              {list.map((a) => {
                const verb = VERBS[a.action] ?? { text: a.action, color: "#94a39a" };
                return (
                  <li key={a.id} className="relative mb-1 pl-6">
                    <span className="absolute top-4 -left-[5px] h-2.5 w-2.5 rounded-full ring-4 ring-bg" style={{ background: verb.color }} />
                    <button
                      onClick={() => open(a)}
                      disabled={!a.link}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition enabled:hover:bg-surface-2"
                    >
                      <Avatar user={a.actor} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted">
                          <span className="font-semibold text-fg">{a.actor.name}</span> {verb.text}{" "}
                          {!a.action.startsWith("member.joined") && !a.action.startsWith("member.left") && <span className="font-semibold text-fg">“{a.target}”</span>}
                        </p>
                        {a.detail && <p className="mt-0.5 truncate text-xs text-faint">{a.detail}</p>}
                      </div>
                      <span className="shrink-0 text-[11px] text-faint">{timeAgo(a.createdAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}
