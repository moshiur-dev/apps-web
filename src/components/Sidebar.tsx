"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  FolderClosed,
  FolderOpen,
  Home,
  Inbox,
  ListChecks,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Settings,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Folder, ProjectList, Space } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { Avatar, Logo, Menu, RoleBadge, SPACE_COLORS } from "./ui";

function InlineCreate({
  placeholder,
  onSubmit,
  onDone,
}: {
  placeholder: string;
  onSubmit: (name: string) => Promise<unknown>;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="py-1 pr-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        try {
          await onSubmit(value.trim());
        } catch (err) {
          alert((err as Error).message);
        }
        onDone();
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => !value && onDone()}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        placeholder={placeholder}
        className="field py-1.5"
      />
    </form>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("canopy.theme", next);
    } catch {
      /* private mode */
    }
  };
  return { theme, toggle };
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const ws = useWorkspace();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // "space" | "workspace" | `list:<spaceId>` | `folder:<spaceId>` | `flist:<folderId>`
  const [adding, setAdding] = useState<string | null>(null);
  const [switcher, setSwitcher] = useState(false);

  const nav = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/inbox", label: "Inbox", icon: Inbox, count: ws.unread },
    { href: "/app/my-tasks", label: "My Tasks", icon: ListChecks },
    { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/app/members", label: "Team Members", icon: Users, count: ws.members.length, muted: true },
    { href: "/app/activity", label: "Activity Audit Log", icon: Activity },
  ];

  const toggleOpen = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const askRename = async (kind: "spaces" | "folders" | "lists", id: string, current: string) => {
    const name = prompt("Rename", current)?.trim();
    if (name && name !== current) await ws.rename(kind, id, name).catch((e) => alert(e.message));
  };
  const askDelete = async (kind: "spaces" | "folders" | "lists", id: string, name: string) => {
    if (!confirm(`Delete “${name}” and everything inside it? This can't be undone.`)) return;
    await ws.remove(kind, id).catch((e) => alert(e.message));
    if (kind === "lists" && pathname.includes(id)) router.push("/app");
  };

  const listLink = (list: ProjectList, color: string) => {
    const href = `/app/list/${list.id}`;
    const active = pathname === href;
    return (
      <div key={list.id} className={`group flex items-center rounded-lg pr-1 transition ${active ? "bg-accent-soft" : "hover:bg-surface-3"}`}>
        <Link
          href={href}
          onClick={onClose}
          className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-[13px] ${active ? "font-semibold text-accent" : "text-muted hover:text-fg"}`}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate">{list.name}</span>
        </Link>
        <Menu
          className="opacity-0 group-hover:opacity-100"
          items={[
            ...(ws.can.edit ? [{ label: "Rename", icon: <Pencil size={13} />, onClick: () => askRename("lists", list.id, list.name) }] : []),
            ...(ws.can.manage ? [{ label: "Delete", danger: true, icon: <Trash2 size={13} />, onClick: () => askDelete("lists", list.id, list.name) }] : []),
          ]}
        />
      </div>
    );
  };

  const folderBlock = (space: Space, folder: Folder) => {
    const isCollapsed = collapsed[folder.id];
    return (
      <div key={folder.id}>
        <div className="group flex items-center rounded-lg pr-1 hover:bg-surface-3">
          <button onClick={() => toggleOpen(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-[13px] text-muted hover:text-fg">
            {isCollapsed ? <FolderClosed size={14} /> : <FolderOpen size={14} />}
            <span className="truncate">{folder.name}</span>
          </button>
          {ws.can.edit && (
            <button onClick={() => setAdding(`flist:${folder.id}`)} className="rounded-md p-1 text-faint opacity-0 hover:text-fg group-hover:opacity-100" title="New list in folder">
              <Plus size={13} />
            </button>
          )}
          <Menu
            className="opacity-0 group-hover:opacity-100"
            items={[
              ...(ws.can.edit ? [{ label: "Rename", icon: <Pencil size={13} />, onClick: () => askRename("folders", folder.id, folder.name) }] : []),
              ...(ws.can.manage ? [{ label: "Delete", danger: true, icon: <Trash2 size={13} />, onClick: () => askDelete("folders", folder.id, folder.name) }] : []),
            ]}
          />
        </div>
        {!isCollapsed && (
          <div className="ml-3.5 border-l border-line pl-2">
            {space.lists.filter((l) => l.folderId === folder.id).map((l) => listLink(l, space.color))}
            {adding === `flist:${folder.id}` && (
              <InlineCreate
                placeholder="List name…"
                onSubmit={async (n) => {
                  const l = await ws.createList(space.id, n, folder.id);
                  router.push(`/app/list/${l.id}`);
                }}
                onDone={() => setAdding(null)}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-5">
          <Link href="/app"><Logo app /></Link>
          <button className="rounded-lg p-1 text-faint hover:bg-surface-3 lg:hidden" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="scrollbar-thin dark-scroll flex-1 overflow-y-auto px-4 pb-4">
          {/* Workspace switcher */}
          <p className="label-xs mb-2 px-1">Workspace</p>
          <div className="relative">
            <button
              onClick={() => setSwitcher((s) => !s)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left transition hover:border-line-strong"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#34d399] to-[#1f6b45] text-xs font-bold text-white">
                {ws.current?.name[0] ?? "W"}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{ws.current?.name ?? "Workspace"}</span>
              {ws.current && <RoleBadge role={ws.current.role} />}
              <ChevronDown size={15} className="text-faint" />
            </button>
            {switcher && (
              <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-line bg-surface-2 p-1.5 shadow-2xl">
                {ws.workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      ws.switchWorkspace(w.id);
                      setSwitcher(false);
                      router.push("/app");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg hover:bg-surface-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-strong text-xs font-bold text-accent-fg">{w.name[0]}</span>
                    <span className="flex-1 truncate text-left">{w.name}</span>
                    <span className="text-[10px] font-semibold uppercase text-faint">{w.role}</span>
                    {w.id === ws.current?.id && <Check size={14} className="text-accent" />}
                  </button>
                ))}
                <div className="my-1 border-t border-line" />
                {adding === "workspace" ? (
                  <div className="p-1">
                    <InlineCreate
                      placeholder="Workspace name"
                      onSubmit={async (n) => {
                        await ws.createWorkspace(n);
                        setSwitcher(false);
                        router.push("/app");
                      }}
                      onDone={() => setAdding(null)}
                    />
                  </div>
                ) : (
                  <button onClick={() => setAdding("workspace")} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-accent hover:bg-surface-3">
                    <Plus size={15} /> New workspace
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="label-xs mt-6 mb-2 px-1">Views &amp; Tools</p>
          <nav className="space-y-0.5">
            {nav.map(({ href, label, icon: Icon, count, muted }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-[13.5px] font-medium transition ${active ? "border-accent/30 bg-accent-soft text-accent" : "border-transparent text-muted hover:bg-surface-3 hover:text-fg"}`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {!!count && (
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${muted ? "bg-surface-3 text-muted" : "bg-accent-strong text-accent-fg"}`}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 mb-2 flex items-center justify-between px-1">
            <span className="label-xs">Spaces</span>
            {ws.can.manage && (
              <button onClick={() => setAdding("space")} className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline">
                <Plus size={12} /> New
              </button>
            )}
          </div>

          {adding === "space" && (
            <InlineCreate
              placeholder="Space name…"
              onSubmit={(n) => ws.createSpace(n, SPACE_COLORS[(ws.current?.spaces.length ?? 0) % SPACE_COLORS.length])}
              onDone={() => setAdding(null)}
            />
          )}
          {ws.current?.spaces.map((space) => {
            const isCollapsed = collapsed[space.id];
            const looseLists = space.lists.filter((l) => !l.folderId);
            return (
              <div key={space.id} className="mb-1">
                <div className="group flex items-center rounded-lg pr-1 hover:bg-surface-3">
                  <button onClick={() => toggleOpen(space.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-[13px] font-semibold text-fg">
                    {isCollapsed ? <ChevronRight size={13} className="text-faint" /> : <ChevronDown size={13} className="text-faint" />}
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ background: space.color }}>
                      {space.name[0]}
                    </span>
                    <span className="truncate">{space.name}</span>
                  </button>
                  <Menu
                    className="opacity-0 group-hover:opacity-100"
                    items={[
                      ...(ws.can.edit
                        ? [
                            { label: "New list", icon: <Plus size={13} />, onClick: () => setAdding(`list:${space.id}`) },
                            { label: "New folder", icon: <FolderClosed size={13} />, onClick: () => setAdding(`folder:${space.id}`) },
                          ]
                        : []),
                      ...(ws.can.manage
                        ? [
                            { label: "Rename", icon: <Pencil size={13} />, onClick: () => askRename("spaces", space.id, space.name) },
                            { label: "Delete", danger: true, icon: <Trash2 size={13} />, onClick: () => askDelete("spaces", space.id, space.name) },
                          ]
                        : []),
                    ]}
                  />
                </div>
                {!isCollapsed && (
                  <div className="ml-[18px] border-l border-line pl-2">
                    {space.folders.map((f) => folderBlock(space, f))}
                    {adding === `folder:${space.id}` && (
                      <InlineCreate placeholder="Folder name…" onSubmit={(n) => ws.createFolder(space.id, n)} onDone={() => setAdding(null)} />
                    )}
                    {looseLists.map((l) => listLink(l, space.color))}
                    {adding === `list:${space.id}` && (
                      <InlineCreate
                        placeholder="List name…"
                        onSubmit={async (n) => {
                          const l = await ws.createList(space.id, n);
                          router.push(`/app/list/${l.id}`);
                        }}
                        onDone={() => setAdding(null)}
                      />
                    )}
                    {space.lists.length === 0 && space.folders.length === 0 && !adding?.endsWith(space.id) && ws.can.edit && (
                      <button onClick={() => setAdding(`list:${space.id}`)} className="px-2 py-1.5 text-xs text-faint hover:text-accent">+ Add a list</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-line p-4">
          {ws.can.manage && (
            <Link href="/app/settings" onClick={onClose} className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 transition hover:border-line-strong">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px] shadow-accent" />
              <span className="flex-1">
                <span className="block text-xs font-semibold text-fg">Workspace settings</span>
                <span className="block text-[10px] text-faint">Name, danger zone</span>
              </span>
              <Settings size={15} className="text-faint" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-surface-3 hover:text-fg" title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <span className="truncate text-right text-sm font-semibold text-fg" title={user?.email}>{user?.name.split(" ")[0]}</span>
              <Avatar user={user} size={30} />
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg p-2 text-muted hover:bg-surface-3 hover:text-red-500"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
