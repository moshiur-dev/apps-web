"use client";

import { useEffect, useState } from "react";
import { api, type Task } from "./api";
import { useWorkspace } from "./workspace";

/** Fetches tasks from `path` and refetches whenever any task changes. */
export function useTasks(path: string | null) {
  const { taskVersion } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    api<Task[]>(path)
      .then((t) => !cancelled && setTasks(t))
      .catch(() => !cancelled && setTasks([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path, taskVersion]);

  return { tasks, setTasks, loading };
}
