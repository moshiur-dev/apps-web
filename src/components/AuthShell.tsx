"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { Logo, Spinner } from "./ui";

interface Field {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}

export function AuthShell({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set when arriving from an invite link: /register?invite=<token>&email=<addr>
  const [invite, setInvite] = useState<{ token: string; email: string } | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const token = p.get("invite");
    if (token) setInvite({ token, email: p.get("email") ?? "" });
  }, []);

  useEffect(() => {
    if (user && !busy) router.replace(invite ? `/invite/${invite.token}` : "/app");
  }, [user, router, invite, busy]);

  const isLogin = mode === "login";
  const fields: Field[] = [
    ...(isLogin ? [] : [{ name: "name", label: "Full name", type: "text", placeholder: "Jane Doe", autoComplete: "name" }]),
    { name: "email", label: "Work email", type: "email", placeholder: "you@company.com", autoComplete: "email" },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: isLogin ? "Your password" : "At least 8 characters",
      autoComplete: isLogin ? "current-password" : "new-password",
    },
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "");
    setBusy(true);
    setError(null);
    try {
      if (isLogin) await login(get("email"), get("password"));
      else await register(get("name"), get("email"), get("password"));
      if (invite) {
        // Join the inviting workspace straight away; the invite page explains any problem
        try {
          const { workspaceId } = await api<{ workspaceId: string }>(`/invites/token/${invite.token}/accept`, { method: "POST" });
          localStorage.setItem("canopy.workspace", workspaceId);
        } catch {
          router.replace(`/invite/${invite.token}`);
          return;
        }
      }
      router.replace("/app");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            {isLogin ? "Welcome back" : "Create your workspace"}
          </h1>
          <p className="mt-2 text-sm text-forest-600">
            {invite
              ? "You've been invited to a workspace — continue to join your team."
              : isLogin
                ? "Sign in to pick up right where you left off."
                : `Start growing with ${BRAND.name} — free forever.`}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {fields.map((f) => (
              <label key={f.name} className="block">
                <span className="mb-1.5 block text-sm font-semibold text-forest-800">{f.label}</span>
                <input
                  className="input"
                  key={f.name + (invite?.email ?? "")}
                  defaultValue={f.name === "email" ? invite?.email : undefined}
                  name={f.name}
                  type={f.type}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  required
                  minLength={f.name === "password" && !isLogin ? 8 : undefined}
                />
              </label>
            ))}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? <Spinner className="text-white" /> : <>{isLogin ? "Sign in" : "Create account"} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-forest-600">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link href={`${isLogin ? "/register" : "/login"}${invite ? `?invite=${invite.token}&email=${encodeURIComponent(invite.email)}` : ""}`} className="font-semibold text-forest-700 underline-offset-4 hover:underline">
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-canopy relative hidden overflow-hidden lg:block">
        <div className="grid-lines absolute inset-0" />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <h2 className="font-display text-5xl font-semibold leading-tight">
            Clear paths through<br /><span className="text-gradient">every project.</span>
          </h2>
          <ul className="mt-10 space-y-4 text-forest-100">
            {["Spaces, lists, tasks and subtasks", "List and drag-and-drop board views", "Dashboards that update in real time", "Your data stored safely on MongoDB Atlas"].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 size={20} className="text-fern" /> {t}</li>
            ))}
          </ul>
          <div className="mt-14 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm leading-relaxed text-forest-100">
              “Our whole team switched in a weekend. Everything finally lives in one calm place.”
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-leaf text-xs font-bold text-forest-950">TA</span>
              <div className="text-sm">
                <div className="font-semibold">Tanvir Ahmed</div>
                <div className="text-forest-300">Engineering Lead, Riverbend</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
