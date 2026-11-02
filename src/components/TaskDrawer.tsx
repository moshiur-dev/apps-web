"use client";

import { useEffect, useState } from "react";
import {
  AtSign,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  CircleDot,
  Clock,
  Flag,
  FolderKanban,
  MessageSquare,
  Plus,
  Send,
  Tag,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { api, type Priority, type Status, type TaskDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { Avatar, PRIORITIES, STATUSES, Spinner, priorityMeta, statusMeta, timeAgo, tint } from "./ui";

function Row({ icon: Icon, label, children }: { icon: typeof Flag; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      <span className="flex w-28 shrink-0 items-center gap-2 text-xs font-medium text-faint"><Icon size={14} /> {label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const ctl =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-fg outline-none transition hover:border-line focus:border-accent/50 disabled:hover:border-transparent [&>option]:bg-surface-2";

const dateValue = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA") : "");
const fromDateInput = (v: string) => (v ? new Date(`${v}T12:00:00`).toISOString() : null);

/** Renders @Name mentions as highlighted chips. */
function CommentBody({ text }: { text: string }) {
  return (
    <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">
      {text.split(/(@\w+)/g).map((part, i) =>
        part.startsWith("@") ? <span key={i} className="rounded bg-accent-soft px-1 font-semibold text-accent">{part}</span> : part,
      )}
    </p>
  );
}

export function TaskDrawer() {
  const ws = useWorkspace();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comment, setComment] = useState("");
  const [subtask, setSubtask] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = ws.openTaskId;
  const editable = ws.can.edit;

  useEffect(() => {
    if (!id) {
      setTask(null);
      return;
    }
    api<TaskDetail>(`/tasks/${id}`)
      .then((t) => {
        setTask(t);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [id, ws.taskVersion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && ws.setOpenTaskId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ws]);

  if (!id) return null;

  const close = () => {
    ws.setOpenTaskId(null);
    if (window.location.search.includes("task=")) window.history.replaceState(null, "", window.location.pathname);
  };

  const patch = async (data: Parameters<typeof ws.updateTask>[1]) => {
    if (!task) return;
    const prev = task;
    setTask({ ...task, ...data } as TaskDetail);
    try {
      await ws.updateTask(task.id, data);
    } catch (e) {
      setTask(prev);
      alert((e as Error).message);
    }
  };

  const lists = ws.allLists();
  const assignable = ws.members.filter((m) => m.role !== "GUEST");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={close} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl animate-[fade-up_.25s_ease-out] flex-col border-l border-line bg-surface text-fg shadow-2xl">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted">{error}</p>
            <button className="btn-soft" onClick={close}>Close</button>
          </div>
        ) : !task ? (
          <div className="flex flex-1 items-center justify-center"><Spinner /></div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-line px-6 py-3">
              {task.parent ? (
                <button onClick={() => ws.setOpenTaskId(task.parent!.id)} className="flex min-w-0 items-center gap-1 text-xs font-medium text-muted hover:text-accent">
                  <ChevronLeft size={14} /> <span className="truncate">{task.parent.title}</span>
                </button>
              ) : (
                <span className="flex items-center gap-2 text-xs font-medium text-muted">
                  <FolderKanban size={14} /> {task.list?.name}
                </span>
              )}
              <div className="flex-1" />
              <span className="hidden text-[11px] text-faint sm:inline">Created by {task.creator.name} · {timeAgo(task.createdAt)}</span>
              {editable && (
                <button
                  onClick={async () => {
                    if (!confirm("Delete this task and its subtasks?")) return;
                    await ws.deleteTask(task.id);
                    close();
                  }}
                  className="rounded-lg p-2 text-faint hover:bg-red-500/10 hover:text-red-500"
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={close} className="rounded-lg p-2 text-faint hover:bg-surface-3 hover:text-fg"><X size={18} /></button>
            </div>

            <div className="scrollbar-thin dark-scroll flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    disabled={!editable}
                    onClick={() => patch({ status: s.id as Status })}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition disabled:cursor-default ${task.status === s.id ? "" : "border-line text-faint hover:text-fg"}`}
                    style={task.status === s.id ? tint(s.color) : undefined}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <input
                key={task.id + task.title}
                defaultValue={task.title}
                readOnly={!editable}
                onBlur={(e) => e.target.value.trim() && e.target.value !== task.title && patch({ title: e.target.value.trim() })}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="w-full rounded-lg bg-transparent text-2xl font-extrabold tracking-tight text-fg outline-none focus:bg-surface-2"
              />

              <div className="mt-5 grid gap-x-6 gap-y-1 rounded-2xl border border-line bg-surface-2/50 p-4 sm:grid-cols-2">
                <Row icon={CircleDot} label="Status">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusMeta(task.status).color }} />
                  <span className="ml-2 text-sm font-medium">{statusMeta(task.status).label}</span>
                </Row>
                <Row icon={UserIcon} label="Assignee">
                  <div className="flex items-center gap-1">
                    <Avatar user={task.assignee} size={22} />
                    <select
                      disabled={!editable}
                      value={task.assigneeId ?? ""}
                      onChange={(e) => {
                        const assigneeId = e.target.value || null;
                        setTask({ ...task, assigneeId, assignee: ws.members.find((m) => m.id === assigneeId) ?? null });
                        ws.updateTask(task.id, { assigneeId }).catch((err) => alert(err.message));
                      }}
                      className={ctl}
                    >
                      <option value="">Unassigned</option>
                      {assignable.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </Row>
                <Row icon={Flag} label="Priority">
                  <div className="flex items-center gap-1">
                    <Flag size={14} fill={priorityMeta(task.priority).color} stroke={priorityMeta(task.priority).color} className="ml-1 shrink-0" />
                    <select disabled={!editable} value={task.priority} onChange={(e) => patch({ priority: e.target.value as Priority })} className={ctl}>
                      {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                </Row>
                <Row icon={FolderKanban} label="List">
                  <select
                    disabled={!editable || !!task.parentId}
                    value={task.listId}
                    onChange={(e) => patch({ listId: e.target.value })}
                    className={ctl}
                  >
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.spaceName} / {l.name}</option>)}
                  </select>
                </Row>
                <Row icon={CalendarClock} label="Start date">
                  <input type="date" disabled={!editable} value={dateValue(task.startDate)} onChange={(e) => patch({ startDate: fromDateInput(e.target.value) })} className={ctl} />
                </Row>
                <Row icon={CalendarDays} label="Due date">
                  <input type="date" disabled={!editable} value={dateValue(task.dueDate)} onChange={(e) => patch({ dueDate: fromDateInput(e.target.value) })} className={ctl} />
                </Row>
                <Row icon={Clock} label="Estimate">
                  <div className="flex items-center gap-1">
                    <input
                      key={task.id + "est"}
                      type="number"
                      min={0}
                      step={0.5}
                      disabled={!editable}
                      defaultValue={task.timeEstimate ? task.timeEstimate / 60 : ""}
                      onBlur={(e) => {
                        const minutes = e.target.value ? Math.round(Number(e.target.value) * 60) : null;
                        if (minutes !== task.timeEstimate) patch({ timeEstimate: minutes });
                      }}
                      placeholder="0"
                      className={`${ctl} w-20`}
                    />
                    <span className="text-xs text-faint">hours</span>
                  </div>
                </Row>
                <Row icon={Tag} label="Tags">
                  <div className="flex flex-wrap items-center gap-1">
                    {task.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                        #{t}
                        {editable && <button onClick={() => patch({ tags: task.tags.filter((x) => x !== t) })} className="text-faint hover:text-red-500"><X size={11} /></button>}
                      </span>
                    ))}
                    {editable && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const t = tag.trim().replace(/^#/, "");
                          if (t && !task.tags.includes(t)) patch({ tags: [...task.tags, t] });
                          setTag("");
                        }}
                      >
                        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="+ tag" className="w-16 bg-transparent text-xs text-fg outline-none placeholder:text-faint" />
                      </form>
                    )}
                  </div>
                </Row>
              </div>

              <h3 className="mt-7 mb-2 text-sm font-bold">Description</h3>
              <textarea
                key={task.id + "desc"}
                defaultValue={task.description}
                readOnly={!editable}
                onBlur={(e) => e.target.value !== task.description && patch({ description: e.target.value })}
                placeholder={editable ? "Add more detail, links or acceptance criteria…" : "No description"}
                rows={4}
                className="field resize-y"
              />

              {!task.parentId && (
                <>
                  <h3 className="mt-7 mb-2 flex items-center gap-2 text-sm font-bold">
                    Subtasks
                    <span className="rounded-full bg-surface-3 px-2 text-xs text-muted">
                      {task.subtasks.filter((s) => s.status === "DONE").length}/{task.subtasks.length}
                    </span>
                  </h3>
                  {task.subtasks.length > 0 && (
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${(task.subtasks.filter((s) => s.status === "DONE").length / task.subtasks.length) * 100}%` }}
                      />
                    </div>
                  )}
                  <div className="rounded-xl border border-line">
                    {task.subtasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0 hover:bg-surface-2">
                        <input
                          type="checkbox"
                          disabled={!editable}
                          checked={s.status === "DONE"}
                          onChange={(e) => ws.updateTask(s.id, { status: e.target.checked ? "DONE" : "TODO" })}
                          className="h-4 w-4 accent-[#10b981]"
                        />
                        <button onClick={() => ws.setOpenTaskId(s.id)} className={`flex-1 text-left text-sm hover:text-accent ${s.status === "DONE" ? "text-faint line-through" : ""}`}>
                          {s.title}
                        </button>
                        <Avatar user={s.assignee} size={22} />
                      </div>
                    ))}
                    {editable && (
                      <form
                        className="flex items-center gap-2 px-3 py-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!subtask.trim()) return;
                          await ws.createTask(task.listId, { title: subtask.trim(), parentId: task.id });
                          setSubtask("");
                        }}
                      >
                        <Plus size={15} className="text-faint" />
                        <input value={subtask} onChange={(e) => setSubtask(e.target.value)} placeholder="Add a subtask" className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
                      </form>
                    )}
                    {!editable && task.subtasks.length === 0 && <p className="px-3 py-2 text-sm text-faint">No subtasks</p>}
                  </div>
                </>
              )}

              <h3 className="mt-7 mb-3 flex items-center gap-2 text-sm font-bold">
                <MessageSquare size={15} /> Comments
              </h3>
              <div className="space-y-4">
                {task.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar user={c.author} size={30} />
                    <div className="flex-1 rounded-xl rounded-tl-sm border border-line bg-surface-2 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold">{c.author.name}</span>
                        <span className="text-faint">{timeAgo(c.createdAt)}</span>
                      </div>
                      <CommentBody text={c.body} />
                    </div>
                  </div>
                ))}
                {task.comments.length === 0 && <p className="text-sm text-faint">No comments yet. Start the conversation.</p>}
              </div>
            </div>

            <form
              className="border-t border-line px-6 py-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                try {
                  await api(`/tasks/${task.id}/comments`, { method: "POST", body: { body: comment.trim() } });
                  setComment("");
                  ws.touchTasks();
                } catch (err) {
                  alert((err as Error).message);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar user={user} size={30} />
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment… use @Name to mention" className="field" />
                <button className="btn-accent px-3"><Send size={16} /></button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 pl-11">
                {ws.members.filter((m) => m.id !== user?.id).slice(0, 6).map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setComment((c) => `${c}${c && !c.endsWith(" ") ? " " : ""}@${m.name.split(" ")[0]} `)}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[11px] text-faint hover:border-accent/40 hover:text-accent"
                  >
                    <AtSign size={10} /> {m.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </form>
          </>
        )}
      </aside>
    </>
  );
}
