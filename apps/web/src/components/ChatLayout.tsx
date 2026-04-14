import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from "react";
import { Avatar } from "@relay/ui";
import { sdk } from "../lib/sdk";
import { useRelayStore } from "../lib/store";
import type { Message } from "@relay/config";

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
const formatTime = (v: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(v));

const getInitial = (name: string) => name.charAt(0).toUpperCase();

const AVATAR_COLORS = [
  "#4f83ff","#7c5af0","#e85c5c","#23a55a",
  "#f0b232","#e8775a","#5ab8e8","#a855f7"
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
   ICONS (inline SVG — no dependency needed)
───────────────────────────────────────────────────── */
const IconHash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconVolume = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
const IconMessage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconLogOut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

/* ─────────────────────────────────────────────────────
   VOICE TILE — individual user in voice room
───────────────────────────────────────────────────── */
function VoiceTile({
  username,
  isSpeaking,
  isMuted,
  isYou
}: {
  username: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isYou: boolean;
}) {
  const color = getAvatarColor(username);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "24px 20px",
        borderRadius: "16px",
        background: "var(--bg-2)",
        border: isSpeaking
          ? "2px solid var(--speaking)"
          : "2px solid var(--border)",
        minWidth: "130px",
        flex: "1 1 130px",
        maxWidth: "180px",
        position: "relative",
        boxShadow: isSpeaking ? "0 0 0 4px var(--speaking-glow), var(--shadow-md)" : "var(--shadow-sm)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Speaking ring */}
      {isSpeaking && (
        <div style={{
          position: "absolute",
          inset: "-6px",
          borderRadius: "20px",
          border: "2px solid var(--speaking)",
          opacity: 0.5,
          animation: "speakRing 1.1s ease-out infinite",
          pointerEvents: "none"
        }} />
      )}

      {/* Avatar */}
      <div style={{
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        fontWeight: 700,
        color: "#fff",
        fontFamily: "'Outfit', sans-serif",
        flexShrink: 0,
        boxShadow: isSpeaking ? `0 0 20px ${color}66` : "none",
        transition: "box-shadow 0.2s ease",
      }}>
        {getInitial(username)}
      </div>

      {/* Name + status */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-1)",
          fontFamily: "'Outfit', sans-serif",
          marginBottom: "4px"
        }}>
          {username}
          {isYou && (
            <span style={{
              marginLeft: "6px",
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "100px",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>you</span>
          )}
        </p>
        <p style={{
          fontSize: "12px",
          color: isMuted ? "var(--muted-mic)" : isSpeaking ? "var(--speaking)" : "var(--text-3)"
        }}>
          {isMuted ? "Muted" : isSpeaking ? "Speaking..." : "Connected"}
        </p>
      </div>

      {/* Mic icon */}
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: isMuted ? "var(--danger-subtle)" : "var(--bg-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isMuted ? "var(--danger)" : "var(--text-3)",
      }}>
        {isMuted ? <IconMicOff /> : <IconMic />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MESSAGE GROUP
───────────────────────────────────────────────────── */
function MessageGroup({ group, isOwn }: { group: MessageGroup; isOwn: boolean }) {
  const color = getAvatarColor(group.authorName);
  const firstMsg = group.messages[0];

  return (
    <div style={{
      display: "flex",
      gap: "14px",
      padding: "6px 20px",
      borderRadius: "8px",
      transition: "background 0.1s ease",
      cursor: "default",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      <div style={{
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        fontWeight: 700,
        color: "#fff",
        fontFamily: "'Outfit', sans-serif",
        flexShrink: 0,
        marginTop: "2px",
      }}>
        {getInitial(group.authorName)}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Author + time */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
          <span style={{
            fontSize: "15px",
            fontWeight: 600,
            color: isOwn ? "var(--accent)" : "var(--text-1)",
            fontFamily: "'Outfit', sans-serif",
          }}>
            {group.authorName}
          </span>
          {isOwn && (
            <span style={{
              fontSize: "10px",
              padding: "1px 6px",
              borderRadius: "100px",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>you</span>
          )}
          <span style={{ fontSize: "12px", color: "var(--text-4)" }}>
            {firstMsg ? formatTime(firstMsg.createdAt) : ""}
          </span>
        </div>

        {/* Message bodies */}
        {group.messages.map((msg, i) => (
          <p key={msg.id} style={{
            fontSize: "15px",
            lineHeight: 1.6,
            color: "var(--text-2)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginTop: i > 0 ? "2px" : 0,
          }}>
            {msg.content}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEXT CHANNEL PANEL
───────────────────────────────────────────────────── */
function TextPanel() {
  const user = useRelayStore(s => s.user);
  const channels = useRelayStore(s => s.channels);
  const selectedChannelId = useRelayStore(s => s.selectedChannelId);
  const messagesByChannel = useRelayStore(s => s.messagesByChannel);
  const loadMessages = useRelayStore(s => s.loadMessages);
  const appendMessage = useRelayStore(s => s.appendMessage);
  const sendMessage = useRelayStore(s => s.sendMessage);
  const error = useRelayStore(s => s.error);
  const clearError = useRelayStore(s => s.clearError);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const textChannel = channels.find(c => c.slug === "text" || c.slug === "general" || c.slug === "text-chat");
  const activeChannel = textChannel ?? channels[0] ?? null;
  const channelId = activeChannel?.id ?? selectedChannelId;

  // Keep store in sync with the resolved channel
  const setSelectedChannel = useRelayStore(s => s.setSelectedChannel);
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

  // Auto-scroll to bottom on new messages
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
    // Temporarily switch selected channel to text
    await sendMessage(content);
    setComposer("");
    setSending(false);
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
      background: "var(--bg-1)",
      borderLeft: "1px solid var(--border)",
      minHeight: 0,
      overflow: "hidden",
    }}>
      {/* Channel header */}
      <div style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "10px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-1)",
        flexShrink: 0,
      }}>
        <span style={{ color: "var(--text-3)" }}><IconHash /></span>
        <span style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-1)",
          fontFamily: "'Outfit', sans-serif",
        }}>
          {activeChannel?.name ?? "text-chat"}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "100px",
          background: "var(--success-subtle)",
          border: "1px solid var(--success)",
        }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--success)" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>Live</span>
        </div>
      </div>

      {/* Message feed */}
      <div ref={feedRef} style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        scrollBehavior: "smooth",
      }}>
        {groups.length === 0 ? (
          <div style={{
            margin: "20px 20px 0",
            padding: "24px",
            borderRadius: "12px",
            background: "var(--bg-2)",
            border: "1px dashed var(--border-hover)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "15px", color: "var(--text-3)" }}>
              No messages yet. Be the first to say something! 👋
            </p>
          </div>
        ) : null}

        {groups.map((group) => (
          <MessageGroup
            key={group.authorId + group.messages[0]?.id}
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
          borderRadius: "8px",
          background: "var(--danger-subtle)",
          border: "1px solid var(--danger)",
          color: "var(--danger)",
          fontSize: "13px",
        }}>
          {error}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={handleSend} style={{ padding: "0 16px 16px", flexShrink: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          padding: "12px 16px",
          background: "var(--bg-3)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          transition: "border-color 0.15s ease",
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          {/* User avatar in composer */}
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: getAvatarColor(user?.username ?? "?"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            marginBottom: "2px",
          }}>
            {getInitial(user?.username ?? "?")}
          </div>

          <textarea
            rows={1}
            value={composer}
            onChange={e => {
              setComposer(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${activeChannel?.slug ?? "general"}`}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: "15px",
              color: "var(--text-1)",
              lineHeight: 1.5,
              fontFamily: "inherit",
              minHeight: "24px",
              maxHeight: "120px",
              paddingTop: "2px",
              overflow: "hidden",
            }}
          />

          <button
            type="submit"
            disabled={!composer.trim() || sending}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "none",
              background: composer.trim() ? "var(--accent)" : "var(--bg-4)",
              color: composer.trim() ? "#fff" : "var(--text-4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: composer.trim() ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "background 0.15s ease, color 0.15s ease, transform 0.08s ease",
              boxShadow: composer.trim() ? "0 2px 8px var(--accent-glow)" : "none",
            }}
            onMouseEnter={e => { if (composer.trim()) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
          >
            <IconSend />
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-4)", marginTop: "6px", paddingLeft: "4px" }}>
          Press <kbd style={{ padding: "1px 5px", borderRadius: "4px", background: "var(--bg-4)", border: "1px solid var(--border-hover)", fontSize: "11px" }}>Enter</kbd> to send · <kbd style={{ padding: "1px 5px", borderRadius: "4px", background: "var(--bg-4)", border: "1px solid var(--border-hover)", fontSize: "11px" }}>Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   VOICE CHANNEL PANEL
───────────────────────────────────────────────────── */
function VoicePanel({ username }: { username: string }) {
  const [micMuted, setMicMuted] = useState(false);
  // In Phase 1, simulate "connected" state with just the current user
  const mockPeers = [
    { username, isMuted: micMuted, isSpeaking: !micMuted, isYou: true },
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-base)",
      borderRight: "1px solid var(--border)",
      minHeight: 0,
      minWidth: 0,
      overflow: "hidden",
    }}>
      {/* Voice header */}
      <div style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "10px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-1)",
        flexShrink: 0,
      }}>
        <span style={{ color: "var(--speaking)" }}><IconVolume /></span>
        <span style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-1)",
          fontFamily: "'Outfit', sans-serif",
        }}>
          Voice
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "100px",
          background: "var(--success-subtle)",
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "var(--speaking)",
            animation: "speakPulse 2s ease-out infinite"
          }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--speaking)" }}>Connected</span>
        </div>
      </div>

      {/* Voice tiles */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-start",
        gap: "16px",
      }}>
        {mockPeers.map(peer => (
          <VoiceTile key={peer.username} {...peer} />
        ))}

        {/* Empty peer slots */}
        {[1, 2].map(i => (
          <div key={i} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "24px 20px",
            borderRadius: "16px",
            background: "transparent",
            border: "2px dashed var(--border)",
            minWidth: "130px",
            flex: "1 1 130px",
            maxWidth: "180px",
            color: "var(--text-4)",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "var(--bg-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-4)" }}>Waiting...</span>
          </div>
        ))}
      </div>

      {/* Voice controls bar */}
      <div style={{
        padding: "12px 20px 16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
        background: "var(--bg-1)",
      }}>
        {/* Mic toggle */}
        <button
          onClick={() => setMicMuted(m => !m)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            border: "none",
            background: micMuted ? "var(--danger-subtle)" : "var(--bg-3)",
            color: micMuted ? "var(--danger)" : "var(--text-2)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
            flex: 1,
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
   MAIN LAYOUT — Command Center
───────────────────────────────────────────────────── */
export function ChatLayout() {
  const user = useRelayStore(s => s.user);
  const server = useRelayStore(s => s.server);
  const channels = useRelayStore(s => s.channels);
  const logout = useRelayStore(s => s.logout);

  const [activeView, setActiveView] = useState<"text" | "voice" | "both">("both");

  const textChannel  = channels.find(c => c.slug === "text"  || c.slug === "general" || c.slug === "text-chat");
  const voiceChannel = channels.find(c => c.slug === "voice" || c.slug === "voice-chat");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      background: "var(--bg-base)",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Left Icon Rail */}
      <div style={{
        width: "68px",
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 0",
        gap: "6px",
        flexShrink: 0,
      }}>
        {/* Server logo / name */}
        <div
          title={server?.name ?? "Relay"}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            marginBottom: "8px",
            boxShadow: "0 4px 16px var(--accent-glow)",
            flexShrink: 0,
            cursor: "default",
          }}
        >
          R
        </div>

        {/* Divider */}
        <div style={{ width: "32px", height: "2px", borderRadius: "1px", background: "var(--border)", margin: "2px 0" }} />

        {/* Both / text channel */}
        <button
          onClick={() => setActiveView("both")}
          title={textChannel?.name ?? "Text Chat"}
          data-tooltip={textChannel?.name ?? "Text Chat"}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: activeView === "both" ? "16px" : "12px",
            border: "none",
            background: activeView === "both" ? "var(--accent-subtle)" : "var(--bg-3)",
            color: activeView === "both" ? "var(--accent)" : "var(--text-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (activeView !== "both") {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
              (e.currentTarget as HTMLElement).style.borderRadius = "16px";
            }
          }}
          onMouseLeave={e => {
            if (activeView !== "both") {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
              (e.currentTarget as HTMLElement).style.borderRadius = "12px";
            }
          }}
        >
          <IconHash />
        </button>

        {/* Text-only */}
        <button
          onClick={() => setActiveView("text")}
          title="Text only"
          data-tooltip="Text only"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: activeView === "text" ? "16px" : "12px",
            border: "none",
            background: activeView === "text" ? "var(--accent-subtle)" : "var(--bg-3)",
            color: activeView === "text" ? "var(--accent)" : "var(--text-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (activeView !== "text") {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
              (e.currentTarget as HTMLElement).style.borderRadius = "16px";
            }
          }}
          onMouseLeave={e => {
            if (activeView !== "text") {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
              (e.currentTarget as HTMLElement).style.borderRadius = "12px";
            }
          }}
        >
          <IconMessage />
        </button>

        {/* Voice channel */}
        <button
          onClick={() => setActiveView("voice")}
          title={voiceChannel?.name ?? "Voice"}
          data-tooltip={voiceChannel?.name ?? "Voice"}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: activeView === "voice" ? "16px" : "12px",
            border: "none",
            background: activeView === "voice" ? "var(--accent-subtle)" : "var(--bg-3)",
            color: activeView === "voice" ? "var(--accent)" : "var(--text-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (activeView !== "voice") {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
              (e.currentTarget as HTMLElement).style.borderRadius = "16px";
            }
          }}
          onMouseLeave={e => {
            if (activeView !== "voice") {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
              (e.currentTarget as HTMLElement).style.borderRadius = "12px";
            }
          }}
        >
          <IconVolume />
        </button>

        {/* Push bottom section */}
        <div style={{ flex: 1 }} />

        {/* Settings */}
        <button
          title="Settings"
          style={{
            width: "44px", height: "44px",
            borderRadius: "12px", border: "none",
            background: "var(--bg-3)", color: "var(--text-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
            (e.currentTarget as HTMLElement).style.borderRadius = "16px";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
            (e.currentTarget as HTMLElement).style.borderRadius = "12px";
          }}
        >
          <IconSettings />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            width: "44px", height: "44px",
            borderRadius: "12px", border: "none",
            background: "var(--bg-3)", color: "var(--text-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--danger-subtle)";
            (e.currentTarget as HTMLElement).style.color = "var(--danger)";
            (e.currentTarget as HTMLElement).style.borderRadius = "16px";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
            (e.currentTarget as HTMLElement).style.borderRadius = "12px";
          }}
        >
          <IconLogOut />
        </button>

        {/* User avatar at very bottom */}
        <div style={{
          width: "36px", height: "36px",
          borderRadius: "50%",
          background: getAvatarColor(user?.username ?? "?"),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: "#fff",
          fontFamily: "'Outfit', sans-serif",
          marginTop: "4px",
          flexShrink: 0,
          cursor: "default",
          title: user?.username,
        } as React.CSSProperties}
          title={user?.username ?? "You"}
        >
          {getInitial(user?.username ?? "?")}
        </div>
      </div>

      {/* ── Main Content */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns:
          activeView === "both"  ? "1fr 1fr" :
          activeView === "voice" ? "1fr" :
          "1fr",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        transition: "grid-template-columns 0.25s ease",
      }}>
        {/* Voice panel */}
        {activeView !== "text" && (
          <VoicePanel username={user?.username ?? "You"} />
        )}

        {/* Text panel */}
        {activeView !== "voice" && (
          <TextPanel />
        )}
      </div>
    </div>
  );
}
