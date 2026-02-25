-- ═══════════════════════════════════════════════════════════════
-- OJT Company Recommendation System – Supabase SQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'student' check (role in ('student', 'coordinator')),
  full_name   text not null default '',
  program_id  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Helper: check if the current user is a coordinator without triggering RLS
create or replace function public.is_coordinator()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coordinator'
  );
$$ language sql security definer stable;

-- Allow coordinators to view all profiles
create policy "Coordinators can view all profiles"
  on public.profiles for select
  using ( public.is_coordinator() );

-- 2. Companies table
create table if not exists public.companies (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text not null default '',
  required_skills       text[] not null default '{}',
  eligibility_programs  text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.companies enable row level security;

-- Everyone authenticated can read companies
create policy "Authenticated users can read companies"
  on public.companies for select
  using (auth.role() = 'authenticated');

-- Only coordinators can insert / update / delete companies
create policy "Coordinators can insert companies"
  on public.companies for insert
  with check ( public.is_coordinator() );

create policy "Coordinators can update companies"
  on public.companies for update
  using ( public.is_coordinator() );

create policy "Coordinators can delete companies"
  on public.companies for delete
  using ( public.is_coordinator() );

-- 3. Student profiles table
create table if not exists public.student_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade unique,
  technical_skills  text[] not null default '{}',
  project_exp       text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.student_profiles enable row level security;

create policy "Students can read own student profile"
  on public.student_profiles for select
  using (auth.uid() = user_id);

create policy "Students can insert own student profile"
  on public.student_profiles for insert
  with check (auth.uid() = user_id);

create policy "Students can update own student profile"
  on public.student_profiles for update
  using (auth.uid() = user_id);

-- Coordinators can view all student profiles
create policy "Coordinators can view all student profiles"
  on public.student_profiles for select
  using ( public.is_coordinator() );

-- ═══════════════════════════════════════════════════════════════
-- Trigger: auto-create a profile row when a new user signs up
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- Auto-update updated_at on changes
-- ═══════════════════════════════════════════════════════════════
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

create trigger student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.update_updated_at();
