import { useState, type FormEvent } from "react";
import { Button, Input } from "@relay/ui";
import { useRelayStore } from "../lib/store";

type Mode = "login" | "signup";

/* ── Inline icon components ───────────────────────────────── */
const IconRelay = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="10" fill="var(--accent)" />
    <path
      d="M8 22 L16 10 L24 22"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="10" r="2.5" fill="#fff" />
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const FEATURES = [
  { icon: <IconShield />, label: "End-to-end encrypted sessions" },
  { icon: <IconZap />,    label: "Real-time gateway messaging" },
  { icon: <IconLayers />, label: "Unified web, desktop & API" },
];

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const error      = useRelayStore(s => s.error);
  const submitting = useRelayStore(s => s.submitting);
  const login      = useRelayStore(s => s.login);
  const signup     = useRelayStore(s => s.signup);
  const clearError = useRelayStore(s => s.clearError);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    if (mode === "login") {
      await login(email, password);
    } else {
      await signup(email, username, password);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    clearError();
  };

  return (
    <main style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-base)",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow blobs */}
      <div style={{
        position: "absolute",
        top: "-15%",
        left: "-10%",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,131,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-15%",
        right: "-10%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,90,240,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0",
        width: "100%",
        maxWidth: "920px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
        zIndex: 1,
      }}
        className="anim-scale-in"
      >
        {/* ── Left panel — hero ─────────────────────────────── */}
        <div style={{
          background: "var(--bg-1)",
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "48px",
          borderRight: "1px solid var(--border)",
        }}>
          {/* Logo + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <IconRelay />
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--text-1)",
              letterSpacing: "-0.02em",
            }}>
              Relay
            </span>
            <span style={{
              marginLeft: "4px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "100px",
              background: "var(--accent-subtle)",
              color: "var(--accent)",
            }}>
              v2
            </span>
          </div>

          {/* Headline */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "var(--text-1)",
              letterSpacing: "-0.03em",
            }}>
              Private communication,{" "}
              <span style={{
                background: "linear-gradient(135deg, var(--accent), #a259ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                rebuilt
              </span>{" "}
              from scratch.
            </h1>
            <p style={{
              fontSize: "15px",
              lineHeight: 1.65,
              color: "var(--text-3)",
              maxWidth: "340px",
            }}>
              One private server. One shared backend. Web, desktop, and admin — all on the same real-time pipeline.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FEATURES.map(({ icon, label }) => (
              <div key={label} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
                fontSize: "13.5px",
                fontWeight: 500,
              }}>
                <span style={{ color: "var(--accent)", flexShrink: 0 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — form ────────────────────────────── */}
        <div style={{
          background: "var(--bg-base)",
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "28px",
        }}>
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-4)",
            }}>
              Access Relay
            </p>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "26px",
              fontWeight: 700,
              color: "var(--text-1)",
              letterSpacing: "-0.02em",
            }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex",
            gap: "4px",
            padding: "4px",
            borderRadius: "10px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}>
            {(["login", "signup"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "7px",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                  background: mode === m ? "var(--bg-4)" : "transparent",
                  color: mode === m ? "var(--text-1)" : "var(--text-3)",
                  boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                }}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>Email</span>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@relay.app"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>

            {mode === "signup" && (
              <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>Username</span>
                <Input
                  autoComplete="username"
                  placeholder="relay_owner"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </label>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>Password</span>
              <Input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="At least 8 characters"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </label>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "var(--danger-subtle)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
                className="anim-fade-up"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
            >
              {submitting ? (
                <>
                  <span style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Connecting...
                </>
              ) : mode === "login" ? "Enter Relay →" : "Create account →"}
            </Button>
          </form>

          {/* Footer hint */}
          <p style={{ fontSize: "12px", color: "var(--text-4)", textAlign: "center" }}>
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
