-- Beta Access Schema and RLS
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists public.beta_invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  token text not null unique,
  invited_by uuid,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists beta_invites_email_idx on public.beta_invites(email);
create index if not exists beta_invites_token_idx on public.beta_invites(token);

-- Optional derived testers table for quick checks
create table if not exists public.beta_testers (
  email text primary key,
  is_active boolean default true,
  expires_at timestamptz
);

alter table public.beta_invites enable row level security;
alter table public.beta_testers enable row level security;

-- Policies: allow admins to manage invites; regular users can only read their invite status by email
drop policy if exists "admin manage invites" on public.beta_invites;
create policy "admin manage invites"
on public.beta_invites
for all
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and (u."isAdmin" = 1 or u."isFounder" = 1)
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and (u."isAdmin" = 1 or u."isFounder" = 1)
  )
);

drop policy if exists "self can read invite by email" on public.beta_invites;
create policy "self can read invite by email"
on public.beta_invites
for select
using (
  email = auth.jwt()->>'email'
);

drop policy if exists "public read testers" on public.beta_testers;
create policy "public read testers"
on public.beta_testers
for select
using (true);

-- Admins can manage testers (insert/update/delete)
drop policy if exists "admin manage testers" on public.beta_testers;
create policy "admin manage testers"
on public.beta_testers
for all
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and (u."isAdmin" = 1 or u."isFounder" = 1)
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and (u."isAdmin" = 1 or u."isFounder" = 1)
  )
);

-- Helper function to check beta access based on users table flags or testers list
create or replace function public.is_beta_allowed()
returns boolean
language sql
security definer
stable
as $$
  with role_flag as (
    select case when (u."isFounder" = 1 or u."isAdmin" = 1) then true else false end as allowed
    from public.users u where u.id = auth.uid()
  ),
  tester_flag as (
    select case when bt.is_active = true and (bt.expires_at is null or bt.expires_at > now()) then true else false end as allowed
    from public.beta_testers bt
    where bt.email = (auth.jwt()->>'email')
  )
  select coalesce((select allowed from role_flag), false)
         or coalesce((select allowed from tester_flag), false);
$$;


