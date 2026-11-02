"use client";

import { PRIORITIES, PageHeader, STATUSES, Spinner } from "@/components/ui";
import { useTasks } from "@/lib/useTasks";
import { useWorkspace } from "@/lib/workspace";

function Donut({ parts, total }: { parts: { label: string; value: number; color: string }[]; total: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 200 200" className="h-52 w-52">
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="24" />
      {total > 0 &&
        parts.map((p) => {
          const len = (p.value / total) * c;
          const el = (
            <circle
              key={p.label}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="24"
              strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
            >
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      <text x="100" y="98" textAnchor="middle" fill="var(--fg)" className="text-4xl font-extrabold">{total}</text>
      <text x="100" y="122" textAnchor="middle" fill="var(--faint)" className="text-xs">tasks</text>
    </svg>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-muted">{r.label}</span>
            <span className="font-bold text-fg">{r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const ws = useWorkspace();
  const { tasks, loading } = useTasks(ws.current ? `/workspaces/${ws.current.id}/tasks` : null);

  if (loading) return <div className="flex justify-center py-32"><Spinner /></div>;

  const byStatus = STATUSES.map((s) => ({ label: s.label, color: s.color, value: tasks.filter((t) => t.status === s.id).length }));
  const byPriority = PRIORITIES.map((p) => ({ label: p.label, color: p.color, value: tasks.filter((t) => t.priority === p.id && t.status !== "DONE").length }));
  const workload = [
    ...ws.members
      .filter((m) => m.role !== "GUEST")
      .map((m) => ({ label: m.name, color: m.avatarColor, value: tasks.filter((t) => t.assigneeId === m.id && t.status !== "DONE").length })),
    { label: "Unassigned", color: "#5d7868", value: tasks.filter((t) => !t.assigneeId && t.status !== "DONE").length },
  ];
  const lists = ws.current?.spaces.flatMap((s) => s.lists.map((l) => ({ ...l, color: s.color }))) ?? [];
  const done = tasks.filter((t) => t.status === "DONE").length;
  const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const hours = Math.round(tasks.filter((t) => t.status !== "DONE").reduce((s, t) => s + (t.timeEstimate ?? 0), 0) / 6) / 10;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <PageHeader title="Dashboard" subtitle={<>A live view of how <span className="font-semibold text-accent">{ws.current?.name}</span> is growing.</>} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel p-6">
          <h2 className="font-bold text-fg">Tasks by status</h2>
          <div className="mt-2 flex justify-center"><Donut parts={byStatus} total={tasks.length} /></div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {byStatus.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded" style={{ background: s.color }} />
                <span className="text-muted">{s.label}</span>
                <span className="ml-auto font-bold text-fg">{s.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="mb-5 font-bold text-fg">Open work by priority</h2>
          <Bars rows={byPriority} />
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-6">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-bold text-fg">Completion rate</h2>
            <div className="mt-6 font-display text-7xl font-semibold text-gradient">{rate}%</div>
            <p className="mt-2 text-sm text-muted">{done} of {tasks.length} tasks completed</p>
            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-gradient-to-r from-[#34d399] via-[#9bc53d] to-[#e9b949]" style={{ width: `${rate}%` }} />
            </div>
            <p className="mt-5 text-xs text-faint">{hours} h of estimated work remaining</p>
          </div>
        </section>

        <section className="panel p-6 lg:col-span-2">
          <h2 className="mb-5 font-bold text-fg">Progress by list</h2>
          <div className="space-y-4">
            {lists.map((l) => {
              const lt = tasks.filter((t) => t.listId === l.id);
              const pct = lt.length ? Math.round((lt.filter((t) => t.status === "DONE").length / lt.length) * 100) : 0;
              return (
                <div key={l.id} className="flex items-center gap-4">
                  <span className="w-40 truncate text-sm font-medium text-muted">{l.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.color }} />
                  </div>
                  <span className="w-20 text-right text-xs text-faint">{pct}% · {lt.length}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="mb-5 font-bold text-fg">Workload</h2>
          <Bars rows={workload} />
        </section>
      </div>
    </div>
  );
}
