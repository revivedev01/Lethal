import type { AdminOverview, AdminUserRow, AuthResponse, Server, User } from "@relay/config";
import { create } from "zustand";
import { sdk } from "./sdk";

type SessionStatus = "booting" | "anonymous" | "authenticated";

interface AdminStore {
  status: SessionStatus;
  user: User | null;
  server: Server | null;
  overview: AdminOverview | null;
  members: AdminUserRow[];
  error: string | null;
  submitting: boolean;
  bootstrap(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  signup(email: string, username: string, password: string): Promise<void>;
  refresh(): Promise<void>;
  logout(): void;
  clearError(): void;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Relay admin hit an unexpected issue.";

const setSession = (
  payload: AuthResponse | { user: User; server: Server | null },
  overview: AdminOverview | null = null,
  members: AdminUserRow[] = []
) => ({
  status: "authenticated" as const,
  user: payload.user,
  server: payload.server,
  overview,
  members
});

export const useAdminStore = create<AdminStore>((set, get) => ({
  status: "booting",
  user: null,
  server: null,
  overview: null,
  members: [],
  error: null,
  submitting: false,

  async bootstrap() {
    if (!sdk.auth.getToken()) {
      set({ status: "anonymous" });
      return;
    }

    try {
      const [user, server] = await Promise.all([sdk.user.getCurrentUser(), sdk.server.getServer()]);
      set({
        ...setSession({ user, server }),
        error: null
      });

      if (server?.role === "owner") {
        await get().refresh();
      }
    } catch {
      sdk.auth.logout();
      set({
        status: "anonymous",
        user: null,
        server: null,
        overview: null,
        members: [],
        error: "The admin session expired. Sign in again."
      });
    }
  },

  async login(email, password) {
    set({ submitting: true, error: null });

    try {
      const session = await sdk.auth.login({ email, password });
      set({
        ...setSession(session),
        submitting: false
      });

      if (session.server?.role === "owner") {
        await get().refresh();
      }
    } catch (error) {
      set({
        submitting: false,
        error: getErrorMessage(error)
      });
    }
  },

  async signup(email, username, password) {
    set({ submitting: true, error: null });

    try {
      const session = await sdk.auth.signup({ email, username, password });
      set({
        ...setSession(session),
        submitting: false
      });

      if (session.server?.role === "owner") {
        await get().refresh();
      }
    } catch (error) {
      set({
        submitting: false,
        error: getErrorMessage(error)
      });
    }
  },

  async refresh() {
    try {
      const [overview, members] = await Promise.all([sdk.admin.getOverview(), sdk.admin.listUsers()]);
      set({ overview, members, error: null });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  logout() {
    sdk.auth.logout();
    set({
      status: "anonymous",
      user: null,
      server: null,
      overview: null,
      members: [],
      error: null,
      submitting: false
    });
  },

  clearError() {
    set({ error: null });
  }
}));
