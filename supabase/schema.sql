-- CALAS schema + RLS. Run in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('admin','staff')),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ DONORS ============
create sequence if not exists public.donor_seq start 1;
create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  donor_code text unique default ('BD-' || lpad(nextval('public.donor_seq')::text, 5, '0')),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  gender text not null check (gender in ('Male','Female')),
  age integer not null check (age between 18 and 65),
  phone text not null check (phone ~ '^\+?[0-9\s-]{7,15}$'),
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city text not null check (char_length(trim(city)) between 2 and 80),
  address text check (char_length(address) <= 250),
  availability_status boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);
alter table public.donors alter column phone type text using phone::text;
alter table public.donors drop constraint if exists donors_gender_check;
alter table public.donors add constraint donors_gender_check check (gender in ('Male','Female'));
create index if not exists donors_blood_idx on public.donors(blood_group);
create index if not exists donors_city_idx on public.donors(city);
create unique index if not exists donors_phone_normalized_idx
  on public.donors (regexp_replace(phone, '[^0-9]', '', 'g'));

-- ============ HELPERS (SECURITY DEFINER avoids RLS recursion) ============
create or replace function public.is_active_user() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and is_active) $$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'admin') $$;

-- ============ NEW USER TRIGGER ============
-- First user ever becomes active Admin. Everyone else starts INACTIVE staff
-- until an Admin activates them (so open sign-ups never get data access).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;
  insert into public.profiles (id, email, full_name, role, is_active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''),
          case when first_user then 'admin' else 'staff' end, first_user);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.donors   enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "donors_select" on public.donors;
drop policy if exists "donors_insert" on public.donors;
drop policy if exists "donors_update" on public.donors;
drop policy if exists "donors_delete_admin" on public.donors;

create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "donors_select" on public.donors for select to authenticated
  using (public.is_active_user());
create policy "donors_insert" on public.donors for insert to authenticated
  with check (public.is_active_user());
create policy "donors_update" on public.donors for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy "donors_delete_admin" on public.donors for delete to authenticated
  using (public.is_admin());

revoke all on public.donors, public.profiles from anon;
