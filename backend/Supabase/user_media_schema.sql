-- Table required by the app to save/restore user media tracks (YouTube + local audio) per connected account.
-- Run this once in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists public.user_media (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'youtube',
  title text not null default 'Piste sans titre',
  source text not null default 'youtube',
  payload jsonb not null default '{}'::jsonb,
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists user_media_user_id_idx on public.user_media(user_id);

alter table public.user_media enable row level security;

drop policy if exists "Users can view their own media" on public.user_media;
create policy "Users can view their own media"
  on public.user_media for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own media" on public.user_media;
create policy "Users can insert their own media"
  on public.user_media for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own media" on public.user_media;
create policy "Users can update their own media"
  on public.user_media for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own media" on public.user_media;
create policy "Users can delete their own media"
  on public.user_media for delete
  using (auth.uid() = user_id);
