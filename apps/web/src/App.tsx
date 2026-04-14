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
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="border border-white/10 bg-[var(--relay-sidebar)]/70 px-6 py-5 text-sm uppercase tracking-[0.35em] text-[var(--relay-muted)]">
          Booting Relay...
        </div>
      </main>
    );
  }

  if (status === "anonymous") {
    return <AuthScreen />;
  }

  return <ChatLayout />;
}
