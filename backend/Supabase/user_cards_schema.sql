-- Table required by the app to save/restore user cards (publication.js, server.js /api/sync-cards, /api/get-cards)
-- Run this once in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists public.user_cards (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'Sans titre',
  preview text not null default '',
  content text not null default '',
  color text not null default '',
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists user_cards_user_id_idx on public.user_cards(user_id);

alter table public.user_cards enable row level security;

drop policy if exists "Users can view their own cards" on public.user_cards;
create policy "Users can view their own cards"
  on public.user_cards for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own cards" on public.user_cards;
create policy "Users can insert their own cards"
  on public.user_cards for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own cards" on public.user_cards;
create policy "Users can update their own cards"
  on public.user_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own cards" on public.user_cards;
create policy "Users can delete their own cards"
  on public.user_cards for delete
  using (auth.uid() = user_id);
