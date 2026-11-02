"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";
import { api, type Activity } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTasks } from "@/lib/useTasks";
import { useWorkspace } from "@/lib/workspace";
import { Avatar, DueDate, EmptyState, PriorityBadge, RoleBadge, Spinner, statusMeta, timeAgo, tint } from "@/components/ui";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function HomePage() {
  const { user } = useAuth();
  const ws = useWorkspace();
  const { tasks, loading } = useTasks(ws.current ? `/workspaces/${ws.current.id}/tasks` : null);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (!ws.current) return;
    api<Activity[]>(`/workspaces/${ws.current.id}/activity?take=8`).then(setActivity).catch(() => setActivity([]));
  }, [ws.current?.id, ws.taskVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date(new Date().toDateString()).getTime();
  const open = tasks.filter((t) => t.status !== "DONE");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < today);
  const mine = open
    .filter((t) => t.assigneeId === user?.id)
    .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"))
    .slice(0, 7);

  const stats = [
    { label: "Open tasks", value: open.length, icon: Layers, color: "#34d399" },
    { label: "In progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length, icon: Clock, color: "#e9b949" },
    { label: "Overdue", value: overdue.length, icon: AlertCircle, color: "#f05d4f" },
    { label: "Completed", value: tasks.filter((t) => t.status === "DONE").length, icon: CheckCircle2, color: "#2fb6a4" },
  ];

  const firstList = ws.current?.spaces.flatMap((s) => s.lists)[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface px-8 py-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#9bc53d]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Sparkles size={15} className="text-amber-400" />
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{greeting()}, {user?.name.split(" ")[0]} 🌿</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-muted">
              You have <b className="text-fg">{mine.length}</b> open task{mine.length === 1 ? "" : "s"}
              {overdue.length > 0 && <> · <b className="text-red-500">{overdue.length} overdue</b> in the workspace</>}
              {ws.current && <> · <RoleBadge role={ws.current.role} /></>}
            </p>
          </div>
          {firstList && (
            <Link href={`/app/list/${firstList.id}`} className="btn-accent">
              Open {firstList.name} <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="panel flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={tint(color)}>
              <Icon size={22} />
            </span>
            <div>
              <div className="text-3xl font-extrabold text-fg">{loading ? "–" : value}</div>
              <div className="text-sm text-muted">{label}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="panel p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-fg">My work</h2>
            <Link href="/app/my-tasks" className="text-sm font-semibold text-accent hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : mine.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22} />} title="All clear!" text="Nothing is assigned to you right now." />
          ) : (
            <ul className="space-y-1">
              {mine.map((t) => (
                <li key={t.id}>
                  <button onClick={() => ws.setOpenTaskId(t.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusMeta(t.status).color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{t.title}</span>
                      <span className="text-xs text-faint">{t.list?.name}</span>
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <span className="w-20 text-right"><DueDate due={t.dueDate} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-fg">Recent activity</h2>
            <Link href="/app/activity" className="text-sm font-semibold text-accent hover:underline">Audit log</Link>
          </div>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3">
                <Avatar user={a.actor} size={26} />
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
                  <b className="text-fg">{a.actor.name.split(" ")[0]}</b> {a.action.split(".")[1].replace("_", " ")} <span className="text-fg">{a.target}</span>
                  <span className="block text-[11px] text-faint">{timeAgo(a.createdAt)}</span>
                </p>
              </li>
            ))}
            {activity.length === 0 && <p className="text-sm text-faint">No activity yet.</p>}
          </ul>
        </section>
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="mb-4 font-bold text-fg">Spaces</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ws.current?.spaces.map((space) => {
            const listIds = new Set(space.lists.map((l) => l.id));
            const st = tasks.filter((t) => listIds.has(t.listId));
            const pct = st.length ? Math.round((st.filter((t) => t.status === "DONE").length / st.length) * 100) : 0;
            return (
              <div key={space.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: space.color }}>{space.name[0]}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-fg">{space.name}</div>
                    <div className="text-xs text-faint">{space.folders.length} folders · {space.lists.length} lists · {st.length} tasks</div>
                  </div>
                  <span className="text-sm font-bold text-accent">{pct}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: space.color }} />
                </div>
              </div>
            );
          })}
          {ws.current?.spaces.length === 0 && <p className="text-sm text-muted">No spaces yet{ws.can.manage ? " — create one from the sidebar." : "."}</p>}
        </div>
      </section>
    </div>
  );
}
