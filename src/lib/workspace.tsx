"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  api,
  type Folder,
  type ProjectList,
  type Role,
  type Space,
  type Task,
  type User,
  type Workspace,
} from "./api";

const RANK: Record<Role, number> = { OWNER: 4, ADMIN: 3, MEMBER: 2, GUEST: 1 };

export interface Permissions {
  /** create / edit / delete tasks, create folders & lists */
  edit: boolean;
  /** spaces, deleting folders & lists, members, invites */
  manage: boolean;
  /** rename/delete workspace, manage admins */
  owner: boolean;
}

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  members: User[];
  can: Permissions;
  loading: boolean;
  error: string | null;
  unread: number;
  /** Bumped whenever any task changes so open views can refetch. */
  taskVersion: number;
  openTaskId: string | null;
  setOpenTaskId: (id: string | null) => void;
  switchWorkspace: (id: string) => void;
  refresh: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  touchTasks: () => void;
  createWorkspace: (name: string) => Promise<void>;
  createSpace: (name: string, color: string) => Promise<Space>;
  createFolder: (spaceId: string, name: string) => Promise<Folder>;
  createList: (spaceId: string, name: string, folderId?: string) => Promise<ProjectList>;
  rename: (kind: "spaces" | "folders" | "lists" | "workspaces", id: string, name: string) => Promise<void>;
  remove: (kind: "spaces" | "folders" | "lists" | "workspaces", id: string) => Promise<void>;
  findList: (id: string) => { list: ProjectList; space: Space; folder: Folder | null } | null;
  allLists: () => (ProjectList & { spaceName: string; color: string })[];
  createTask: (listId: string, data: Partial<Task> & { title: string }) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
}

const Ctx = createContext<WorkspaceState | null>(null);
const CURRENT_KEY = "canopy.workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskVersion, setTaskVersion] = useState(0);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const list = await api<Workspace[]>("/workspaces");
      setWorkspaces(list);
      setCurrentId((prev) => {
        const saved = prev ?? localStorage.getItem(CURRENT_KEY);
        return list.find((w) => w.id === saved)?.id ?? list[0]?.id ?? null;
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await api<{ unread: number }>("/notifications");
      setUnread(res.unread);
    } catch {
      /* offline — keep last count */
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    return () => clearInterval(t);
  }, [refresh, refreshUnread]);

  const refreshMembers = useCallback(async () => {
    if (!currentId) return;
    setMembers(await api<User[]>(`/workspaces/${currentId}/members`).catch(() => []));
  }, [currentId]);

  useEffect(() => {
    if (!currentId) return;
    localStorage.setItem(CURRENT_KEY, currentId);
    refreshMembers();
  }, [currentId, refreshMembers]);

  const current = workspaces.find((w) => w.id === currentId) ?? null;
  const rank = current ? RANK[current.role] : 0;
  const can: Permissions = { edit: rank >= 2, manage: rank >= 3, owner: rank >= 4 };
  const touchTasks = useCallback(() => setTaskVersion((v) => v + 1), []);

  const value: WorkspaceState = {
    workspaces,
    current,
    members,
    can,
    loading,
    error,
    unread,
    taskVersion,
    openTaskId,
    setOpenTaskId,
    switchWorkspace: setCurrentId,
    refresh,
    refreshMembers,
    refreshUnread,
    touchTasks,
    async createWorkspace(name) {
      const ws = await api<Workspace>("/workspaces", { method: "POST", body: { name } });
      await refresh();
      setCurrentId(ws.id);
    },
    async createSpace(name, color) {
      const space = await api<Space>(`/workspaces/${currentId}/spaces`, {
        method: "POST",
        body: { name, color },
      });
      await refresh();
      return space;
    },
    async createFolder(spaceId, name) {
      const folder = await api<Folder>(`/spaces/${spaceId}/folders`, { method: "POST", body: { name } });
      await refresh();
      return folder;
    },
    async createList(spaceId, name, folderId) {
      const list = await api<ProjectList>(`/spaces/${spaceId}/lists`, {
        method: "POST",
        body: { name, folderId },
      });
      await refresh();
      return list;
    },
    async rename(kind, id, name) {
      await api(`/${kind}/${id}`, { method: "PATCH", body: { name } });
      await refresh();
    },
    async remove(kind, id) {
      await api(`/${kind}/${id}`, { method: "DELETE" });
      if (kind === "workspaces") setCurrentId(null);
      await refresh();
      touchTasks();
    },
    findList(id) {
      for (const space of current?.spaces ?? []) {
        const list = space.lists.find((l) => l.id === id);
        if (list) return { list, space, folder: space.folders.find((f) => f.id === list.folderId) ?? null };
      }
      return null;
    },
    allLists() {
      return (current?.spaces ?? []).flatMap((s) =>
        s.lists.map((l) => ({ ...l, spaceName: s.name, color: s.color })),
      );
    },
    async createTask(listId, data) {
      const task = await api<Task>(`/lists/${listId}/tasks`, { method: "POST", body: data });
      touchTasks();
      return task;
    },
    async updateTask(id, data) {
      const task = await api<Task>(`/tasks/${id}`, { method: "PATCH", body: data });
      touchTasks();
      return task;
    },
    async deleteTask(id) {
      await api(`/tasks/${id}`, { method: "DELETE" });
      touchTasks();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
