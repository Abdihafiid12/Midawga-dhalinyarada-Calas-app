create extension if not exists pgcrypto;
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'staff' check (role in ('admin','staff')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  donor_code text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  gender text not null check (gender in ('Male','Female')),
  age integer not null check (age between 18 and 65),
  phone text not null,
  normalized_phone text not null unique,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city text not null check (char_length(trim(city)) between 2 and 80),
  address text check (char_length(address) <= 250),
  availability_status boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create sequence if not exists donor_seq start 1;
create or replace function set_donor_code() returns trigger language plpgsql as $$
begin
  if new.donor_code is null or new.donor_code = '' then
    new.donor_code := 'BD-' || lpad(nextval('donor_seq')::text, 5, '0');
  end if;
  return new;
end $$;
drop trigger if exists donors_set_code on donors;
create trigger donors_set_code before insert on donors
  for each row execute function set_donor_code();
