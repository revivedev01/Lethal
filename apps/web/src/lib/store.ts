import type { AuthResponse, Message, Server, User } from "@relay/config";
import { create } from "zustand";
import { sdk } from "./sdk";

type SessionStatus = "booting" | "anonymous" | "authenticated";

interface RelayAppState {
  status: SessionStatus;
  user: User | null;
  server: Server | null;
  channels: AuthResponse["channels"];
  selectedChannelId: string | null;
  messagesByChannel: Record<string, Message[]>;
  error: string | null;
  submitting: boolean;
  bootstrap(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  signup(email: string, username: string, password: string): Promise<void>;
  logout(): void;
  setSelectedChannel(channelId: string): void;
  loadMessages(channelId: string): Promise<void>;
  appendMessage(message: Message): void;
  sendMessage(content: string): Promise<void>;
  clearError(): void;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Relay hit an unexpected issue.";

const applySession = (payload: AuthResponse | { user: User; server: Server | null; channels: AuthResponse["channels"] }) => ({
  status: "authenticated" as const,
  user: payload.user,
  server: payload.server,
  channels: payload.channels,
  selectedChannelId: payload.channels[0]?.id ?? null,
  messagesByChannel: {}
});

export const useRelayStore = create<RelayAppState>((set, get) => ({
  status: "booting",
  user: null,
  server: null,
  channels: [],
  selectedChannelId: null,
  messagesByChannel: {},
  error: null,
  submitting: false,

  async bootstrap() {
    if (!sdk.auth.getToken()) {
      set({ status: "anonymous" });
      return;
    }

    try {
      const [user, server, channels] = await Promise.all([
        sdk.user.getCurrentUser(),
        sdk.server.getServer(),
        sdk.server.getChannels()
      ]);

      set({
        ...applySession({ user, server, channels }),
        error: null
      });
    } catch {
      sdk.auth.logout();
      set({
        status: "anonymous",
        user: null,
        server: null,
        channels: [],
        selectedChannelId: null,
        messagesByChannel: {},
        error: "Your previous Relay session expired. Please sign in again."
      });
    }
  },

  async login(email, password) {
    set({ submitting: true, error: null });

    try {
      const payload = await sdk.auth.login({ email, password });
      set({
        ...applySession(payload),
        submitting: false
      });
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
      const payload = await sdk.auth.signup({ email, username, password });
      set({
        ...applySession(payload),
        submitting: false
      });
    } catch (error) {
      set({
        submitting: false,
        error: getErrorMessage(error)
      });
    }
  },

  logout() {
    sdk.auth.logout();
    set({
      status: "anonymous",
      user: null,
      server: null,
      channels: [],
      selectedChannelId: null,
      messagesByChannel: {},
      error: null,
      submitting: false
    });
  },

  setSelectedChannel(channelId) {
    set({ selectedChannelId: channelId });
  },

  async loadMessages(channelId) {
    try {
      const messages = await sdk.messages.listMessages(channelId);
      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages
        }
      }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  appendMessage(message) {
    set((state) => {
      const current = state.messagesByChannel[message.channelId] ?? [];
      if (current.some((item) => item.id === message.id)) {
        return state;
      }

      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [message.channelId]: [...current, message]
        }
      };
    });
  },

  async sendMessage(content) {
    const channelId = get().selectedChannelId;
    if (!channelId) {
      return;
    }

    try {
      await sdk.messages.sendMessage(channelId, content);
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  clearError() {
    set({ error: null });
  }
}));
