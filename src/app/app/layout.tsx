"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TaskDrawer } from "@/components/TaskDrawer";
import { Topbar } from "@/components/Topbar";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace";

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ws = useWorkspace();
  const pathname = usePathname();

  // Deep links like /app/list/x?task=y (from inbox/activity) open the task drawer
  useEffect(() => {
    const task = new URLSearchParams(window.location.search).get("task");
    if (task) ws.setOpenTaskId(task);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="app-glow flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        {ws.current?.role === "GUEST" && (
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-6 py-2 text-xs text-muted">
            <Eye size={14} className="text-accent" /> You&apos;re a guest in this workspace — you can view everything and comment.
          </div>
        )}
        <main className="scrollbar-thin dark-scroll flex-1 overflow-y-auto">
          {ws.loading ? (
            <div className="flex h-full items-center justify-center"><Spinner /></div>
          ) : ws.error ? (
            <div className="panel mx-auto mt-24 max-w-md p-8 text-center">
              <AlertTriangle className="mx-auto text-amber-500" size={32} />
              <h2 className="mt-3 text-lg font-bold">Couldn&apos;t load your workspace</h2>
              <p className="mt-2 text-sm text-muted">{ws.error}</p>
              <button onClick={() => ws.refresh()} className="btn-accent mt-5">Try again</button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <TaskDrawer />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center bg-bg"><Spinner /></div>;
  }

  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
