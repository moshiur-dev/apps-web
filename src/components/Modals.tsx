"use client";

import { useState } from "react";
import { Check, Copy, Mail, X } from "lucide-react";
import { api, type Priority, type Role } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import { PRIORITIES, ROLE_META } from "./ui";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="panel w-full max-w-lg p-6 shadow-2xl animate-fade-up" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-faint hover:bg-surface-3 hover:text-fg"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1.5 block text-xs font-semibold text-muted">{children}</span>
);

export function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited?: () => void }) {
  const ws = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ emailed: boolean; link: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const roles: Role[] = ws.can.owner ? ["ADMIN", "MEMBER", "GUEST"] : ["MEMBER", "GUEST"];

  if (result) {
    return (
      <Modal title="Invitation ready" onClose={onClose}>
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm text-fg">
          <Mail className="shrink-0 text-accent" size={20} />
          {result.emailed ? (
            <span>An invite email was sent to <b>{result.email}</b>.</span>
          ) : (
            <span>Email isn&apos;t configured on the server, so share this link with <b>{result.email}</b> yourself.</span>
          )}
        </div>
        <Label>Invite link (expires in 7 days)</Label>
        <div className="flex gap-2">
          <input readOnly value={result.link} className="field font-mono text-xs" onFocus={(e) => e.target.select()} />
          <button
            className="btn-soft shrink-0"
            onClick={async () => {
              await navigator.clipboard.writeText(result.link);
              setCopied(true);
            }}
          >
            {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-soft" onClick={() => { setResult(null); setEmail(""); setCopied(false); }}>Invite another</button>
          <button className="btn-accent" onClick={onClose}>Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Invite people to ${ws.current?.name}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await api<{ emailed: boolean; link: string }>(`/workspaces/${ws.current?.id}/invites`, {
              method: "POST",
              body: { email, role },
            });
            setResult({ ...res, email });
            onInvited?.();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          <Label>Email address</Label>
          <input className="field" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
        </label>
        <div>
          <Label>Role</Label>
          <div className="grid gap-2">
            {roles.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${role === r ? "border-accent/50 bg-accent-soft" : "border-line bg-surface-2 hover:border-line-strong"}`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ROLE_META[r].color }} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-fg">{ROLE_META[r].label}</span>
                  <span className="block text-xs text-muted">{ROLE_META[r].text}</span>
                </span>
                {role === r && <Check size={16} className="text-accent" />}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn-accent" disabled={busy}><Mail size={15} /> Send invite</button>
        </div>
      </form>
    </Modal>
  );
}

export function NewTaskModal({ onClose, defaultListId, defaultDue }: { onClose: () => void; defaultListId?: string; defaultDue?: string }) {
  const ws = useWorkspace();
  const lists = ws.allLists();
  const [listId, setListId] = useState(defaultListId ?? lists[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [assigneeId, setAssigneeId] = useState("");
  const [due, setDue] = useState(defaultDue ?? "");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!lists.length) {
    return (
      <Modal title="New task" onClose={onClose}>
        <p className="text-sm text-muted">Create a list in the sidebar first — tasks live inside lists.</p>
      </Modal>
    );
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const task = await ws.createTask(listId, {
              title,
              description,
              priority,
              assigneeId: assigneeId || null,
              dueDate: due ? new Date(`${due}T12:00:00`).toISOString() : null,
              tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
            });
            onClose();
            ws.setOpenTaskId(task.id);
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        }}
      >
        <input className="field py-2.5 text-base font-semibold" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" />
        <textarea className="field resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        <div className="grid grid-cols-2 gap-3">
          <label>
            <Label>List</Label>
            <select className="field" value={listId} onChange={(e) => setListId(e.target.value)}>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.spaceName} / {l.name}</option>)}
            </select>
          </label>
          <label>
            <Label>Priority</Label>
            <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label>
            <Label>Assignee</Label>
            <select className="field" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {ws.members.filter((m) => m.role !== "GUEST").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>
            <Label>Due date</Label>
            <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <Label>Tags (comma separated)</Label>
          <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="backend, auth" />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn-accent" disabled={busy}>Create task</button>
        </div>
      </form>
    </Modal>
  );
}
