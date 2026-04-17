-- Member onboarding expansion: identity fields + storage paths + RFID binding
-- Future phases (3-5) will populate photo_path, signature_path, rfid_uid.
-- Phase 2 populates first_name, last_name, id_number, phone, residency_status.

alter table public.members
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists id_number text,
  add column if not exists phone text,
  add column if not exists residency_status text,
  add column if not exists photo_path text,
  add column if not exists signature_path text,
  add column if not exists rfid_uid text;

-- residency_status: only 'local' or 'tourist' (nullable for legacy rows).
alter table public.members
  drop constraint if exists members_residency_status_check;

alter table public.members
  add constraint members_residency_status_check
  check (residency_status is null or residency_status in ('local','tourist'));

-- RFID UID uniqueness scoped per club (null rows excluded by the partial index).
create unique index if not exists members_club_rfid_uid_uniq
  on public.members (club_id, rfid_uid)
  where rfid_uid is not null;

-- Backfill: split existing full_name into first/last where a space is present.
-- Single-word names and already-populated rows are left alone.
update public.members
set first_name = split_part(full_name, ' ', 1),
    last_name  = trim(substring(full_name from position(' ' in full_name) + 1))
where full_name is not null
  and first_name is null
  and last_name  is null
  and position(' ' in full_name) > 0;
