import type { User } from "@relay/config";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Card, GhostButton, Input, Pill } from "@relay/ui";
import { useAdminStore } from "./lib/store";

function AuthView() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const error = useAdminStore((state) => state.error);
  const submitting = useAdminStore((state) => state.submitting);
  const login = useAdminStore((state) => state.login);
  const signup = useAdminStore((state) => state.signup);
  const clearError = useAdminStore((state) => state.clearError);

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
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1fr_0.9fr]">
        <section className="border border-white/10 bg-[var(--relay-sidebar)]/80 p-8">
          <Pill>Owner Console</Pill>
          <h1 className="display-font mt-4 text-5xl font-bold text-white">
            Run the private server without splitting logic away from the product.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--relay-text)]/80">
            The admin portal uses the same Relay SDK as chat. Owner tooling stays on the same
            authentication, session, and server contracts as every other client.
          </p>
        </section>

        <Card className="p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--relay-muted)]">
                Relay admin
              </p>
              <h2 className="display-font mt-2 text-2xl font-bold text-white">
                {mode === "login" ? "Owner sign in" : "Create the owner account"}
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
            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>

            {mode === "signup" ? (
              <label className="block space-y-2 text-sm">
                <span>Username</span>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} />
              </label>
            ) : null}

            <label className="block space-y-2 text-sm">
              <span>Password</span>
              <Input
                type="password"
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
              {submitting ? "Working..." : mode === "login" ? "Open console" : "Create owner"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function DashboardView() {
  const user = useAdminStore((state) => state.user);
  const server = useAdminStore((state) => state.server);
  const overview = useAdminStore((state) => state.overview);
  const members = useAdminStore((state) => state.members);
  const error = useAdminStore((state) => state.error);
  const refresh = useAdminStore((state) => state.refresh);
  const logout = useAdminStore((state) => state.logout);

  const metrics = useMemo(
    () => [
      { label: "Members", value: overview?.memberCount ?? 0 },
      { label: "Owners", value: overview?.ownerCount ?? 0 },
      { label: "Messages", value: overview?.messageCount ?? 0 }
    ],
    [overview]
  );

  if (server?.role !== "owner") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-xl p-8 text-center">
          <Pill>Restricted</Pill>
          <h1 className="display-font mt-4 text-3xl font-bold text-white">Owner access only</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--relay-text)]/80">
            This account belongs to the private server, but it does not have owner privileges for
            the admin dashboard.
          </p>
          <GhostButton className="mt-6" onClick={logout}>
            Sign out
          </GhostButton>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="flex flex-col border border-white/10 bg-[var(--relay-sidebar)]/85 p-5">
          <Pill>Private server</Pill>
          <h1 className="display-font mt-4 text-4xl font-bold text-white">
            {server?.name ?? "Relay"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--relay-text)]/78">
            {user?.username} is signed in as the initial owner. Use this console to monitor member
            access while the product remains in its single-server phase.
          </p>

          <div className="mt-6 space-y-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--relay-muted)]">
                  {metric.label}
                </p>
                <p className="display-font mt-3 text-3xl font-bold text-white">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto flex gap-3 pt-6">
            <Button className="flex-1 justify-center" onClick={() => refresh()}>
              Refresh
            </Button>
            <GhostButton className="flex-1 justify-center" onClick={logout}>
              Sign out
            </GhostButton>
          </div>
        </aside>

        <section className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--relay-muted)]">
                  Latest members
                </p>
                <h2 className="display-font mt-2 text-2xl font-bold text-white">
                  Server roster
                </h2>
              </div>
              <Pill>{members.length} total</Pill>
            </div>

            {error ? (
              <div className="mt-4 border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden border border-white/10">
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr] gap-3 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--relay-muted)]">
                <span>User</span>
                <span>Email</span>
                <span>Role</span>
                <span>Joined</span>
              </div>

              {members.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr] gap-3 border-t border-white/10 px-4 py-4 text-sm text-[var(--relay-text)]"
                >
                  <span>{member.username}</span>
                  <span className="truncate">{member.email}</span>
                  <span className="uppercase tracking-[0.18em] text-[var(--relay-muted)]">
                    {member.role}
                  </span>
                  <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--relay-muted)]">
              Recent signups
            </p>
            <h2 className="display-font mt-2 text-2xl font-bold text-white">New arrivals</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(overview?.recentUsers ?? []).map((member: User) => (
                <div key={member.id} className="border border-white/10 bg-black/10 p-4">
                  <p className="display-font text-lg font-bold text-white">{member.username}</p>
                  <p className="mt-1 text-sm text-[var(--relay-text)]/75">{member.email}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const status = useAdminStore((state) => state.status);
  const bootstrap = useAdminStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap().catch(() => undefined);
  }, [bootstrap]);

  if (status === "booting") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="border border-white/10 bg-[var(--relay-sidebar)]/80 px-6 py-5 text-sm uppercase tracking-[0.35em] text-[var(--relay-muted)]">
          Loading admin console...
        </div>
      </main>
    );
  }

  if (status === "anonymous") {
    return <AuthView />;
  }

  return <DashboardView />;
}
