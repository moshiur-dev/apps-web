"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { PageHeader, RoleBadge } from "@/components/ui";

export default function SettingsPage() {
  const ws = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(ws.current?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!ws.current) return null;
  if (!ws.can.manage) {
    return <p className="p-10 text-center text-muted">Only admins and the owner can change workspace settings.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
      <PageHeader title="Workspace settings" subtitle={<>Your role: <RoleBadge role={ws.current.role} /></>} />

      <form
        className="panel p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await ws.rename("workspaces", ws.current!.id, name.trim()).catch((err) => alert(err.message));
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        <h2 className="font-bold text-fg">General</h2>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Workspace name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </label>
        <div className="mt-5 flex justify-end">
          <button className="btn-accent"><Save size={15} /> {saved ? "Saved" : "Save changes"}</button>
        </div>
      </form>

      {ws.can.owner && (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="flex items-center gap-2 font-bold text-red-500"><AlertTriangle size={18} /> Danger zone</h2>
          <p className="mt-2 text-sm text-muted">
            Deleting <b className="text-fg">{ws.current.name}</b> permanently removes every space, folder, list, task, comment and invite in it. Members lose access immediately.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Type the workspace name to confirm</span>
            <input className="field" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={ws.current.name} />
          </label>
          <button
            disabled={confirmText !== ws.current.name}
            onClick={async () => {
              await ws.remove("workspaces", ws.current!.id).catch((err) => alert(err.message));
              router.push("/app");
            }}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
          >
            Delete workspace
          </button>
        </div>
      )}
    </div>
  );
}
