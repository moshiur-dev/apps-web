"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Check, LogOut } from "lucide-react";
import { api, type Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Logo, ROLE_META, RoleBadge, Spinner } from "@/components/ui";

interface Preview {
  email: string;
  role: Role;
  status: "PENDING" | "ACCEPTED";
  expired: boolean;
  workspace: { name: string; color: string };
  invitedBy: { name: string; avatarColor: string };
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [invite, setInvite] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Preview>(`/invites/token/${token}`).then(setInvite).catch((e) => setError(e.message));
  }, [token]);

  const accept = async () => {
    setBusy(true);
    try {
      const { workspaceId } = await api<{ workspaceId: string }>(`/invites/token/${token}/accept`, { method: "POST" });
      localStorage.setItem("canopy.workspace", workspaceId);
      router.replace("/app");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const q = invite ? `?invite=${token}&email=${encodeURIComponent(invite.email)}` : "";
  const wrongUser = user && invite && user.email?.toLowerCase() !== invite.email;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10 text-fg">
      <div className="app-glow pointer-events-none fixed inset-0" />
      <Link href="/" className="relative mb-8"><Logo app /></Link>
      <div className="panel relative w-full max-w-md p-8 text-center shadow-2xl">
        {error ? (
          <>
            <AlertTriangle className="mx-auto text-amber-500" size={36} />
            <h1 className="mt-4 text-xl font-bold">Invite unavailable</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Link href="/app" className="btn-soft mt-6">Go to my workspace</Link>
          </>
        ) : !invite || loading ? (
          <Spinner />
        ) : (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34d399] to-[#1f6b45] text-2xl font-bold text-white shadow-lg shadow-accent/20">
              {invite.workspace.name[0]}
            </span>
            <p className="mt-5 text-sm text-muted"><b className="text-fg">{invite.invitedBy.name}</b> invited you to join</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{invite.workspace.name}</h1>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
              as <RoleBadge role={invite.role} />
            </div>
            <p className="mt-2 text-xs text-faint">{ROLE_META[invite.role].text}</p>

            <div className="mt-7">
              {invite.status === "ACCEPTED" ? (
                <p className="text-sm text-muted">This invite has already been used.</p>
              ) : invite.expired ? (
                <p className="text-sm text-amber-500">This invite has expired. Ask {invite.invitedBy.name} to send a new one.</p>
              ) : !user ? (
                <div className="space-y-2">
                  <p className="mb-4 text-xs text-faint">Invite sent to <b className="text-muted">{invite.email}</b></p>
                  <Link href={`/register${q}`} className="btn-accent w-full py-2.5">Create account &amp; join <ArrowRight size={15} /></Link>
                  <Link href={`/login${q}`} className="btn-soft w-full py-2.5">I already have an account</Link>
                </div>
              ) : wrongUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    You&apos;re signed in as <b className="text-fg">{user.email}</b>, but this invite is for <b className="text-fg">{invite.email}</b>.
                  </p>
                  <button
                    className="btn-soft w-full"
                    onClick={() => {
                      logout();
                      router.push(`/login${q}`);
                    }}
                  >
                    <LogOut size={15} /> Switch account
                  </button>
                </div>
              ) : (
                <button className="btn-accent w-full py-2.5" onClick={accept} disabled={busy}>
                  {busy ? <Spinner className="text-accent-fg" /> : <><Check size={16} /> Accept invitation</>}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
