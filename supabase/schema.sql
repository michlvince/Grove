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
  mode              text not null default 'personal' check (mode in ('personal', 'team')),
  is_public         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists creations_user_idx  on public.creations (user_id);
create index if not exists creations_world_idx on public.creations (world_id);
create index if not exists creations_mode_idx  on public.creations (mode);

-- Add columns if upgrading existing table
alter table public.creations add column if not exists mode text not null default 'personal';
alter table public.creations add column if not exists is_public boolean not null default true;

-- =============================================================================
-- CREATION MEMBERS  (Team mode collaborators assigned to a project)
-- =============================================================================
create table if not exists public.creation_members (
  id          uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  deadline    date, -- optional deadline for role completion
  reward_xp   integer not null default 0, -- XP reward for fulfilling role
  reward_text text, -- optional description of reward
  created_at  timestamptz not null default now(),
  unique (creation_id, user_id)
);

create index if not exists creation_members_creation_idx on public.creation_members (creation_id);
create index if not exists creation_members_user_idx     on public.creation_members (user_id);

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
  assignee_id uuid references public.users (id) on delete set null,
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

-- Add column if upgrading existing table
alter table public.tasks add column if not exists assignee_id uuid references public.users (id) on delete set null;

-- =============================================================================
-- PROJECT GROUP CHAT MESSAGES
-- =============================================================================
create table if not exists public.project_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chat_creation_idx on public.project_chat_messages (creation_id);

-- =============================================================================
-- DIRECT MESSAGES (1-on-1 private messaging)
-- =============================================================================
create table if not exists public.direct_messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.users (id) on delete cascade,
  receiver_id uuid not null references public.users (id) on delete cascade,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists dm_sender_idx   on public.direct_messages (sender_id);
create index if not exists dm_receiver_idx on public.direct_messages (receiver_id);

-- =============================================================================
-- CREATION LIKES & COMMENTS (Community Feed)
-- =============================================================================
create table if not exists public.creation_likes (
  id          uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (creation_id, user_id)
);

create table if not exists public.creation_comments (
  id          uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  comment     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_creation_idx on public.creation_comments (creation_id);

-- =============================================================================
-- PUSH SUBSCRIPTIONS
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
-- COLLABORATION REQUESTS (requests to join a creation)
-- =============================================================================
create table if not exists public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references public.creations (id) on delete cascade,
  requester_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collabreq_creation_idx on public.collaboration_requests (creation_id);
create index if not exists collabreq_requester_idx on public.collaboration_requests (requester_id);
create index if not exists collabreq_status_idx on public.collaboration_requests (status);

-- Enable RLS
alter table public.collaboration_requests enable row level security;

-- =============================================================================
-- GAMIFICATION: USER XP & LEVELS
-- =============================================================================
create table if not exists public.user_xp (
  user_id uuid primary key references public.users (id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- GAMIFICATION: ACHIEVEMENTS (badges)
-- =============================================================================
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon text, -- URL or icon class
  xp_reward integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed starter achievements
insert into public.achievements (slug, name, description, icon, xp_reward) values
  ('first_creation', 'First Creation', 'Created your first creation', '🎉', 50),
  ('first_comment', 'First Comment', 'Left your first comment on a creation', '💬', 20),
  ('first_like', 'First Like', 'Given your first like', '👍', 10),
  ('social_butterfly', 'Social Butterfly', 'Sent 10 direct messages', '🦋', 100),
  ('collaborator', 'Collaborator', 'Had a collaboration request accepted', '🤝', 75),
  ('explorer', 'Explorer', 'Created creations in 3 different worlds', '🌍', 150),
  ('mentor', 'Mentor', 'Helped 5 newcomers with accepted collaboration requests', '🧑‍🏫', 200),
  ('legend', 'Legend', 'Reached level 10', '🏆', 500)
on conflict (slug) do nothing;

-- =============================================================================
-- GAMIFICATION: USER ACHIEVEMENTS (earned badges)
-- =============================================================================
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists user_achievements_user_idx on public.user_achievements (user_id);
create index if not exists user_achievements_achievement_idx on public.user_achievements (achievement_id);

-- =============================================================================
-- GAMIFICATION: DAILY QUESTS (optional)
-- =============================================================================
create table if not exists public.daily_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  quest_type text not null, -- e.g., 'post_feed', 'like_creation', 'comment', etc.
  target integer not null default 1,
  progress integer not null default 0,
  completed boolean not null default false,
  date date not null default CURRENT_DATE,
  xp_reward integer not null default 0,
  unique (user_id, quest_type, date)
);

create index if not exists daily_quests_user_idx on public.daily_quests (user_id);
create index if not exists daily_quests_date_idx on public.daily_quests (date);

-- =============================================================================
-- EVENTS (admin-created collaboration events)
-- =============================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  xp_reward integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_creator_idx on public.events (creator_id);
create index if not exists events_date_idx on public.events (start_date, end_date);

-- =============================================================================
-- EVENT PARTICIPATION (users joining events, maybe linking to creations)
-- =============================================================================
create table if not exists public.event_participations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  creation_id uuid references public.creations (id) on delete set null, -- optional creation they worked on for the event
  joined_at timestamptz not null default now(),
  completed boolean not null default false,
  completed_at timestamptz null,
  unique (event_id, user_id)
);

create index if not exists event_participations_event_idx on public.event_participations (event_id);
create index if not exists event_participations_user_idx on public.event_participations (user_id);

-- Enable RLS for new tables
alter table public.user_xp enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.daily_quests enable row level security;
alter table public.events enable row level security;
alter table public.event_participations enable row level security;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.users                 enable row level security;
alter table public.creations             enable row level security;
alter table public.creation_members      enable row level security;
alter table public.entries               enable row level security;
alter table public.dump_items            enable row level security;
alter table public.tasks                 enable row level security;
alter table public.project_chat_messages enable row level security;
alter table public.direct_messages       enable row level security;
alter table public.creation_likes        enable row level security;
alter table public.creation_comments     enable row level security;
alter table public.push_subscriptions    enable row level security;

-- =============================================================================
-- SEED ADMIN ACCOUNT
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
