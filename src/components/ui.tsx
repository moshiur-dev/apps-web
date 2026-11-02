"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import type { Priority, Role, Status, User } from "@/lib/api";
import { BRAND } from "@/lib/brand";

export const STATUSES: { id: Status; label: string; color: string }[] = [
  { id: "TODO", label: "To Do", color: "#94a39a" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#e9b949" },
  { id: "REVIEW", label: "In Review", color: "#2fb6a4" },
  { id: "DONE", label: "Completed", color: "#34d399" },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: "URGENT", label: "Urgent", color: "#f05d4f" },
  { id: "HIGH", label: "High", color: "#f0a43a" },
  { id: "NORMAL", label: "Normal", color: "#5aa2e8" },
  { id: "LOW", label: "Low", color: "#94a39a" },
];

export const ROLE_META: Record<Role, { label: string; color: string; text: string }> = {
  OWNER: { label: "Owner", color: "#e9b949", text: "Full control, billing & workspace deletion" },
  ADMIN: { label: "Admin", color: "#34d399", text: "Manage spaces, members and invites" },
  MEMBER: { label: "Member", color: "#5aa2e8", text: "Create and edit tasks, lists and folders" },
  GUEST: { label: "Guest", color: "#94a39a", text: "View everything and comment only" },
};

export const SPACE_COLORS = ["#34d399", "#2fb6a4", "#9bc53d", "#e9b949", "#c08457", "#5aa2e8", "#d0708a"];

export const statusMeta = (s: Status) => STATUSES.find((x) => x.id === s)!;
export const priorityMeta = (p: Priority) => PRIORITIES.find((x) => x.id === p)!;

/** Translucent badge colours that read well on both dark and light surfaces. */
export const tint = (color: string) => ({
  background: `${color}1f`,
  color,
  borderColor: `${color}40`,
});

export function Logo({ light = false, app = false, className = "" }: { light?: boolean; app?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#1f6b45" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#lg)" />
        <path d="M16 6 L24 17 H19 L23 23 H9 L13 17 H8 Z" fill="#fff" opacity=".95" />
        <rect x="14.6" y="23" width="2.8" height="4" rx="1" fill="#fff" opacity=".95" />
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-xl font-semibold tracking-tight ${app ? "text-fg" : light ? "text-white" : "text-ink"}`}>
          {BRAND.name}
        </span>
        {app && <span className="mt-1 block text-[9px] font-bold tracking-[0.22em] text-faint">WORKSPACE SUITE</span>}
      </span>
    </span>
  );
}

export function Avatar({ user, size = 28 }: { user?: User | null; size?: number }) {
  if (!user) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-faint"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-surface"
      style={{ width: size, height: size, background: user.avatarColor, fontSize: size * 0.38 }}
      title={user.name}
    >
      {initials}
    </span>
  );
}

export function Badge({ color, children, className = "" }: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={tint(color)}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const m = statusMeta(status);
  return <Badge color={m.color}>{m.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = priorityMeta(priority);
  return <Badge color={m.color}>{m.label}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role];
  return <Badge color={m.color}>{m.label}</Badge>;
}

export function PriorityFlag({ priority, showLabel = false }: { priority: Priority; showLabel?: boolean }) {
  const m = priorityMeta(priority);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
      <Flag size={13} fill={m.color} stroke={m.color} />
      {showLabel && m.label}
    </span>
  );
}

export function dueLabel(due: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  const text =
    diff === 0
      ? "Today"
      : diff === 1
        ? "Tomorrow"
        : diff === -1
          ? "Yesterday"
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { text, overdue: diff < 0, soon: diff >= 0 && diff <= 2 };
}

export function DueDate({ due, done }: { due: string | null; done?: boolean }) {
  const d = dueLabel(due);
  if (!d) return <span className="text-xs text-faint">—</span>;
  const color = done ? "text-faint" : d.overdue ? "text-red-500" : d.soon ? "text-amber-500" : "text-muted";
  return <span className={`text-xs font-medium ${color}`}>{d.text}</span>;
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-accent opacity-80 ${className}`}
    />
  );
}

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Small "…" dropdown used for rename/delete actions. */
export function Menu({
  items,
  className = "",
}: {
  items: { label: string; onClick: () => void; danger?: boolean; icon?: React.ReactNode }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  if (!items.length) return null;
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-md p-1 text-faint transition hover:bg-surface-3 hover:text-fg"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-surface-2 p-1 shadow-2xl">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-surface-3 ${it.danger ? "text-red-500" : "text-fg"}`}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: React.ReactNode; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
      <p className="mt-4 font-semibold text-fg">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
