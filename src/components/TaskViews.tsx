"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Filter,
  GitBranch,
  MessageSquare,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { Priority, Status, Task } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { NewTaskModal } from "./Modals";
import { Avatar, DueDate, PRIORITIES, PriorityBadge, PriorityFlag, STATUSES, priorityMeta, statusMeta, tint } from "./ui";

// ---------------- Filters ----------------

export interface Filters {
  q: string;
  priorities: Priority[];
  assignee: "all" | "me" | "none" | string;
  hideDone: boolean;
}

export const emptyFilters: Filters = { q: "", priorities: [], assignee: "all", hideDone: false };

export function useFiltered(tasks: Task[], f: Filters) {
  const { user } = useAuth();
  return useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.tags.some((g) => g.toLowerCase().includes(q))) return false;
      if (f.priorities.length && !f.priorities.includes(t.priority)) return false;
      if (f.hideDone && t.status === "DONE") return false;
      if (f.assignee === "me" && t.assigneeId !== user?.id) return false;
      if (f.assignee === "none" && t.assigneeId) return false;
      if (!["all", "me", "none"].includes(f.assignee) && t.assigneeId !== f.assignee) return false;
      return true;
    });
  }, [tasks, f, user?.id]);
}

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const ws = useWorkspace();
  const active = value.q || value.priorities.length || value.assignee !== "all" || value.hideDone;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
        <input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="Filter tasks or #tags"
          className="w-48 rounded-lg border border-line bg-surface-2 py-1.5 pr-2 pl-8 text-xs text-fg outline-none placeholder:text-faint focus:border-accent/50"
        />
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
        <Filter size={13} className="mx-1.5 text-faint" />
        {PRIORITIES.map((p) => {
          const on = value.priorities.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() =>
                onChange({ ...value, priorities: on ? value.priorities.filter((x) => x !== p.id) : [...value.priorities, p.id] })
              }
              className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase transition ${on ? "" : "border-transparent text-faint hover:text-fg"}`}
              style={on ? tint(p.color) : undefined}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <select
        value={value.assignee}
        onChange={(e) => onChange({ ...value, assignee: e.target.value })}
        className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs text-fg outline-none [&>option]:bg-surface-2"
      >
        <option value="all">Everyone</option>
        <option value="me">Assigned to me</option>
        <option value="none">Unassigned</option>
        {ws.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-muted">
        <input type="checkbox" checked={value.hideDone} onChange={(e) => onChange({ ...value, hideDone: e.target.checked })} className="accent-[#10b981]" />
        Hide completed
      </label>
      {active && (
        <button onClick={() => onChange(emptyFilters)} className="flex items-center gap-1 text-xs text-faint hover:text-red-500">
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}

// ---------------- Shared bits ----------------

function QuickAdd({ listId, status, compact = false }: { listId: string; status: Status; compact?: boolean }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  if (!ws.can.edit) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-2 text-xs font-medium text-faint transition hover:text-accent ${compact ? "rounded-xl border border-dashed border-line px-3 py-2.5 hover:border-accent/40" : "px-4 py-2.5 hover:bg-surface-2"}`}
      >
        <Plus size={14} /> Add task
      </button>
    );
  }
  return (
    <form
      className={compact ? "rounded-xl border border-accent/40 bg-surface-2 p-2.5" : "px-4 py-2"}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await ws.createTask(listId, { title: title.trim(), status }).catch((err) => alert(err.message));
        setTitle("");
      }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !title && setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Task name — Enter to save"
        className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
      />
    </form>
  );
}

function Counts({ task }: { task: Task }) {
  const subs = task._count?.subtasks ?? 0;
  const comments = task._count?.comments ?? 0;
  return (
    <span className="flex items-center gap-2 text-[11px] text-faint">
      {subs > 0 && <span className="flex items-center gap-0.5"><GitBranch size={11} /> {subs}</span>}
      {comments > 0 && <span className="flex items-center gap-0.5"><MessageSquare size={11} /> {comments}</span>}
    </span>
  );
}

// ---------------- List view ----------------

export function ListView({ tasks, listId, showList = false }: { tasks: Task[]; listId?: string; showList?: boolean }) {
  const ws = useWorkspace();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      {STATUSES.map((s) => {
        const group = tasks.filter((t) => t.status === s.id);
        if (!listId && group.length === 0) return null;
        const isCollapsed = collapsed[s.id];
        return (
          <section key={s.id}>
            <button onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))} className="mb-2 flex items-center gap-2">
              {isCollapsed ? <ChevronRight size={15} className="text-faint" /> : <ChevronDown size={15} className="text-faint" />}
              <span className="rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide" style={tint(s.color)}>{s.label}</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-3 px-1.5 text-[11px] font-bold text-muted">{group.length}</span>
            </button>
            {!isCollapsed && (
              <div className="panel overflow-hidden">
                <div className="hidden grid-cols-[1fr_150px_110px_100px] gap-4 border-b border-line bg-surface-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-faint md:grid">
                  <span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span>
                </div>
                {group.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => ws.setOpenTaskId(t.id)}
                    className="group grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-4 py-2.5 transition last:border-0 hover:bg-surface-2 md:grid-cols-[1fr_150px_110px_100px]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        disabled={!ws.can.edit}
                        onClick={(e) => {
                          e.stopPropagation();
                          ws.updateTask(t.id, { status: t.status === "DONE" ? "TODO" : "DONE" });
                        }}
                        className="shrink-0 disabled:cursor-default"
                        title={t.status === "DONE" ? "Mark as to do" : "Mark complete"}
                      >
                        {t.status === "DONE" ? (
                          <CheckCircle2 size={17} className="text-accent" />
                        ) : (
                          <Circle size={17} style={{ color: s.color }} className="transition group-hover:scale-110" />
                        )}
                      </button>
                      <span className={`truncate text-sm font-medium ${t.status === "DONE" ? "text-faint line-through" : "text-fg"}`}>{t.title}</span>
                      {t.tags.slice(0, 2).map((g) => (
                        <span key={g} className="hidden shrink-0 rounded border border-line bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-accent sm:inline">#{g}</span>
                      ))}
                      {showList && t.list && <span className="hidden shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted lg:inline">{t.list.name}</span>}
                      <Counts task={t} />
                    </div>
                    <div className="flex items-center gap-2 md:contents">
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <Avatar user={t.assignee} size={22} />
                        <span className="hidden truncate text-xs lg:inline">{t.assignee?.name.split(" ")[0]}</span>
                      </span>
                      <span className="hidden md:block"><DueDate due={t.dueDate} done={t.status === "DONE"} /></span>
                      <span className="hidden md:block"><PriorityFlag priority={t.priority} showLabel /></span>
                    </div>
                  </div>
                ))}
                {listId && <QuickAdd listId={listId} status={s.id} />}
                {group.length === 0 && !ws.can.edit && <p className="px-4 py-3 text-sm text-faint">Nothing here.</p>}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------- Board view ----------------

function Card({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const ws = useWorkspace();
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-CA") : null;
  return (
    <div className={`rounded-xl border bg-surface-2 p-3.5 transition ${overlay ? "rotate-2 border-accent/60 shadow-2xl shadow-black/40" : "border-line hover:border-line-strong"}`}>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <select
          value={task.status}
          disabled={!ws.can.edit}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => ws.updateTask(task.id, { status: e.target.value as Status })}
          className="cursor-pointer appearance-none bg-transparent pr-1 text-right text-[11px] text-faint outline-none hover:text-fg disabled:cursor-default [&>option]:bg-surface-2 [&>option]:text-fg"
        >
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className={`mt-2.5 text-[13.5px] font-semibold leading-snug ${task.status === "DONE" ? "text-faint line-through" : "text-fg"}`}>{task.title}</div>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        {task.tags[0] ? (
          <span className="rounded-md border border-line bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-accent">#{task.tags[0]}</span>
        ) : (
          <Counts task={task} />
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <Avatar user={task.assignee} size={20} />
          {due && <span className={`text-[11px] ${task.status !== "DONE" && new Date(task.dueDate!) < new Date(new Date().toDateString()) ? "text-red-500" : "text-muted"}`}>{due}</span>}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ task }: { task: Task }) {
  const ws = useWorkspace();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: !ws.can.edit });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => ws.setOpenTaskId(task.id)}
      className={`${ws.can.edit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "opacity-30" : ""}`}
    >
      <Card task={task} />
    </div>
  );
}

function Column({ status, tasks, listId }: { status: (typeof STATUSES)[number]; tasks: Task[]; listId?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[60vh] w-[290px] shrink-0 flex-col rounded-2xl border p-3 transition ${isOver ? "border-accent/50 bg-accent-soft" : "border-line bg-surface/60"}`}
    >
      <div className="mb-3 flex items-center gap-2 px-1 pt-1">
        <span className="rounded-md border px-2 py-0.5 text-[11px] font-bold" style={tint(status.color)}>{status.label}</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-3 px-1.5 text-[11px] font-bold text-muted">{tasks.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.map((t) => <DraggableCard key={t.id} task={t} />)}
        {listId && <QuickAdd listId={listId} status={status.id} compact />}
      </div>
    </div>
  );
}

export function BoardView({ tasks, listId, onLocalMove }: { tasks: Task[]; listId?: string; onLocalMove: (id: string, patch: Partial<Task>) => void }) {
  const ws = useWorkspace();
  const [activeId, setActiveId] = useState<string | null>(null);
  // A small distance threshold keeps plain clicks opening the drawer
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const active = tasks.find((t) => t.id === activeId);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const status = e.over?.id as Status | undefined;
    const task = tasks.find((t) => t.id === e.active.id);
    if (!status || !task || task.status === status) return;
    onLocalMove(task.id, { status });
    ws.updateTask(task.id, { status }).catch((err) => alert(err.message));
  };

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="scrollbar-thin dark-scroll flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((s) => (
          <Column key={s.id} status={s} tasks={tasks.filter((t) => t.status === s.id)} listId={listId} />
        ))}
      </div>
      <DragOverlay>{active && <Card task={active} overlay />}</DragOverlay>
    </DndContext>
  );
}

// ---------------- Calendar view ----------------

const dayKey = (d: Date) => d.toLocaleDateString("en-CA");
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarChip({ task }: { task: Task }) {
  const ws = useWorkspace();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: !ws.can.edit });
  const color = priorityMeta(task.priority).color;
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        ws.setOpenTaskId(task.id);
      }}
      className={`flex w-full items-center gap-1.5 truncate rounded-md border-l-2 bg-surface-3 px-1.5 py-1 text-left text-[11px] font-medium transition hover:brightness-125 ${task.status === "DONE" ? "text-faint line-through" : "text-fg"} ${isDragging ? "opacity-30" : ""}`}
      style={{ borderColor: color }}
      title={task.title}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusMeta(task.status).color }} />
      <span className="truncate">{task.title}</span>
    </button>
  );
}

function DayCell({
  date,
  inMonth,
  tasks,
  onAdd,
}: {
  date: Date;
  inMonth: boolean;
  tasks: Task[];
  onAdd?: (day: string) => void;
}) {
  const key = dayKey(date);
  const { setNodeRef, isOver } = useDroppable({ id: key });
  const [expanded, setExpanded] = useState(false);
  const isToday = key === dayKey(new Date());
  const shown = expanded ? tasks : tasks.slice(0, 3);
  return (
    <div
      ref={setNodeRef}
      className={`group relative min-h-28 border-r border-b border-line p-1.5 transition ${inMonth ? "" : "bg-surface-2/40"} ${isOver ? "bg-accent-soft" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-accent-strong text-accent-fg" : inMonth ? "text-muted" : "text-faint/60"}`}
        >
          {date.getDate()}
        </span>
        {onAdd && (
          <button onClick={() => onAdd(key)} className="rounded p-0.5 text-faint opacity-0 transition group-hover:opacity-100 hover:text-accent" title="Add task">
            <Plus size={13} />
          </button>
        )}
      </div>
      <div className="space-y-1">
        {shown.map((t) => <CalendarChip key={t.id} task={t} />)}
        {tasks.length > 3 && (
          <button onClick={() => setExpanded((x) => !x)} className="px-1 text-[10px] font-semibold text-faint hover:text-accent">
            {expanded ? "Show less" : `+${tasks.length - 3} more`}
          </button>
        )}
      </div>
    </div>
  );
}

export function CalendarView({
  tasks,
  listId,
  onLocalMove,
}: {
  tasks: Task[];
  listId?: string;
  onLocalMove: (id: string, patch: Partial<Task>) => void;
}) {
  const ws = useWorkspace();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [addDay, setAddDay] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1 - ((cursor.getDay() + 6) % 7)); // back to Monday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      (map[dayKey(new Date(t.dueDate))] ??= []).push(t);
    }
    return map;
  }, [tasks]);

  const unscheduled = tasks.filter((t) => !t.dueDate && t.status !== "DONE");
  const active = tasks.find((t) => t.id === activeId);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const day = e.over?.id as string | undefined;
    const task = tasks.find((t) => t.id === e.active.id);
    if (!day || !task) return;
    if (task.dueDate && dayKey(new Date(task.dueDate)) === day) return;
    const dueDate = new Date(`${day}T12:00:00`).toISOString();
    onLocalMove(task.id, { dueDate });
    ws.updateTask(task.id, { dueDate }).catch((err) => alert(err.message));
  };

  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="panel min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <h3 className="flex-1 text-base font-bold text-fg">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h3>
            <button className="btn-soft px-2 py-1.5" onClick={() => shift(-1)}><ChevronLeft size={15} /></button>
            <button
              className="btn-soft px-3 py-1.5 text-xs"
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
              }}
            >
              Today
            </button>
            <button className="btn-soft px-2 py-1.5" onClick={() => shift(1)}><ChevronRight size={15} /></button>
          </div>
          <div className="scrollbar-thin dark-scroll overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-b border-line bg-surface-2">
                {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-faint">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 border-l border-line">
                {days.map((d) => (
                  <DayCell
                    key={dayKey(d)}
                    date={d}
                    inMonth={d.getMonth() === cursor.getMonth()}
                    tasks={byDay[dayKey(d)] ?? []}
                    onAdd={ws.can.edit ? setAddDay : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="panel w-full shrink-0 p-4 xl:w-64">
          <p className="label-xs mb-3">Unscheduled · {unscheduled.length}</p>
          <p className="mb-3 text-xs text-muted">{ws.can.edit ? "Drag a task onto a day to set its due date." : "Tasks without a due date."}</p>
          <div className="space-y-1.5">
            {unscheduled.slice(0, 30).map((t) => <CalendarChip key={t.id} task={t} />)}
            {unscheduled.length === 0 && <p className="text-xs text-faint">Everything has a date 🎉</p>}
          </div>
        </aside>
      </div>
      <DragOverlay>
        {active && (
          <div className="rounded-md border border-accent/60 bg-surface-2 px-2 py-1 text-xs font-medium text-fg shadow-2xl">{active.title}</div>
        )}
      </DragOverlay>
      {addDay && <NewTaskModal defaultListId={listId} defaultDue={addDay} onClose={() => setAddDay(null)} />}
    </DndContext>
  );
}
