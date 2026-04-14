export type MemberRole = "owner" | "member";

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Server {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  role: MemberRole;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  channelId: string;
  createdAt: string;
  author: Pick<User, "id" | "username">;
}

export interface AuthResponse {
  token: string;
  user: User;
  server: Server | null;
  channels: Channel[];
}

export interface AdminOverview {
  server: Server | null;
  memberCount: number;
  ownerCount: number;
  messageCount: number;
  recentUsers: User[];
}

export interface AdminUserRow extends User {
  role: MemberRole;
  joinedAt: string;
}

export interface GatewayReadyEvent {
  type: "gateway.ready";
  payload: {
    user: Pick<User, "id" | "username">;
  };
}

export interface GatewayErrorEvent {
  type: "gateway.error";
  payload: {
    message: string;
  };
}

export interface MessageCreatedEvent {
  type: "message.created";
  payload: Message;
}

export type GatewayServerEvent =
  | GatewayReadyEvent
  | GatewayErrorEvent
  | MessageCreatedEvent;

export interface SendMessageEvent {
  type: "message.send";
  payload: {
    channelId: string;
    content: string;
  };
}

export type GatewayClientEvent = SendMessageEvent;

export const RELAY_PRODUCT_NAME = "Relay";
export const DEFAULT_SERVER_NAME = "Relay Command";
export const DEFAULT_CHANNELS = [
  {
    name: "General",
    slug: "general"
  },
  {
    name: "Announcements",
    slug: "announcements"
  }
] as const;

export const RELAY_THEME = {
  /* Backgrounds — OLED optimized */
  bgBase:    "#000000",
  bg1:       "#060606",
  bg2:       "#0d0d0d",
  bg3:       "#141414",
  bg4:       "#1c1c1c",
  sidebar:   "#060606",
  panel:     "#0a0a0a",
  /* Text */
  text1:     "#f2f3f5",
  text2:     "#b9bbbe",
  text3:     "#72767d",
  text4:     "#4f545c",
  /* Accent — Electric Blue */
  accent:    "#4f83ff",
  accentHov: "#6395ff",
  /* Status */
  online:    "#23a55a",
  idle:      "#f0b232",
  dnd:       "#f23f42",
  offline:   "#80848e",
  /* Semantic */
  danger:    "#f23f42",
  success:   "#23a55a"
} as const;

export const RELAY_SCHEMA_SQL = `
  create extension if not exists pgcrypto;

  create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    username text not null unique,
    password_hash text not null,
    created_at timestamptz not null default now()
  );

  create table if not exists servers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now()
  );

  create table if not exists members (
    user_id uuid not null references users(id) on delete cascade,
    server_id uuid not null references servers(id) on delete cascade,
    role text not null check (role in ('owner', 'member')),
    created_at timestamptz not null default now(),
    primary key (user_id, server_id)
  );

  create table if not exists channels (
    id uuid primary key default gen_random_uuid(),
    server_id uuid not null references servers(id) on delete cascade,
    name text not null,
    slug text not null,
    created_at timestamptz not null default now(),
    unique (server_id, slug)
  );

  create table if not exists messages (
    id uuid primary key default gen_random_uuid(),
    content text not null check (char_length(trim(content)) between 1 and 4000),
    user_id uuid not null references users(id) on delete cascade,
    channel_id uuid not null references channels(id) on delete cascade,
    created_at timestamptz not null default now()
  );

  create index if not exists idx_members_server_id on members(server_id);
  create index if not exists idx_channels_server_id on channels(server_id);
  create index if not exists idx_messages_channel_id_created_at on messages(channel_id, created_at desc);
`;
