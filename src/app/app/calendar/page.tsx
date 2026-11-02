"use client";

import { useState } from "react";
import { CalendarView, FilterBar, emptyFilters, useFiltered } from "@/components/TaskViews";
import { PageHeader, Spinner } from "@/components/ui";
import { useTasks } from "@/lib/useTasks";
import { useWorkspace } from "@/lib/workspace";

export default function CalendarPage() {
  const ws = useWorkspace();
  const { tasks, setTasks, loading } = useTasks(ws.current ? `/workspaces/${ws.current.id}/tasks` : null);
  const [filters, setFilters] = useState(emptyFilters);
  const shown = useFiltered(tasks, filters);

  return (
    <div className="px-4 py-6 sm:px-8">
      <PageHeader
        title="Calendar"
        subtitle={<>Every due date across <span className="font-semibold text-accent">{ws.current?.name}</span></>}
        actions={<FilterBar value={filters} onChange={setFilters} />}
      />
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <CalendarView
          tasks={shown}
          onLocalMove={(id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))}
        />
      )}
    </div>
  );
}
