"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { api, tokenStore, type User } from "@/lib/api";
import { Logo, Spinner } from "@/components/ui";

/** Landing page for the link in the verification email: /verify?token=... */
export default function VerifyPage() {
  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      setState("failed");
      setMessage("This link is missing its token. Open the link from your email again.");
      return;
    }
    api<{ token: string; user: User }>("/auth/verify", { method: "POST", body: { token } })
      .then((res) => {
        tokenStore.set(res.token);
        setState("done");
        // Full reload so the auth provider picks up the new session
        setTimeout(() => window.location.replace("/app"), 800);
      })
      .catch((e) => {
        setState("failed");
        setMessage((e as Error).message);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10 text-fg">
      <Link href="/" className="mb-8"><Logo app /></Link>
      <div className="panel w-full max-w-md p-8 text-center shadow-2xl">
        {state === "working" && (<><Spinner /><p className="mt-4 text-sm text-muted">Confirming your email…</p></>)}
        {state === "done" && (
          <>
            <Check className="mx-auto text-accent" size={36} />
            <h1 className="mt-4 text-xl font-bold">Email confirmed</h1>
            <p className="mt-2 text-sm text-muted">Taking you to your workspace…</p>
          </>
        )}
        {state === "failed" && (
          <>
            <AlertTriangle className="mx-auto text-amber-500" size={36} />
            <h1 className="mt-4 text-xl font-bold">Couldn&apos;t confirm email</h1>
            <p className="mt-2 text-sm text-muted">{message}</p>
            <Link href="/login" className="btn-soft mt-6">Back to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
