import { useState, type FormEvent } from "react";
import { Button, Card, Input, Pill } from "@relay/ui";
import { useRelayStore } from "../lib/store";

type Mode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const error = useRelayStore((state) => state.error);
  const submitting = useRelayStore((state) => state.submitting);
  const login = useRelayStore((state) => state.login);
  const signup = useRelayStore((state) => state.signup);
  const clearError = useRelayStore((state) => state.clearError);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    if (mode === "login") {
      await login(email, password);
      return;
    }

    await signup(email, username, password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between border border-white/10 bg-[var(--relay-sidebar)]/70 p-8">
          <div className="space-y-5">
            <Pill>Relay v2</Pill>
            <div className="space-y-3">
              <h1 className="display-font text-4xl font-bold leading-tight text-white md:text-6xl">
                Private communication, rebuilt around one shared core.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--relay-text)]/80">
                Relay keeps web, desktop, and admin on the same SDK, the same realtime
                pipeline, and the same backend truth. Phase 1 starts with one private server
                and a cleaner foundation.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "1. Authenticate through the API",
              "2. Sync channels from the server",
              "3. Send live messages over the gateway"
            ].map((item) => (
              <div key={item} className="border border-white/10 bg-black/10 p-3 text-sm text-[var(--relay-text)]/80">
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="self-center p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--relay-muted)]">
                Access Relay
              </p>
              <h2 className="display-font mt-2 text-2xl font-bold text-white">
                {mode === "login" ? "Return to the server" : "Create the first account"}
              </h2>
            </div>

            <div className="flex border border-white/10 bg-black/10 p-1">
              <button
                type="button"
                className={`px-3 py-2 text-sm ${
                  mode === "login" ? "bg-white/10 text-white" : "text-[var(--relay-muted)]"
                }`}
                onClick={() => setMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm ${
                  mode === "signup" ? "bg-white/10 text-white" : "text-[var(--relay-muted)]"
                }`}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm text-[var(--relay-text)]">
              <span>Email</span>
              <Input
                autoComplete="email"
                placeholder="you@relay.app"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {mode === "signup" ? (
              <label className="block space-y-2 text-sm text-[var(--relay-text)]">
                <span>Username</span>
                <Input
                  autoComplete="username"
                  placeholder="relay_owner"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
            ) : null}

            <label className="block space-y-2 text-sm text-[var(--relay-text)]">
              <span>Password</span>
              <Input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? (
              <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <Button className="w-full justify-center" disabled={submitting}>
              {submitting
                ? "Connecting..."
                : mode === "login"
                  ? "Enter Relay"
                  : "Create account"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
