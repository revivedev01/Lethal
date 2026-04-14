import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from "react";
import { sdk } from "../lib/sdk";
import { useRelayStore } from "../lib/store";
import type { Message } from "@relay/config";

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
const formatTimestamp = (v: string): string => {
  const d = new Date(v);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const timeStr = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  if (isToday) return `Today at ${timeStr}`;
  const dateStr = new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(d);
  return `${dateStr} ${timeStr}`;
};

const getInitial = (name: string) => name.charAt(0).toUpperCase();

const AVATAR_COLORS = [
  "#4f83ff", "#7c5af0", "#e85c5c", "#23a55a",
  "#f0b232", "#e8775a", "#5ab8e8", "#a855f7",
];
const getAvatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

/* Group consecutive messages from the same author */
interface MessageGroup {
  authorId: string;
  authorName: string;
  messages: Message[];
}
const groupMessages = (messages: Message[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.authorId === msg.userId) {
      last.messages.push(msg);
    } else {
      groups.push({ authorId: msg.userId, authorName: msg.author.username, messages: [msg] });
    }
  }
  return groups;
};

/* ─────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────── */
const IconHash = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconVolume = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const IconMic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconMicOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconLogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ─────────────────────────────────────────────────────
   VOICE TILE
───────────────────────────────────────────────────── */
function VoiceTile({ username, isSpeaking, isMuted, isYou }: {
  username: string; isSpeaking: boolean; isMuted: boolean; isYou: boolean;
}) {
  const color = getAvatarColor(username);
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "14px",
      padding: "32px 24px",
      borderRadius: "12px",
      background: "var(--bg-2)",
      border: `2px solid ${isSpeaking ? "var(--speaking)" : "var(--border)"}`,
      minWidth: "160px",
      flex: "1 1 160px",
      maxWidth: "220px",
      position: "relative",
      boxShadow: isSpeaking ? "0 0 0 4px var(--speaking-glow), var(--shadow-md)" : "var(--shadow-sm)",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    }}>
      {isSpeaking && (
        <div style={{
          position: "absolute", inset: "-6px", borderRadius: "16px",
          border: "2px solid var(--speaking)", opacity: 0.5,
          animation: "speakRing 1.1s ease-out infinite", pointerEvents: "none",
        }} />
      )}
      <div style={{
        width: "88px", height: "88px", borderRadius: "50%",
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "34px", fontWeight: 700,
        color: "#fff", fontFamily: "'Outfit', sans-serif", flexShrink: 0,
        boxShadow: isSpeaking ? `0 0 24px ${color}66` : "none",
        transition: "box-shadow 0.2s ease",
      }}>
        {getInitial(username)}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-1)", fontFamily: "'Outfit', sans-serif", marginBottom: "4px" }}>
          {username}
          {isYou && (
            <span style={{
              marginLeft: "6px", fontSize: "10px", padding: "2px 6px",
              borderRadius: "100px", background: "var(--accent-subtle)",
              color: "var(--accent)", fontWeight: 600, letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>you</span>
          )}
        </p>
        <p style={{ fontSize: "13px", color: isMuted ? "var(--muted-mic)" : isSpeaking ? "var(--speaking)" : "var(--text-3)" }}>
          {isMuted ? "Muted" : isSpeaking ? "Speaking..." : "Connected"}
        </p>
      </div>
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: isMuted ? "var(--danger-subtle)" : "var(--bg-4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isMuted ? "var(--danger)" : "var(--text-3)",
      }}>
        {isMuted ? <IconMicOff /> : <IconMic />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MESSAGE GROUP  (Discord-style)
───────────────────────────────────────────────────── */
function MessageGroup({ group, isOwn }: { group: MessageGroup; isOwn: boolean }) {
  const color = getAvatarColor(group.authorName);
  const firstMsg = group.messages[0];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {group.messages.map((msg, i) => {
        const isFirst = i === 0;
        return (
          <div
            key={msg.id}
            style={{
              display: "flex",
              gap: "16px",
              padding: isFirst ? "8px 16px 2px" : "1px 16px 1px",
              transition: "background 0.08s ease",
              cursor: "default",
              alignItems: "flex-start",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Avatar OR spacer */}
            {isFirst ? (
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: color, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "17px", fontWeight: 700,
                color: "#fff", fontFamily: "'Outfit', sans-serif",
                flexShrink: 0, marginTop: "1px", position: "relative",
              }}>
                {getInitial(group.authorName)}
                {isOwn && (
                  <span style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: "var(--online)", border: "2px solid var(--bg-base)",
                  }} />
                )}
              </div>
            ) : (
              /* Spacer so text lines up with first message */
              <div style={{ width: "40px", flexShrink: 0 }} />
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {isFirst && (
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
                  <span style={{
                    fontSize: "16px", fontWeight: 600,
                    color: isOwn ? color : "var(--text-1)",
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    {group.authorName}
                  </span>
                  {isOwn && (
                    <span style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 500 }}>
                      [you]
                    </span>
                  )}
                  <span style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: 400 }}>
                    {firstMsg ? formatTimestamp(firstMsg.createdAt) : ""}
                  </span>
                </div>
              )}
              <p style={{
                fontSize: "16px",
                lineHeight: 1.5,
                color: "var(--text-2)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
              }}>
                {msg.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEXT PANEL (full-width)
───────────────────────────────────────────────────── */
function TextPanel({ channelSlug, channelName }: { channelSlug: string; channelName: string }) {
  const user = useRelayStore(s => s.user);
  const channels = useRelayStore(s => s.channels);
  const selectedChannelId = useRelayStore(s => s.selectedChannelId);
  const messagesByChannel = useRelayStore(s => s.messagesByChannel);
  const loadMessages = useRelayStore(s => s.loadMessages);
  const appendMessage = useRelayStore(s => s.appendMessage);
  const sendMessage = useRelayStore(s => s.sendMessage);
  const error = useRelayStore(s => s.error);
  const clearError = useRelayStore(s => s.clearError);
  const setSelectedChannel = useRelayStore(s => s.setSelectedChannel);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const textChannel = channels.find(c =>
    c.slug === "text" || c.slug === "general" || c.slug === "text-chat"
  );
  const activeChannel = textChannel ?? channels[0] ?? null;
  const channelId = activeChannel?.id ?? selectedChannelId;

  useEffect(() => {
    if (channelId && channelId !== selectedChannelId) {
      setSelectedChannel(channelId);
    }
  }, [channelId, selectedChannelId, setSelectedChannel]);

  const messages = useMemo(
    () => (channelId ? messagesByChannel[channelId] ?? [] : []),
    [messagesByChannel, channelId]
  );
  const groups = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    if (!channelId) return;
    loadMessages(channelId).catch(() => undefined);
    sdk.gateway.connect().catch(() => undefined);
    return sdk.messages.subscribeToMessages(channelId, appendMessage);
  }, [appendMessage, loadMessages, channelId]);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [groups]);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = composer.trim();
    if (!content || sending) return;
    setSending(true);
    clearError();
    await sendMessage(content);
    setComposer("");
    setSending(false);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form") as HTMLFormElement | null;
      form?.requestSubmit();
    }
  };

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-base)",
      minHeight: 0,
      overflow: "hidden",
    }}>
      {/* Sub-header: # channel-name */}
      <div style={{
        height: "52px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "10px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-base)",
        flexShrink: 0,
        boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
      }}>
        <span style={{ color: "var(--text-3)", display: "flex" }}><IconHash size={20} /></span>
        <span style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--text-1)",
          fontFamily: "'Outfit', sans-serif",
        }}>
          {channelName || "general"}
        </span>
      </div>

      {/* Message feed */}
      <div
        ref={feedRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0 8px",
          display: "flex",
          flexDirection: "column",
          gap: "0px",
          scrollBehavior: "smooth",
        }}
      >
        {groups.length === 0 && (
          <div style={{
            margin: "32px 16px 0",
            padding: "28px",
            borderRadius: "8px",
            background: "var(--bg-2)",
            border: "1px dashed var(--border-hover)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "16px", color: "var(--text-3)" }}>
              No messages yet. Be the first to say something! 👋
            </p>
          </div>
        )}

        {groups.map((group, idx) => (
          <MessageGroup
            key={group.authorId + group.messages[0]?.id + idx}
            group={group}
            isOwn={group.authorId === user?.id}
          />
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          margin: "0 16px 8px",
          padding: "10px 14px",
          borderRadius: "6px",
          background: "var(--danger-subtle)",
          border: "1px solid var(--danger)",
          color: "var(--danger)",
          fontSize: "14px",
        }}>
          {error}
        </div>
      )}

      {/* Composer */}
      <div style={{ padding: "0 20px 16px", flexShrink: 0 }}>
        <form onSubmit={handleSend}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "12px",
            padding: "14px 18px",
            background: "var(--bg-3)",
            borderRadius: "8px",
            border: "1px solid transparent",
            transition: "border-color 0.15s ease",
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
            onBlurCapture={e => (e.currentTarget.style.borderColor = "transparent")}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={composer}
              onChange={e => {
                setComposer(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channelSlug || "general"}`}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "16px",
                lineHeight: "24px",
                color: "var(--text-1)",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                minHeight: "24px",
                maxHeight: "144px",
                overflow: "hidden",
              }}
            />
            <button
              type="submit"
              disabled={!composer.trim() || sending}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: composer.trim() ? "var(--accent)" : "var(--text-4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: composer.trim() ? "pointer" : "not-allowed",
                flexShrink: 0,
                transition: "color 0.15s ease, transform 0.08s ease",
              }}
              onMouseEnter={e => { if (composer.trim()) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.9)"; }}
            >
              <IconSend />
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-4)", marginTop: "6px", paddingLeft: "2px" }}>
            Enter: Send · Shift+Enter: newline · @: mention
          </p>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   VOICE PANEL (full-width)
───────────────────────────────────────────────────── */
function VoicePanel({ username }: { username: string }) {
  const [micMuted, setMicMuted] = useState(false);
  const mockPeers = [
    { username, isMuted: micMuted, isSpeaking: !micMuted, isYou: true },
  ];

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-base)",
      minHeight: 0,
      overflow: "hidden",
    }}>
      {/* Sub-header */}
      <div style={{
        height: "45px",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "8px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-base)",
        flexShrink: 0,
      }}>
        <span style={{ color: "var(--speaking)" }}><IconVolume size={18} /></span>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-1)", fontFamily: "'Outfit', sans-serif" }}>
          GENERAL
        </span>
        <div style={{
          marginLeft: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "100px",
          background: "var(--success-subtle)",
          border: "1px solid var(--success)",
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "var(--success)",
            animation: "speakPulse 2s ease-out infinite",
          }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>Connected</span>
        </div>
      </div>

      {/* Voice tiles */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px",
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-start",
        gap: "16px",
      }}>
        {mockPeers.map(peer => (
          <VoiceTile key={peer.username} {...peer} />
        ))}
        {[1, 2].map(i => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "14px", padding: "32px 24px",
            borderRadius: "12px", background: "transparent",
            border: "2px dashed var(--border)",
            minWidth: "160px", flex: "1 1 160px", maxWidth: "220px",
            color: "var(--text-4)",
          }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "var(--bg-2)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span style={{ fontSize: "14px", color: "var(--text-4)" }}>Waiting...</span>
          </div>
        ))}
      </div>

      {/* Voice controls */}
      <div style={{
        padding: "14px 20px 18px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
        background: "var(--bg-1)",
      }}>
        <button
          onClick={() => setMicMuted(m => !m)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", borderRadius: "6px", border: "none",
            background: micMuted ? "var(--danger-subtle)" : "var(--bg-3)",
            color: micMuted ? "var(--danger)" : "var(--text-2)",
            fontSize: "15px", fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s ease", flex: 1,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = micMuted ? "var(--danger)" : "var(--bg-4)";
            el.style.color = micMuted ? "#fff" : "var(--text-1)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = micMuted ? "var(--danger-subtle)" : "var(--bg-3)";
            el.style.color = micMuted ? "var(--danger)" : "var(--text-2)";
          }}
        >
          {micMuted ? <IconMicOff /> : <IconMic />}
          {micMuted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN LAYOUT — Top Nav + Full-width panel
───────────────────────────────────────────────────── */
export function ChatLayout() {
  const user = useRelayStore(s => s.user);
  const server = useRelayStore(s => s.server);
  const channels = useRelayStore(s => s.channels);
  const logout = useRelayStore(s => s.logout);

  const [activeView, setActiveView] = useState<"text" | "voice">("text");

  const textChannel  = channels.find(c => c.slug === "text"  || c.slug === "general" || c.slug === "text-chat");
  const voiceChannel = channels.find(c => c.slug === "voice" || c.slug === "voice-chat");

  const serverName = server?.name ?? "Relay";
  const serverInitial = serverName.charAt(0).toUpperCase();
  const serverColor = getAvatarColor(serverName);

  const userName = user?.username ?? "You";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      background: "var(--bg-base)",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── TOP NAVIGATION BAR ───────────────── */}
      <div style={{
        height: "54px",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background: "var(--bg-1)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        gap: "0",
        boxShadow: "0 1px 0 rgba(0,0,0,0.4)",
      }}>

        {/* Server logo + name */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingRight: "20px",
          borderRight: "1px solid var(--border)",
          marginRight: "8px",
          flexShrink: 0,
          cursor: "default",
        }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: serverColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            flexShrink: 0,
          }}>
            {serverInitial}
          </div>
          <span style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text-1)",
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}>
            {serverName.toUpperCase()}
          </span>
        </div>

        {/* Channel tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          flex: 1,
          padding: "0 8px",
          overflow: "hidden",
        }}>
          {/* Text tab */}
          <button
            onClick={() => setActiveView("text")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 12px",
              borderRadius: "4px",
              border: "none",
              background: activeView === "text" ? "var(--bg-hover)" : "transparent",
              color: activeView === "text" ? "var(--text-1)" : "var(--text-3)",
              fontSize: "15px",
              fontWeight: activeView === "text" ? 600 : 500,
              cursor: "pointer",
              transition: "background 0.12s ease, color 0.12s ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (activeView !== "text") {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
              }
            }}
            onMouseLeave={e => {
              if (activeView !== "text") {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
              }
            }}
          >
            <IconHash size={16} />
            {textChannel?.name?.toLowerCase() ?? "general"}
          </button>

          {/* Voice tab */}
          <button
            onClick={() => setActiveView("voice")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 12px",
              borderRadius: "4px",
              border: "none",
              background: activeView === "voice" ? "var(--bg-hover)" : "transparent",
              color: activeView === "voice" ? "var(--text-1)" : "var(--text-3)",
              fontSize: "15px",
              fontWeight: activeView === "voice" ? 600 : 500,
              cursor: "pointer",
              transition: "background 0.12s ease, color 0.12s ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (activeView !== "voice") {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
              }
            }}
            onMouseLeave={e => {
              if (activeView !== "voice") {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
              }
            }}
          >
            <IconVolume size={16} />
            {voiceChannel?.name?.toUpperCase() ?? "GENERAL"}
          </button>
        </div>

        {/* Right section: online count + user info + logout */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingLeft: "16px",
          borderLeft: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          {/* Online count */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            color: "var(--text-3)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}>
            <span style={{
              width: "9px", height: "9px", borderRadius: "50%",
              background: "var(--online)",
              display: "inline-block",
              flexShrink: 0,
            }} />
            1 online
          </div>

          {/* User avatar + name */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: getAvatarColor(userName),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              flexShrink: 0,
            }}>
              {getInitial(userName)}
            </div>
            <span style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-1)",
              fontFamily: "'Outfit', sans-serif",
            }}>
              {userName}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "var(--text-4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.12s ease, color 0.12s ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--danger-subtle)";
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-4)";
            }}
          >
            <IconLogOut />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────── */}
      {activeView === "text" ? (
        <TextPanel
          channelSlug={textChannel?.slug ?? "general"}
          channelName={textChannel?.name ?? "general"}
        />
      ) : (
        <VoicePanel username={userName} />
      )}
    </div>
  );
}
