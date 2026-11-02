"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Columns3, LayoutList } from "lucide-react";
import { BoardView, CalendarView, FilterBar, ListView, emptyFilters, useFiltered } from "@/components/TaskViews";
import { Spinner } from "@/components/ui";
import { useTasks } from "@/lib/useTasks";
import { useWorkspace } from "@/lib/workspace";

const VIEWS = [
  { id: "board", label: "Board", icon: Columns3 },
  { id: "list", label: "List", icon: LayoutList },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
] as const;
type View = (typeof VIEWS)[number]["id"];

export default function ListPage() {
  const { id } = useParams<{ id: string }>();
  const ws = useWorkspace();
  const found = ws.findList(id);
  const { tasks, setTasks, loading } = useTasks(found ? `/lists/${id}/tasks` : null);
  const [view, setView] = useState<View>("board");
  const [filters, setFilters] = useState(emptyFilters);
  const shown = useFiltered(tasks, filters);

  // Remember the last view per browser
  useEffect(() => {
    const saved = localStorage.getItem("canopy.view") as View | null;
    if (saved && VIEWS.some((v) => v.id === saved)) setView(saved);
  }, []);
  const pick = (v: View) => {
    setView(v);
    localStorage.setItem("canopy.view", v);
  };

  if (!found) {
    return <p className="p-10 text-center text-muted">This list doesn&apos;t exist in the current workspace.</p>;
  }

  const done = tasks.filter((t) => t.status === "DONE").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const localMove = (taskId: string, patch: object) => setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs font-medium text-faint">
            {found.space.name}
            {found.folder && <> / {found.folder.name}</>}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-fg">{found.list.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Showing tasks for list: <span className="font-semibold text-accent">{found.list.name}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-muted">{done} of {tasks.length} complete</div>
            <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-line">
        <div className="flex gap-1">
          {VIEWS.map(({ id: v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => pick(v)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${view === v ? "border-accent text-accent" : "border-transparent text-faint hover:text-fg"}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <div className="ml-auto pb-2.5"><FilterBar value={filters} onChange={setFilters} /></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : view === "list" ? (
        <ListView tasks={shown} listId={id} />
      ) : view === "board" ? (
        <BoardView tasks={shown} listId={id} onLocalMove={localMove} />
      ) : (
        <CalendarView tasks={shown} listId={id} onLocalMove={localMove} />
      )}
    </div>
  );
}
