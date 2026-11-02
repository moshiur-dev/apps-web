"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { BoardView, FilterBar, ListView, useFiltered, type Filters } from "@/components/TaskViews";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { useTasks } from "@/lib/useTasks";
import { useWorkspace } from "@/lib/workspace";

export default function MyTasksPage() {
  const ws = useWorkspace();
  const { tasks, setTasks, loading } = useTasks(ws.current ? `/workspaces/${ws.current.id}/tasks` : null);
  const [filters, setFilters] = useState<Filters>({ q: "", priorities: [], assignee: "me", hideDone: false });
  const [view, setView] = useState<"list" | "board">("list");
  const shown = useFiltered(tasks, filters);

  return (
    <div className="px-4 py-6 sm:px-8">
      <PageHeader
        title="My Tasks"
        subtitle={<>Everything on your plate across <span className="font-semibold text-accent">{ws.current?.name}</span></>}
        actions={
          <div className="flex rounded-xl border border-line bg-surface-2 p-1">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${view === v ? "bg-accent-strong text-accent-fg" : "text-muted hover:text-fg"}`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />
      <div className="mb-5"><FilterBar value={filters} onChange={setFilters} /></div>
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : shown.length === 0 ? (
        <EmptyState icon={<ListChecks size={22} />} title="No tasks match" text="Try changing the filters above." />
      ) : view === "list" ? (
        <ListView tasks={shown} showList />
      ) : (
        <BoardView tasks={shown} onLocalMove={(id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))} />
      )}
    </div>
  );
}
