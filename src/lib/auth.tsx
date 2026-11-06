"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore, type User } from "./api";

/** Returned when the account still needs its email confirmed. No session is created. */
export interface PendingVerification {
  verificationRequired: true;
  email: string;
  emailed: boolean;
  /** Only present outside production when SMTP isn't configured. */
  verifyLink?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Resolves to a PendingVerification when the user must confirm their email first. */
  register: (name: string, email: string, password: string, inviteToken?: string) => Promise<PendingVerification | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const finish = (res: { token: string; user: User }) => {
    tokenStore.set(res.token);
    setUser(res.user);
  };

  const login = useCallback(async (email: string, password: string) => {
    finish(await api("/auth/login", { method: "POST", body: { email, password } }));
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, inviteToken?: string): Promise<PendingVerification | null> => {
      const res = await api<{ token: string; user: User } | PendingVerification>("/auth/register", {
        method: "POST",
        body: { name, email, password, inviteToken },
      });
      if ("token" in res) {
        finish(res);
        return null;
      }
      return res;
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
