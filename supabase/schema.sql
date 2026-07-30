-- Paulus Fun Run — database schema
-- Run this once in the Supabase project's SQL editor (Database > SQL Editor).

create extension if not exists "pgcrypto";

-- Bib numbers are assigned sequentially across the whole event.
-- Change the start value if you want bibs to start somewhere other than 1000.
create sequence if not exists bib_number_seq start 1000;

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  bib_number integer not null unique default nextval('bib_number_seq'),
  full_name text not null,
  gender text not null check (gender in ('L', 'P')),
  category text not null,
  jersey_size text not null,
  checked_in boolean not null default false,
  checked_in_at timestamptz
);

create index if not exists participants_registration_id_idx on participants(registration_id);

-- Atomically creates one registration plus all of its participants (and their bib numbers)
-- in a single transaction, so a form submission never leaves a half-written registration behind.
create or replace function create_registration(
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_participants jsonb
)
returns table (
  registration_id uuid,
  participant_id uuid,
  bib_number integer,
  full_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration_id uuid;
begin
  if jsonb_array_length(p_participants) = 0 then
    raise exception 'At least one participant is required';
  end if;

  insert into registrations (contact_name, contact_email, contact_phone)
  values (p_contact_name, p_contact_email, p_contact_phone)
  returning id into v_registration_id;

  return query
  insert into participants (registration_id, full_name, gender, category, jersey_size)
  select
    v_registration_id,
    p->>'full_name',
    p->>'gender',
    p->>'category',
    p->>'jersey_size'
  from jsonb_array_elements(p_participants) as p
  returning participants.registration_id, participants.id, participants.bib_number, participants.full_name;
end;
$$;

-- Row Level Security: no policies are defined below, so RLS denies all
-- access by default for the anon/public role. The app never uses the anon
-- key to touch these tables directly — every read and write (including the
-- verify/scan page) goes through Next.js server code using the service role
-- key, which bypasses RLS. This keeps the full participant list from being
-- enumerable by anyone holding the public anon key.
alter table registrations enable row level security;
alter table participants enable row level security;
