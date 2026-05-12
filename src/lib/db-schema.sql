-- ─────────────────────────────────────────────────────────────────────────────
-- NaijaTutor — Adaptive Learning System DB Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Learning Profiles ────────────────────────────────────────────────────────
-- Stores each student's learning style, XP, level, streak, and preferences.

create table if not exists public.learning_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  learning_style     text check (learning_style in ('visual','auditory','reading','kinesthetic')),
  xp                 integer not null default 0,
  streak_days        integer not null default 0,
  last_active_date   date,
  onboarding_done    boolean not null default false,
  goals              jsonb default '[]'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id)
);

-- RLS
alter table public.learning_profiles enable row level security;

create policy "Users can read their own profile"
  on public.learning_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.learning_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.learning_profiles for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger learning_profiles_updated_at
  before update on public.learning_profiles
  for each row execute procedure public.handle_updated_at();


-- 2. Topic Mastery ─────────────────────────────────────────────────────────────
-- Tracks per-topic mastery score and spaced-repetition schedule per user.

create table if not exists public.topic_mastery (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  topic            text not null,
  mastery_score    integer not null default 0 check (mastery_score between 0 and 100),
  attempts         integer not null default 0,
  last_practiced   timestamptz,
  next_review      date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, topic)
);

alter table public.topic_mastery enable row level security;

create policy "Users can read their own mastery"
  on public.topic_mastery for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own mastery"
  on public.topic_mastery for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mastery"
  on public.topic_mastery for update
  using (auth.uid() = user_id);

create trigger topic_mastery_updated_at
  before update on public.topic_mastery
  for each row execute procedure public.handle_updated_at();


-- 3. Coach Sessions ──────────────────────────────────────────────────────────
-- Persists the coaching chat history per user.

create table if not exists public.coach_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_sessions enable row level security;

create policy "Users can read their own coach sessions"
  on public.coach_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own coach sessions"
  on public.coach_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own coach sessions"
  on public.coach_sessions for update
  using (auth.uid() = user_id);

create trigger coach_sessions_updated_at
  before update on public.coach_sessions
  for each row execute procedure public.handle_updated_at();
