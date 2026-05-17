/**
 * useInternetIdentity — Google OAuth replacement for ICP Internet Identity.
 * Keeps the EXACT same interface so nothing else in the codebase changes.
 */
import { create } from "zustand";

const JWT_KEY = "mikupbeats_token";
const USER_KEY = "mikupbeats_user";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

interface AuthStore {
  identity: AuthUser | null;
  isInitializing: boolean;
  loginStatus: "idle" | "logging-in" | "logged-in" | "error";
  _initialized: boolean;
  login: () => void;
  logout: () => void;
  _setUser: (user: AuthUser, token: string) => void;
  _initialize: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const useAuthStore = create<AuthStore>((set, get) => ({
  identity: null,
  isInitializing: true,
  loginStatus: "idle",
  _initialized: false,

  _initialize: async () => {
    if (get()._initialized) return;
    set({ _initialized: true });
    const token = localStorage.getItem(JWT_KEY);
    const cached = localStorage.getItem(USER_KEY);
    if (!token) { set({ isInitializing: false }); return; }
    if (cached) {
      try { set({ identity: JSON.parse(cached), isInitializing: false, loginStatus: "logged-in" }); } catch {}
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ identity: user, isInitializing: false, loginStatus: "logged-in" });
      } else {
        localStorage.removeItem(JWT_KEY);
        localStorage.removeItem(USER_KEY);
        set({ identity: null, isInitializing: false, loginStatus: "idle" });
      }
    } catch { set({ isInitializing: false }); }
  },

  login: () => {
    set({ loginStatus: "logging-in" });
    (window as any).google?.accounts.id.prompt();
  },

  logout: () => {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
    set({ identity: null, loginStatus: "idle" });
    (window as any).google?.accounts.id.disableAutoSelect();
  },

  _setUser: (user: AuthUser, token: string) => {
    localStorage.setItem(JWT_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ identity: user, loginStatus: "logged-in", isInitializing: false });
  },
}));

// Global callback that Google GSI invokes after credential selection
if (typeof window !== "undefined") {
  (window as any).handleGoogleCredential = async (response: { credential: string }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      if (!res.ok) throw new Error("Auth failed");
      const { token, user } = await res.json();
      useAuthStore.getState()._setUser(user, token);
    } catch (err) {
      console.error("Google sign-in error:", err);
      useAuthStore.setState({ loginStatus: "error" });
    }
  };
}

/** Drop-in — same shape as @caffeineai/core-infrastructure's useInternetIdentity */
export function useInternetIdentity() {
  const { identity, isInitializing, loginStatus, login, logout, _initialize } = useAuthStore();
  if (typeof window !== "undefined") _initialize();
  return { identity, isInitializing, loginStatus, login, logout, isAuthenticated: !!identity };
}
