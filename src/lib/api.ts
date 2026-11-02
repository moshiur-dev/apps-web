export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type Status = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
export type Role = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  role?: Role;
  joinedAt?: string;
}

export interface ProjectList {
  id: string;
  name: string;
  spaceId: string;
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  spaceId: string;
  lists: ProjectList[];
}

export interface Space {
  id: string;
  name: string;
  color: string;
  folders: Folder[];
  /** All lists in the space; those with folderId === null sit directly under it. */
  lists: ProjectList[];
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  role: Role;
  spaces: Space[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  timeEstimate: number | null;
  position: number;
  tags: string[];
  listId: string;
  parentId: string | null;
  assigneeId: string | null;
  assignee: User | null;
  createdAt: string;
  updatedAt: string;
  list?: { id: string; name: string; spaceId: string };
  _count?: { subtasks: number; comments: number };
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: User;
}

export interface TaskDetail extends Task {
  creator: User;
  parent: { id: string; title: string } | null;
  subtasks: Task[];
  comments: Comment[];
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  invitedBy: User;
}

export interface Notification {
  id: string;
  type: "ASSIGNED" | "COMMENT" | "MENTION" | "INVITE" | "ROLE" | "STATUS";
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
  actor: User | null;
}

export interface Activity {
  id: string;
  action: string;
  target: string;
  detail: string;
  link: string;
  createdAt: string;
  actor: User;
}

const TOKEN_KEY = "canopy.token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the API running on port 4000?", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new ApiError(msg ?? "Something went wrong", res.status);
  }
  return data as T;
}
