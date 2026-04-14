import { useState, type FormEvent } from "react";
import { Button, Input } from "@relay/ui";
import { useRelayStore } from "../lib/store";

type Mode = "login" | "signup";

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
    if (mode === "login") await login(email, password);
    else await signup(email, username, password);
  };

  const switchMode = (m: Mode) => { setMode(m); clearError(); };

  return (
    <main style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-base)",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
        className="anim-fade-up"
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "56px", height: "56px",
            borderRadius: "16px",
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", fontWeight: 800, color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 4px 24px var(--accent-glow)",
          }}>
            R
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "24px", fontWeight: 800,
              color: "var(--text-1)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}>
              Relay
            </h1>
            <p style={{
              fontSize: "14px",
              color: "var(--text-3)",
              margin: "4px 0 0",
              lineHeight: 1.5,
            }}>
              {mode === "login"
                ? "Welcome back. Sign in to continue."
                : "Create your account to get started."}
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "28px 24px",
          boxShadow: "var(--shadow-lg)",
        }}>
          {/* Mode toggle */}
          <div style={{
            display: "flex",
            gap: "4px",
            padding: "4px",
            borderRadius: "8px",
            background: "var(--bg-2)",
            marginBottom: "24px",
          }}>
            {(["login", "signup"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "5px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                  background: mode === m ? "var(--bg-4)" : "transparent",
                  color: mode === m ? "var(--text-1)" : "var(--text-3)",
                }}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Email
              </span>
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
              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Username
                </span>
                <Input
                  autoComplete="username"
                  placeholder="your_handle"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </label>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Password
              </span>
              <Input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <div style={{
                padding: "10px 14px",
                borderRadius: "6px",
                background: "var(--danger-subtle)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                fontSize: "14px",
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
                    width: "14px", height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    marginRight: "4px",
                  }} />
                  Connecting...
                </>
              ) : mode === "login" ? "Sign in to Relay" : "Create account"}
            </Button>
          </form>
        </div>

        {/* Footer switch */}
        <p style={{ fontSize: "13px", color: "var(--text-4)", textAlign: "center", margin: 0 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            style={{
              background: "none", border: "none",
              color: "var(--accent)", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", padding: 0,
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
