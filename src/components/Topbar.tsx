"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu as MenuIcon, Plus, Search, UserPlus } from "lucide-react";
import { api, type Role, type Status, type User } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import { InviteModal, NewTaskModal } from "./Modals";
import { Avatar, RoleBadge, statusMeta } from "./ui";

interface Results {
  tasks: { id: string; title: string; status: Status; list: { name: string } }[];
  lists: { id: string; name: string; space: string }[];
  members: (User & { role: Role })[];
}

function SearchBox() {
  const ws = useWorkspace();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Results | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2 || !ws.current) {
      setRes(null);
      return;
    }
    const t = setTimeout(() => {
      api<Results>(`/workspaces/${ws.current!.id}/search?q=${encodeURIComponent(q.trim())}`).then(setRes).catch(() => setRes(null));
    }, 220);
    return () => clearTimeout(t);
  }, [q, ws.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        box.current?.querySelector("input")?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, []);

  const empty = res && !res.tasks.length && !res.lists.length && !res.members.length;
  const go = (fn: () => void) => {
    fn();
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={box} className="relative max-w-lg flex-1">
      <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search tasks, lists, members…"
        className="w-full rounded-xl border border-line bg-surface-2 py-2 pr-14 pl-10 text-sm text-fg outline-none transition placeholder:text-faint focus:border-accent/50"
      />
      <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-faint sm:block">Ctrl K</kbd>
      {open && res && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-surface-2 p-2 shadow-2xl">
          {empty && <p className="px-3 py-4 text-center text-sm text-muted">No results for “{q}”</p>}
          {!!res.tasks.length && <p className="label-xs px-2 pt-1 pb-1.5">Tasks</p>}
          {res.tasks.map((t) => (
            <button key={t.id} onClick={() => go(() => ws.setOpenTaskId(t.id))} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface-3">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusMeta(t.status).color }} />
              <span className="flex-1 truncate text-sm text-fg">{t.title}</span>
              <span className="text-xs text-faint">{t.list.name}</span>
            </button>
          ))}
          {!!res.lists.length && <p className="label-xs px-2 pt-3 pb-1.5">Lists</p>}
          {res.lists.map((l) => (
            <button key={l.id} onClick={() => go(() => router.push(`/app/list/${l.id}`))} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface-3">
              <span className="flex-1 truncate text-sm text-fg">{l.name}</span>
              <span className="text-xs text-faint">{l.space}</span>
            </button>
          ))}
          {!!res.members.length && <p className="label-xs px-2 pt-3 pb-1.5">Members</p>}
          {res.members.map((m) => (
            <button key={m.id} onClick={() => go(() => router.push("/app/members"))} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface-3">
              <Avatar user={m} size={22} />
              <span className="flex-1 truncate text-sm text-fg">{m.name}</span>
              <RoleBadge role={m.role} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const ws = useWorkspace();
  const [invite, setInvite] = useState(false);
  const [newTask, setNewTask] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur sm:px-6">
      <button className="rounded-lg p-2 text-muted hover:bg-surface-3 lg:hidden" onClick={onMenu}>
        <MenuIcon size={18} />
      </button>
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        {ws.can.manage && (
          <button className="btn-soft hidden sm:inline-flex" onClick={() => setInvite(true)}>
            <UserPlus size={15} /> Invite
          </button>
        )}
        {ws.can.edit && (
          <button className="btn-accent" onClick={() => setNewTask(true)}>
            <Plus size={16} /> <span className="hidden sm:inline">New Task</span>
          </button>
        )}
        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <Link href="/app/inbox" className="relative rounded-lg p-2 text-muted transition hover:bg-surface-3 hover:text-fg" title="Inbox">
          <Bell size={18} />
          {ws.unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-strong px-1 text-[9px] font-bold text-accent-fg">
              {ws.unread > 9 ? "9+" : ws.unread}
            </span>
          )}
        </Link>
      </div>
      {invite && <InviteModal onClose={() => setInvite(false)} />}
      {newTask && <NewTaskModal onClose={() => setNewTask(false)} />}
    </header>
  );
}
