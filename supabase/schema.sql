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
  payment_status text not null default 'pending' check (payment_status in ('pending', 'verified', 'unverified')),
  -- Nullable: unset until a payment has actually happened. Every public
  -- registrant pays by bank transfer, but a manually-entered registration
  -- that hasn't been paid yet (still 'pending') has no method to record —
  -- the committee sets it once the walk-in actually pays (cash or transfer).
  payment_method text check (payment_method in ('cash', 'transfer'))
);

-- If registrations already existed from an earlier version of this schema,
-- add the payment_status column used by the committee's admin checklist:
-- 'pending' (needs review) -> 'verified' or 'unverified'.
alter table registrations add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'verified', 'unverified'));

-- Tracks how a registration was paid. Originally added as not-null with a
-- 'transfer' default, which meant every manually-entered "belum bayar"
-- registration silently got stamped as 'cash' even though no payment had
-- happened yet — these two lines make it nullable so "no method yet" is a
-- real state instead of a fake default.
alter table registrations add column if not exists payment_method text check (payment_method in ('cash', 'transfer'));
alter table registrations alter column payment_method drop not null;
alter table registrations alter column payment_method drop default;

-- One-time fix for rows created while the bug above was live: any 'pending'
-- (i.e. not yet paid) registration that ended up with payment_method='cash'
-- got that from the old silent default, not a real choice — the public
-- registration form never sets 'cash', so this only touches admin-entered
-- rows. Clearing it back to null is a no-op once already fixed.
update registrations set payment_method = null where payment_status = 'pending' and payment_method = 'cash';

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
  checked_in_at timestamptz,
  age_group text not null default 'dewasa' check (age_group in ('anak', 'dewasa')),
  -- Race-day attendance, separate from `checked_in` (race pack collection, which
  -- happens up to a week before race day and isn't the same as who actually shows up).
  attended boolean not null default false,
  attended_at timestamptz
);

alter table participants add column if not exists attended boolean not null default false;
alter table participants add column if not exists attended_at timestamptz;

-- If participants already existed from an earlier version of this schema
-- (with a shared default sequence), drop that default — bib_number is now
-- always assigned explicitly per-category inside create_registration below.
alter table participants alter column bib_number drop default;

-- Distinguishes kids from adults, since jersey sizing differs between the
-- two — needed for manually-entered registrations where the committee
-- picks this directly.
alter table participants add column if not exists age_group text not null default 'dewasa' check (age_group in ('anak', 'dewasa'));

create index if not exists participants_registration_id_idx on participants(registration_id);

-- The original 5-parameter version of create_registration (before
-- p_payment_status/p_payment_method existed) must be dropped explicitly —
-- Postgres treats a changed parameter list as a distinct overload rather
-- than replacing it, so without this, calls with only the original 5
-- arguments (i.e. every public self-registration) became ambiguous between
-- the two overloads and started failing with PGRST203. This line is safe
-- to re-run: it's a no-op once the old overload is already gone.
drop function if exists create_registration(text, text, text, integer, jsonb);

-- Atomically creates one registration plus all of its participants (and their bib numbers)
-- in a single transaction, so a form submission never leaves a half-written registration behind.
-- p_payment_status / p_payment_method default to the public self-registration flow's values
-- (pending review, paid by transfer); the committee's manual-entry form passes explicit values
-- instead (e.g. 'verified' + 'cash' for a walk-in who already paid). Each participant object in
-- p_participants may omit 'age_group' — it defaults to 'dewasa' when not supplied, so the public
-- registration form (which doesn't collect this) doesn't need to change.
create or replace function create_registration(
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_total_amount integer,
  p_participants jsonb,
  p_payment_status text default 'pending',
  p_payment_method text default 'transfer'
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

  insert into registrations (contact_name, contact_email, contact_phone, total_amount, payment_status, payment_method)
  values (p_contact_name, p_contact_email, p_contact_phone, p_total_amount, p_payment_status, p_payment_method)
  returning id into v_registration_id;

  return query
  insert into participants (registration_id, full_name, gender, category, jersey_size, age_group, bib_number)
  select
    v_registration_id,
    p->>'full_name',
    p->>'gender',
    p->>'category',
    p->>'jersey_size',
    coalesce(p->>'age_group', 'dewasa'),
    case
      when p->>'category' = '5K' then nextval('bib_number_seq_5k')
      else nextval('bib_number_seq_25k')
    end
  from jsonb_array_elements(p_participants) as p
  returning participants.registration_id, participants.id, participants.bib_number, participants.full_name;
end;
$$;

-- Hands out the next bib number for a category, mirroring the per-category
-- sequence logic inside create_registration. Used when an admin edits a
-- participant's category after the fact (PATCH /api/participants/[id]) — the
-- participant needs a bib number from the new category's range, not the one
-- they were originally assigned.
create or replace function next_bib_number(p_category text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_category = '5K' then
    return nextval('bib_number_seq_5k');
  else
    return nextval('bib_number_seq_25k');
  end if;
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

-- Paulus Interfaith Fun Walk — a separate, simpler registration track alongside
-- the main run. No BIB numbers, jersey sizes, or categories: it's a flat
-- per-head charity fee with no race pack/medal, so it gets its own tables
-- entirely rather than reusing registrations/participants with a pile of
-- irrelevant nullable columns.
create table if not exists charity_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  total_amount integer not null default 0,
  payment_proof_path text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'verified', 'unverified')),
  payment_method text check (payment_method in ('cash', 'transfer'))
);

create table if not exists charity_participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references charity_registrations(id) on delete cascade,
  full_name text not null,
  gender text not null default 'L' check (gender in ('L', 'P')),
  institution text not null default ''
);

alter table charity_participants add column if not exists gender text not null default 'L' check (gender in ('L', 'P'));
alter table charity_participants add column if not exists institution text not null default '';

create index if not exists charity_participants_registration_id_idx on charity_participants(registration_id);

-- The original (full_name, gender)-only version of create_charity_registration
-- must be dropped explicitly — see create_registration above for why a
-- changed parameter list needs this.
drop function if exists create_charity_registration(text, text, text, integer, jsonb);

-- Atomically creates one charity registration plus all of its participants,
-- mirroring create_registration's transactional guarantee. p_participants is
-- an array of {full_name, gender, institution} objects.
create or replace function create_charity_registration(
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_total_amount integer,
  p_participants jsonb
)
returns table (
  registration_id uuid,
  participant_id uuid,
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

  -- Every charity registration comes through this public, pay-by-transfer
  -- form — there's no cash/manual-entry admin flow for the Fun Walk (yet),
  -- so payment_method is always 'transfer'.
  insert into charity_registrations (contact_name, contact_email, contact_phone, total_amount, payment_method)
  values (p_contact_name, p_contact_email, p_contact_phone, p_total_amount, 'transfer')
  returning id into v_registration_id;

  return query
  insert into charity_participants (registration_id, full_name, gender, institution)
  select v_registration_id, p->>'full_name', p->>'gender', p->>'institution'
  from jsonb_array_elements(p_participants) as p
  returning charity_participants.registration_id, charity_participants.id, charity_participants.full_name;
end;
$$;

alter table charity_registrations enable row level security;
alter table charity_participants enable row level security;

-- Race-day photo gallery. Photos are watermarked server-side at upload time
-- (see lib/watermark.ts) and tagged with every BIB number visible in them —
-- tagging is manual (committee reviews photos after the event), since
-- automatic BIB detection from race photos is unreliable and costly for a
-- ~390-runner event. bib_numbers is an array because group shots feature
-- more than one runner; the GIN index makes "does this array contain X"
-- lookups fast for the public search-by-BIB page.
create table if not exists race_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  storage_path text not null,
  bib_numbers integer[] not null default '{}'
);

create index if not exists race_photos_bib_numbers_idx on race_photos using gin (bib_numbers);

-- Public bucket (unlike payment-proofs): race photos are meant to be freely
-- viewed/downloaded by anyone searching their BIB number, and every photo is
-- watermarked before it's ever written here, so there's nothing sensitive to
-- gate behind a signed URL.
insert into storage.buckets (id, name, public)
values ('race-photos', 'race-photos', true)
on conflict (id) do nothing;

alter table race_photos enable row level security;
