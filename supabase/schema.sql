-- Paulus Fun Run — database schema
-- Run this once in the Supabase project's SQL editor (Database > SQL Editor).

create extension if not exists "pgcrypto";

-- Bib numbers are assigned per category so the first digit tells you which
-- race a runner is in at a glance: 2.5K bibs start at 2001, 5K bibs at 5001.
-- Change the start values if you want a different numbering scheme.
create sequence if not exists bib_number_seq_25k start 2001;
create sequence if not exists bib_number_seq_5k start 5001;

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  total_amount integer not null default 0,
  payment_proof_path text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'verified', 'unverified'))
);

-- If registrations already existed from an earlier version of this schema,
-- add the payment_status column used by the committee's admin checklist:
-- 'pending' (needs review) -> 'verified' or 'unverified'.
alter table registrations add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'verified', 'unverified'));

-- Private bucket for payment proof uploads. The app only ever writes/reads
-- this via the server-side service role client, so no public bucket or
-- storage.objects policies are needed.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  bib_number integer not null unique,
  full_name text not null,
  gender text not null check (gender in ('L', 'P')),
  category text not null,
  jersey_size text not null,
  checked_in boolean not null default false,
  checked_in_at timestamptz
);

-- If participants already existed from an earlier version of this schema
-- (with a shared default sequence), drop that default — bib_number is now
-- always assigned explicitly per-category inside create_registration below.
alter table participants alter column bib_number drop default;

create index if not exists participants_registration_id_idx on participants(registration_id);

-- Atomically creates one registration plus all of its participants (and their bib numbers)
-- in a single transaction, so a form submission never leaves a half-written registration behind.
create or replace function create_registration(
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_total_amount integer,
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

  insert into registrations (contact_name, contact_email, contact_phone, total_amount)
  values (p_contact_name, p_contact_email, p_contact_phone, p_total_amount)
  returning id into v_registration_id;

  return query
  insert into participants (registration_id, full_name, gender, category, jersey_size, bib_number)
  select
    v_registration_id,
    p->>'full_name',
    p->>'gender',
    p->>'category',
    p->>'jersey_size',
    case
      when p->>'category' = '5K' then nextval('bib_number_seq_5k')
      else nextval('bib_number_seq_25k')
    end
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
