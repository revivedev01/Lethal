# Relay v2

Relay v2 is a Phase 1 rebuild of a Discord-like communication platform with a shared SDK, a Fastify API, a dedicated WebSocket gateway, and three clients inside a pnpm/turbo monorepo.

## Workspace

- `apps/web` - primary chat client
- `apps/desktop` - Electron wrapper around the web client
- `apps/admin` - owner-facing admin dashboard
- `services/api` - REST API for auth, server, channels, and admin data
- `services/gateway` - WebSocket gateway for live messaging
- `packages/sdk` - shared client SDK
- `packages/ui` - shared UI primitives
- `packages/config` - shared contracts, constants, and schema bootstrap

## Quick start

1. Enable pnpm via Corepack: `corepack enable`
2. Install dependencies: `corepack pnpm install`
3. Copy `.env.example` to `.env` and update values as needed
4. Run the services and clients you need:
   - API: `corepack pnpm dev:api`
   - Gateway: `corepack pnpm dev:gateway`
   - Web: `corepack pnpm dev:web`
   - Admin: `corepack pnpm dev:admin`
   - Desktop: start the web app first, then run `corepack pnpm dev:desktop`

The first signed-up account becomes the owner. Relay automatically bootstraps a single private server and its default channels on that first signup.
