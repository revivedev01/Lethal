import { useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { ChatLayout } from "./components/ChatLayout";
import { useRelayStore } from "./lib/store";

export default function App() {
  const status = useRelayStore((state) => state.status);
  const bootstrap = useRelayStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap().catch(() => undefined);
  }, [bootstrap]);

  if (status === "booting") {
    return (
      <main style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          borderRadius: "12px",
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
        }}>
          <div style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-2)", letterSpacing: "0.04em" }}>
            Booting Relay...
          </span>
        </div>
      </main>
    );
  }

  if (status === "anonymous") {
    return <AuthScreen />;
  }

  return <ChatLayout />;
}
