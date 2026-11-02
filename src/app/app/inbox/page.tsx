"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AtSign, Bell, CheckCheck, CircleDot, MessageSquare, ShieldCheck, UserPlus, UserRoundCheck } from "lucide-react";
import { api, type Notification } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import { Avatar, EmptyState, PageHeader, Spinner, timeAgo } from "@/components/ui";

const ICONS: Record<Notification["type"], { icon: typeof Bell; color: string }> = {
  ASSIGNED: { icon: UserRoundCheck, color: "#34d399" },
  COMMENT: { icon: MessageSquare, color: "#5aa2e8" },
  MENTION: { icon: AtSign, color: "#e9b949" },
  INVITE: { icon: UserPlus, color: "#2fb6a4" },
  ROLE: { icon: ShieldCheck, color: "#d0708a" },
  STATUS: { icon: CircleDot, color: "#9bc53d" },
};

export default function InboxPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const load = () => api<{ items: Notification[] }>("/notifications").then((r) => setItems(r.items));
  useEffect(() => {
    load();
  }, [ws.unread]);

  const open = async (n: Notification) => {
    if (!n.read) {
      await api(`/notifications/${n.id}/read`, { method: "POST" });
      ws.refreshUnread();
    }
    if (!n.link) return;
    const url = new URL(n.link, window.location.origin);
    const task = url.searchParams.get("task");
    if (url.pathname.startsWith("/invite/")) return router.push(url.pathname);
    router.push(url.pathname);
    if (task) ws.setOpenTaskId(task);
  };

  const shown = (items ?? []).filter((n) => tab === "all" || !n.read);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
      <PageHeader
        title="Inbox"
        subtitle="Assignments, mentions, comments and invites — all in one place."
        actions={
          <button
            className="btn-soft"
            disabled={!ws.unread}
            onClick={async () => {
              await api("/notifications/read-all", { method: "POST" });
              ws.refreshUnread();
              load();
            }}
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        }
      />
      <div className="mb-4 flex gap-1 border-b border-line">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 pb-2.5 text-sm font-semibold capitalize ${tab === t ? "border-accent text-accent" : "border-transparent text-faint hover:text-fg"}`}
          >
            {t} {t === "unread" && ws.unread > 0 && <span className="ml-1 rounded-full bg-accent-strong px-1.5 text-[10px] text-accent-fg">{ws.unread}</span>}
          </button>
        ))}
      </div>
      {!items ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : shown.length === 0 ? (
        <EmptyState icon={<Bell size={22} />} title={tab === "unread" ? "You're all caught up" : "No notifications yet"} text="You'll hear about tasks assigned to you, @mentions, comments on your tasks and invites." />
      ) : (
        <div className="panel divide-y divide-line overflow-hidden">
          {shown.map((n) => {
            const meta = ICONS[n.type];
            const Icon = meta.icon;
            return (
              <button key={n.id} onClick={() => open(n)} className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-surface-2 ${n.read ? "" : "bg-accent-soft/40"}`}>
                <div className="relative">
                  <Avatar user={n.actor} size={36} />
                  <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-surface" style={{ background: meta.color }}>
                    <Icon size={11} className="text-black/80" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read ? "text-muted" : "font-semibold text-fg"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 truncate text-sm text-faint">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-faint">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
