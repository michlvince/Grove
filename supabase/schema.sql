-- =============================================================================
-- Grove — Database Schema (Supabase / Postgres)
-- Run this in the Supabase Dashboard → SQL Editor.
-- =============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";      -- for gen_random_uuid()

-- =============================================================================
-- USERS
-- Stores both credential (email+password) users and OAuth (Google) users.
-- password_hash is NULL for OAuth-only accounts.
-- =============================================================================
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text not null,
  title         text not null default 'Traveler',
  password_hash text,                                   -- null for OAuth users
  role          text not null default 'user' check (role in ('user', 'admin')),
  provider      text not null default 'credentials',    -- 'credentials' | 'google'
  image         text,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx  on public.users (role);

-- =============================================================================
-- CREATIONS
-- =============================================================================
create table if not exists public.creations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  title             text not null,
  world_id          text not null,
  original_world_id text,
  status            text not null default 'Seed'
                    check (status in ('Seed','Growing','Thriving','Frozen','Launching','Shipped')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists creations_user_idx  on public.creations (user_id);
create index if not exists creations_world_idx on public.creations (world_id);

-- =============================================================================
-- ENTRIES  (text / image / link / audio content of a creation)
-- =============================================================================
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  type        text not null check (type in ('text','image','link','audio')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists entries_creation_idx on public.entries (creation_id);
create index if not exists entries_user_idx     on public.entries (user_id);

-- =============================================================================
-- DUMP ITEMS  (raw uncategorised thoughts)
-- =============================================================================
create table if not exists public.dump_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists dump_items_user_idx on public.dump_items (user_id);

-- =============================================================================
-- TASKS  (project production: to-do list, priorities, timeline)
-- =============================================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  title       text not null,
  priority    text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status      text not null default 'todo'   check (status in ('todo','in_progress','done')),
  start_date  date,
  due_date    date,
  sort_order  integer not null default 0,
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_creation_idx on public.tasks (creation_id);
create index if not exists tasks_user_idx     on public.tasks (user_id);

-- =============================================================================
-- PUSH SUBSCRIPTIONS  (Web Push / VAPID — for offline + admin-sent notifications)
-- =============================================================================
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  endpoint   text unique not null,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- The app talks to the DB exclusively through the server (service-role key),
-- which bypasses RLS. We still enable RLS + deny-by-default so the public
-- anon key can never read/write these tables directly.
-- =============================================================================
alter table public.users              enable row level security;
alter table public.creations          enable row level security;
alter table public.entries            enable row level security;
alter table public.dump_items         enable row level security;
alter table public.tasks              enable row level security;
alter table public.push_subscriptions enable row level security;
-- (No permissive policies added on purpose: anon/publishable key gets no access.)

-- =============================================================================
-- SEED ADMIN ACCOUNT
-- -----------------------------------------------------------------------------
-- Owner admin account. Sign in at /signin with this email + password below.
-- The password hash was generated with bcryptjs (cost 10) for "GroveAdmin2024!".
-- To rotate it, run in the project root:
--     node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "NewPassword"
-- and paste the new hash into password_hash below.
-- =============================================================================
insert into public.users (email, name, title, password_hash, role, provider)
values (
  'abesinmikel@gmail.com',
  'Mikel Abesin',
  'Administrator',
  '$2b$10$t0klKOQQFKe48YD.CIlOxuhQsGjZBAOnPAik5WZCPaAuo1lurAkJ2',
  'admin',
  'credentials'
)
on conflict (email) do update
  set role = 'admin',
      password_hash = excluded.password_hash,
      name = excluded.name,
      title = 'Administrator';
