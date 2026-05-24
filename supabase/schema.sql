 -- ═══════════════════════════════════════════════════════════════
-- OJT Company Recommendation System – Supabase SQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'student' check (role in ('student', 'coordinator', 'superadmin')),
  full_name   text not null default '',
  program_id  text check (program_id in ('BSIS', 'BSIT', 'BSCS', 'BSCA')),
  contact_number text,
  student_id  text,
  resume_path text,
  resume_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles add column if not exists contact_number text;
alter table public.profiles add column if not exists student_id text;
alter table public.profiles add column if not exists resume_path text;
alter table public.profiles add column if not exists resume_url text;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Coordinators can view all profiles" on public.profiles;
drop policy if exists "Superadmins can update profiles" on public.profiles;
drop policy if exists "Verified coordinators can update coordinator status" on public.profiles;

alter table public.profiles drop column if exists coordinator_status;
alter table public.profiles drop column if exists coordinator_reviewed_at;
alter table public.profiles drop column if exists coordinator_reviewed_by;
alter table public.profiles drop column if exists coordinator_denied_reason;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.is_coordinator()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'coordinator'
  );
$$ language sql security definer stable;

create or replace function public.is_superadmin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'superadmin'
  );
$$ language sql security definer stable;

-- Coordinators can view all profiles
create policy "Coordinators can view all profiles"
  on public.profiles for select
  using ( public.is_coordinator() or public.is_superadmin() );

create policy "Superadmins can update profiles"
  on public.profiles for update
  using ( public.is_superadmin() )
  with check ( public.is_superadmin() );

-- 2. Companies table
create table if not exists public.companies (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text not null default '',
  hr_name               text,
  logo_url              text,
  email_address         text,
  location_address      text,
  website_url           text,
  contact_number        text,
  created_by            uuid references public.profiles(id),
  required_skills       text[] not null default '{}',
  eligibility_programs  text[] not null default '{}' check (eligibility_programs <@ array['BSIS','BSIT','BSCS','BSCA']::text[]),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Existing deployments: ensure new company detail columns exist
alter table public.companies add column if not exists logo_url text;
alter table public.companies add column if not exists email_address text;
alter table public.companies add column if not exists location_address text;
alter table public.companies add column if not exists website_url text;
alter table public.companies add column if not exists contact_number text;
alter table public.companies add column if not exists hr_name text;
alter table public.companies add column if not exists created_by uuid;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'companies_created_by_fkey'
  ) then
    alter table public.companies
      add constraint companies_created_by_fkey
      foreign key (created_by) references public.profiles(id);
  end if;
end $$;

alter table public.companies enable row level security;

-- Everyone authenticated can read companies
drop policy if exists "Authenticated users can read companies" on public.companies;
create policy "Authenticated users can read companies"
  on public.companies for select
  using (auth.role() = 'authenticated');

-- Only verified coordinators can insert / update / delete companies
drop policy if exists "Coordinators can insert companies" on public.companies;
create policy "Coordinators can insert companies"
  on public.companies for insert
  with check ( public.is_coordinator() or public.is_superadmin() );

drop policy if exists "Coordinators can update companies" on public.companies;
create policy "Coordinators can update companies"
  on public.companies for update
  using ( public.is_coordinator() or public.is_superadmin() );

drop policy if exists "Coordinators can delete companies" on public.companies;
create policy "Coordinators can delete companies"
  on public.companies for delete
  using ( public.is_coordinator() or public.is_superadmin() );

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

drop policy if exists "Students can read own student profile" on public.student_profiles;
create policy "Students can read own student profile"
  on public.student_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Students can insert own student profile" on public.student_profiles;
create policy "Students can insert own student profile"
  on public.student_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Students can update own student profile" on public.student_profiles;
create policy "Students can update own student profile"
  on public.student_profiles for update
  using (auth.uid() = user_id);

-- Coordinators can view all student profiles
drop policy if exists "Coordinators can view all student profiles" on public.student_profiles;
create policy "Coordinators can view all student profiles"
  on public.student_profiles for select
  using ( public.is_coordinator() or public.is_superadmin() );

-- 4. Company applications table
create table if not exists public.company_applications (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  applicant_name   text not null,
  applicant_email  text not null,
  message          text,
  status           text not null default 'submitted',
  resume_path      text not null,
  resume_url       text,
  cover_letter_html text,
  created_at       timestamptz not null default now()
);

alter table public.company_applications add column if not exists status text default 'submitted';
alter table public.company_applications add column if not exists cover_letter_html text;
-- Migration: drop old file-based cover letter columns if they still exist
alter table public.company_applications drop column if exists cover_letter_path;
alter table public.company_applications drop column if exists cover_letter_url;

alter table public.company_applications enable row level security;

drop policy if exists "Students can insert own company applications" on public.company_applications;
create policy "Students can insert own company applications"
  on public.company_applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Students can read own company applications" on public.company_applications;
create policy "Students can read own company applications"
  on public.company_applications for select
  using (auth.uid() = user_id);

drop policy if exists "Students can update own company applications" on public.company_applications;
create policy "Students can update own company applications"
  on public.company_applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Coordinators can read company applications" on public.company_applications;
create policy "Coordinators can read company applications"
  on public.company_applications for select
  using (public.is_coordinator() or public.is_superadmin());

-- 5. Audit logs
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id),
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;
create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert
  with check (auth.uid() = actor_id);

drop policy if exists "Superadmins can read audit logs" on public.audit_logs;
create policy "Superadmins can read audit logs"
  on public.audit_logs for select
  using (public.is_superadmin());

-- 6. Storage buckets for company assets and candidate resumes
insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('candidate-resumes', 'candidate-resumes', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can view company assets" on storage.objects;
create policy "Authenticated users can view company assets"
  on storage.objects for select
  using (bucket_id = 'company-assets' and auth.role() = 'authenticated');

drop policy if exists "Coordinators can upload company assets" on storage.objects;
create policy "Coordinators can upload company assets"
  on storage.objects for insert
  with check (
    bucket_id = 'company-assets' and (public.is_coordinator() or public.is_superadmin())
  );

drop policy if exists "Coordinators can update company assets" on storage.objects;
create policy "Coordinators can update company assets"
  on storage.objects for update
  using (bucket_id = 'company-assets' and (public.is_coordinator() or public.is_superadmin()));

drop policy if exists "Coordinators can delete company assets" on storage.objects;
create policy "Coordinators can delete company assets"
  on storage.objects for delete
  using (bucket_id = 'company-assets' and (public.is_coordinator() or public.is_superadmin()));

drop policy if exists "Students can upload own resumes" on storage.objects;
create policy "Students can upload own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'candidate-resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can view own resumes" on storage.objects;
create policy "Students can view own resumes"
  on storage.objects for select
  using (
    bucket_id = 'candidate-resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Coordinators can view candidate resumes" on storage.objects;
create policy "Coordinators can view candidate resumes"
  on storage.objects for select
  using (bucket_id = 'candidate-resumes' and (public.is_coordinator() or public.is_superadmin()));


drop function if exists public.is_verified_coordinator();


-- ═══════════════════════════════════════════════════════════════
-- Trigger: auto-create a profile row when a new user signs up
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name, program_id, contact_number, student_id, resume_path, resume_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'program_id', ''),
    nullif(new.raw_user_meta_data ->> 'contact_number', ''),
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    nullif(new.raw_user_meta_data ->> 'resume_path', ''),
    nullif(new.raw_user_meta_data ->> 'resume_url', '')
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

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

drop trigger if exists student_profiles_updated_at on public.student_profiles;
create trigger student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.update_updated_at();
