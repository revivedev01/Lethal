import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, GhostButton, Pill, Textarea } from "@relay/ui";
import { sdk } from "../lib/sdk";
import { useRelayStore } from "../lib/store";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));

export function ChatLayout() {
  const user = useRelayStore((state) => state.user);
  const server = useRelayStore((state) => state.server);
  const channels = useRelayStore((state) => state.channels);
  const selectedChannelId = useRelayStore((state) => state.selectedChannelId);
  const messagesByChannel = useRelayStore((state) => state.messagesByChannel);
  const setSelectedChannel = useRelayStore((state) => state.setSelectedChannel);
  const loadMessages = useRelayStore((state) => state.loadMessages);
  const appendMessage = useRelayStore((state) => state.appendMessage);
  const sendMessage = useRelayStore((state) => state.sendMessage);
  const logout = useRelayStore((state) => state.logout);
  const error = useRelayStore((state) => state.error);
  const clearError = useRelayStore((state) => state.clearError);

  const [composer, setComposer] = useState("");

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
  const messages = useMemo(
    () => (selectedChannelId ? messagesByChannel[selectedChannelId] ?? [] : []),
    [messagesByChannel, selectedChannelId]
  );

  useEffect(() => {
    if (!selectedChannelId) {
      return;
    }

    loadMessages(selectedChannelId).catch(() => undefined);
    sdk.gateway.connect().catch(() => undefined);

    return sdk.messages.subscribeToMessages(selectedChannelId, appendMessage);
  }, [appendMessage, loadMessages, selectedChannelId]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = composer.trim();
    if (!content) {
      return;
    }

    await sendMessage(content);
    setComposer("");
  };

  return (
    <main className="min-h-screen px-3 py-3 md:px-5 md:py-5">
      <div className="grid min-h-[calc(100vh-24px)] gap-3 md:grid-cols-[280px_1fr]">
        <aside className="flex flex-col border border-white/10 bg-[var(--relay-sidebar)]/85">
          <div className="border-b border-white/10 p-5">
            <Pill>{server?.role ?? "member"}</Pill>
            <h1 className="display-font mt-3 text-3xl font-bold text-white">
              {server?.name ?? "Relay"}
            </h1>
            <p className="mt-2 text-sm text-[var(--relay-text)]/75">
              {user?.username} is connected to the private Phase 1 server.
            </p>
          </div>

          <div className="flex-1 space-y-2 p-3">
            <p className="px-2 text-xs uppercase tracking-[0.25em] text-[var(--relay-muted)]">
              Channels
            </p>
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className={`flex w-full items-center justify-between border px-3 py-3 text-left text-sm transition ${
                  selectedChannelId === channel.id
                    ? "border-[var(--relay-accent)] bg-[var(--relay-accent)]/10 text-white"
                    : "border-transparent bg-black/10 text-[var(--relay-text)]/75 hover:border-white/10"
                }`}
                onClick={() => {
                  clearError();
                  setSelectedChannel(channel.id);
                }}
              >
                <span>#{channel.slug}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--relay-muted)]">
                  Live
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 p-3">
            <GhostButton className="w-full justify-center" onClick={logout}>
              Sign out
            </GhostButton>
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col border border-white/10 bg-[var(--relay-surface)]/86">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--relay-muted)]">
                Active channel
              </p>
              <h2 className="display-font mt-2 text-2xl font-bold text-white">
                #{selectedChannel?.slug ?? "general"}
              </h2>
            </div>
            <Pill>Gateway online</Pill>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-5">
            {messages.length === 0 ? (
              <div className="border border-dashed border-white/10 bg-black/10 p-6 text-sm text-[var(--relay-text)]/70">
                This channel is quiet. Send the first message and the gateway will broadcast it to
                every connected client in real time.
              </div>
            ) : null}

            {messages.map((message) => (
              <article key={message.id} className="border border-white/10 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="display-font text-sm font-bold text-white">
                      {message.author.username}
                    </span>
                    {message.userId === user?.id ? <Pill>You</Pill> : null}
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--relay-muted)]">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--relay-text)]">
                  {message.content}
                </p>
              </article>
            ))}
          </div>

          <form className="border-t border-white/10 p-4" onSubmit={handleSend}>
            <div className="space-y-3">
              <Textarea
                rows={3}
                placeholder={`Message #${selectedChannel?.slug ?? "general"}`}
                value={composer}
                onChange={(event) => setComposer(event.currentTarget.value)}
              />
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-[var(--relay-muted)]">
                  Everything routes through the shared Relay SDK. No client-side fetch drift.
                </p>
                <Button type="submit">Send message</Button>
              </div>
              {error ? (
                <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
