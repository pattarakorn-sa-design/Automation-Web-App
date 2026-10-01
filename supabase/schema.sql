-- Alarm & Maintenance Management System: database schema
--
-- Generated from supabase/migrations/ by `npm run db:schema`. Do not edit this
-- file by hand: add a migration and run the command again.
--
-- It creates the tables, enums, constraints, indexes, triggers, functions and
-- Row Level Security policies of the public schema, in migration order. It
-- expects a Supabase project (auth.users, auth.uid() and the authenticated
-- role). Sample data is separate, in supabase/seed.sql.

-- ===== 20260929031200_set_updated_at_function.sql =====

-- Shared trigger function that keeps an updated_at column current.
-- Every table with an updated_at column attaches it as a BEFORE UPDATE trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== 20260929031300_create_profiles.sql =====

-- User profiles: one row per auth user, holding the display name and role.
-- REQ-AUTH-04: every user has exactly one role, stored here.

create type public.app_role as enum ('admin', 'technician');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null
    check (char_length(btrim(full_name)) between 1 and 100),
  role public.app_role not null default 'technician',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profile and role of each auth user (1:1 with auth.users).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Deny all access until the policies in the RLS migration are added.
alter table public.profiles enable row level security;

-- Create a profile automatically when a user is added to auth.users.
-- New users start as technician (assumption A-02); an admin promotes them later.
-- security definer: the insert runs as the function owner, because the auth
-- service that creates users has no rights on public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1),
      'User'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users created before this migration ran get a profile too.
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(u.email, '@', 1),
    'User'
  )
from auth.users u
on conflict (id) do nothing;

-- ===== 20260929031400_create_machines.sql =====

-- Machine master data (REQ-MCH-01 to REQ-MCH-04).

create type public.machine_status as enum ('Running', 'Stop', 'Alarm', 'Maintenance');

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  -- The "Machine ID" users see, e.g. M-001 or CNC-0012. The app uppercases it
  -- before saving; the check rejects lowercase, so uniqueness is case-insensitive.
  machine_code text not null unique
    check (machine_code ~ '^[A-Z]{1,4}-[0-9]{3,5}$'),
  name text not null
    check (char_length(btrim(name)) between 1 and 100),
  type text not null
    check (char_length(btrim(type)) between 1 and 50),
  location text not null
    check (char_length(btrim(location)) between 1 and 100),
  status public.machine_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.machines is 'Machine master data.';
comment on column public.machines.machine_code is 'Human-readable Machine ID, unique, uppercase.';

-- Dashboard counts by status and list filters by status/type.
create index machines_status_idx on public.machines (status);
create index machines_type_idx on public.machines (type);

create trigger machines_set_updated_at
  before update on public.machines
  for each row execute function public.set_updated_at();

-- Deny all access until the policies in the RLS migration are added.
alter table public.machines enable row level security;

-- ===== 20260929031500_create_alarms.sql =====

-- Alarm records (REQ-ALM-01 to REQ-ALM-08). Alarms are never deleted.

create type public.alarm_status as enum ('Open', 'In Progress', 'Closed');

create table public.alarms (
  id uuid primary key default gen_random_uuid(),
  -- on delete restrict: a machine with alarms cannot be deleted (BR-MCH-02).
  machine_id uuid not null references public.machines (id) on delete restrict,
  alarm_code text not null
    check (alarm_code ~ '^[A-Z0-9-]{2,20}$'),
  description text not null
    check (char_length(btrim(description)) between 1 and 500),
  -- A few minutes of tolerance for clock differences between browser and server.
  occurred_at timestamptz not null
    check (occurred_at <= now() + interval '5 minutes'),
  cause text
    check (char_length(cause) <= 500),
  action_taken text
    check (char_length(action_taken) <= 1000),
  status public.alarm_status not null default 'Open',
  created_by uuid default auth.uid()
    references public.profiles (id) on delete set null,
  closed_by uuid
    references public.profiles (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- BR-ALM-03: a closed alarm must have a cause and the action taken.
  constraint alarms_closed_requires_details check (
    status <> 'Closed'
    or (
      char_length(btrim(coalesce(cause, ''))) > 0
      and char_length(btrim(coalesce(action_taken, ''))) > 0
    )
  ),
  -- BR-ALM-04: closed_at is set only while closed and cleared on reopen.
  -- closed_by may be null on a closed alarm if that user was later deleted.
  constraint alarms_closed_fields_match_status check (
    (status = 'Closed' and closed_at is not null)
    or (status <> 'Closed' and closed_at is null and closed_by is null)
  ),
  -- Lets maintenance_records reference (alarm, machine) together, so a
  -- maintenance record can only link an alarm of the same machine (BR-MNT-03).
  constraint alarms_id_machine_id_key unique (id, machine_id)
);

comment on table public.alarms is 'Alarm records per machine. Never deleted.';

create index alarms_machine_id_idx on public.alarms (machine_id);
create index alarms_status_idx on public.alarms (status);
create index alarms_alarm_code_idx on public.alarms (alarm_code);
create index alarms_occurred_at_idx on public.alarms (occurred_at desc);

create trigger alarms_set_updated_at
  before update on public.alarms
  for each row execute function public.set_updated_at();

-- Deny all access until the policies in the RLS migration are added.
alter table public.alarms enable row level security;

-- ===== 20260929031600_create_maintenance_records.sql =====

-- Maintenance records (REQ-MNT-01 to REQ-MNT-06).

create type public.maintenance_type as enum ('Corrective', 'Preventive');
create type public.maintenance_status as enum ('Pending', 'In Progress', 'Completed');

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  -- on delete restrict: a machine with maintenance history cannot be deleted (BR-MCH-02).
  machine_id uuid not null references public.machines (id) on delete restrict,
  -- Optional link to the alarm that caused this work (REQ-MNT-03).
  alarm_id uuid,
  -- The technician responsible. Restrict keeps repair history from losing its owner.
  technician_id uuid not null references public.profiles (id) on delete restrict,
  type public.maintenance_type not null,
  problem text not null
    check (char_length(btrim(problem)) between 1 and 1000),
  action_taken text
    check (char_length(action_taken) <= 1000),
  status public.maintenance_status not null default 'Pending',
  start_date date not null,
  end_date date,
  created_by uuid default auth.uid()
    references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- BR-MNT-03: the linked alarm must belong to the same machine.
  -- When alarm_id is null the constraint is not checked.
  constraint maintenance_records_alarm_same_machine_fkey
    foreign key (alarm_id, machine_id)
    references public.alarms (id, machine_id) on delete restrict,
  constraint maintenance_records_end_after_start check (
    end_date is null or end_date >= start_date
  ),
  -- BR-MNT-02: completed work must have the action taken and an end date.
  constraint maintenance_records_completed_requires_details check (
    status <> 'Completed'
    or (
      char_length(btrim(coalesce(action_taken, ''))) > 0
      and end_date is not null
    )
  )
);

comment on table public.maintenance_records is 'Maintenance and repair work per machine.';

create index maintenance_records_machine_id_idx on public.maintenance_records (machine_id);
create index maintenance_records_alarm_id_idx on public.maintenance_records (alarm_id);
create index maintenance_records_technician_id_idx on public.maintenance_records (technician_id);
create index maintenance_records_status_idx on public.maintenance_records (status);
create index maintenance_records_start_date_idx on public.maintenance_records (start_date desc);

create trigger maintenance_records_set_updated_at
  before update on public.maintenance_records
  for each row execute function public.set_updated_at();

-- Deny all access until the policies in the RLS migration are added.
alter table public.maintenance_records enable row level security;

-- ===== 20260929031700_add_current_user_role_function.sql =====

-- Role of the signed-in user, used by RLS policies and triggers.
-- Returns null when there is no signed-in user or the user has no profile.
-- security definer: reads profiles as the owner, so policies on profiles can
-- call it without recursing into their own RLS checks.
-- Call it as (select public.current_user_role()) in policies so Postgres
-- evaluates it once per statement instead of once per row.
create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

-- ===== 20260929031800_add_profiles_policies.sql =====

-- RLS for profiles. Rows are created by the auth trigger and removed with the
-- auth user, so there are no insert or delete policies.

create policy "Signed-in users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- REQ-AUTH-07: admins change other users' roles but never their own, so the
-- system can never be left without an admin by accident.
create policy "Admins can update other users' profiles"
  on public.profiles for update
  to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    and id <> (select auth.uid())
  )
  with check (
    (select public.current_user_role()) = 'admin'
    and id <> (select auth.uid())
  );

-- ===== 20260929031900_add_machines_policies.sql =====

-- RLS for machines (REQ-MCH-01, REQ-MCH-05): everyone signed in reads,
-- only admins write.

create policy "Signed-in users can read machines"
  on public.machines for select
  to authenticated
  using (true);

create policy "Admins can create machines"
  on public.machines for insert
  to authenticated
  with check ((select public.current_user_role()) = 'admin');

create policy "Admins can update machines"
  on public.machines for update
  to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Admins can delete machines"
  on public.machines for delete
  to authenticated
  using ((select public.current_user_role()) = 'admin');

-- ===== 20260929032000_add_alarms_policies.sql =====

-- RLS for alarms. Everyone signed in reads; only admins create (OQ-01);
-- admins and technicians update. No delete policy: alarms are kept (REQ-ALM-08).
-- Which columns a technician may change and which status changes are allowed
-- are enforced by the trigger in the next migration, because RLS works on
-- whole rows and cannot tell columns apart.

create policy "Signed-in users can read alarms"
  on public.alarms for select
  to authenticated
  using (true);

create policy "Admins can create alarms"
  on public.alarms for insert
  to authenticated
  with check (
    (select public.current_user_role()) = 'admin'
    and created_by = (select auth.uid())
  );

create policy "Admins and technicians can update alarms"
  on public.alarms for update
  to authenticated
  using ((select public.current_user_role()) in ('admin', 'technician'))
  with check ((select public.current_user_role()) in ('admin', 'technician'));

-- ===== 20260929032100_enforce_alarm_update_rules.sql =====

-- Alarm update rules that RLS cannot express, enforced for every client:
-- * REQ-ALM-05: only admins edit machine, code, description and occurred time.
-- * BR-ALM-02: only admins touch an alarm once it is closed (reopen).
-- * BR-ALM-01: status may only move Open -> In Progress | Closed,
--   In Progress -> Open | Closed, Closed -> Open.
-- * BR-ALM-04: closed_by / closed_at are set on close and cleared on reopen.
--   Clients cannot write them directly.
-- Requests without a signed-in user (SQL editor, server jobs) skip these checks.

create or replace function public.enforce_alarm_update_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
begin
  if v_uid is null then
    return new;
  end if;

  v_role := public.current_user_role();

  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed'
      using errcode = '42501';
  end if;

  if v_role is distinct from 'admin' then
    if new.machine_id is distinct from old.machine_id
      or new.alarm_code is distinct from old.alarm_code
      or new.description is distinct from old.description
      or new.occurred_at is distinct from old.occurred_at then
      raise exception 'Only admins can edit alarm details'
        using errcode = '42501';
    end if;

    if old.status = 'Closed' then
      raise exception 'Only admins can change a closed alarm'
        using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'Open' and new.status in ('In Progress', 'Closed'))
      or (old.status = 'In Progress' and new.status in ('Open', 'Closed'))
      or (old.status = 'Closed' and new.status = 'Open')
    ) then
      raise exception 'Alarm status cannot change from % to %', old.status, new.status
        using errcode = '23514';
    end if;

    if new.status = 'Closed' then
      new.closed_by := v_uid;
      new.closed_at := now();
    else
      new.closed_by := null;
      new.closed_at := null;
    end if;
  else
    new.closed_by := old.closed_by;
    new.closed_at := old.closed_at;
  end if;

  return new;
end;
$$;

create trigger alarms_enforce_update_rules
  before update on public.alarms
  for each row execute function public.enforce_alarm_update_rules();

-- ===== 20260929032200_add_maintenance_records_policies.sql =====

-- RLS for maintenance_records. Everyone signed in reads; admins create and
-- update any record; technicians create and update only records they are
-- responsible for (BR-MNT-01, OQ-02) and cannot hand them to someone else.
-- No delete policy: the requirement is create, read and update only.

create policy "Signed-in users can read maintenance records"
  on public.maintenance_records for select
  to authenticated
  using (true);

create policy "Admins and responsible technicians can create maintenance records"
  on public.maintenance_records for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (select public.current_user_role()) = 'admin'
      or (
        (select public.current_user_role()) = 'technician'
        and technician_id = (select auth.uid())
      )
    )
  );

create policy "Admins and responsible technicians can update maintenance records"
  on public.maintenance_records for update
  to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    or (
      (select public.current_user_role()) = 'technician'
      and technician_id = (select auth.uid())
    )
  )
  with check (
    (select public.current_user_role()) = 'admin'
    or (
      (select public.current_user_role()) = 'technician'
      and technician_id = (select auth.uid())
    )
  );

-- ===== 20260929041500_prevent_maintenance_created_by_change.sql =====

-- BG-03: who created a maintenance record must stay traceable.
-- The update policy lets admins and the responsible technician edit a record,
-- so without this trigger either of them could rewrite created_by.
-- Requests without a signed-in user (SQL editor, server jobs) are not checked.

create or replace function public.prevent_created_by_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null
    and new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger maintenance_records_prevent_created_by_change
  before update on public.maintenance_records
  for each row execute function public.prevent_created_by_change();

-- ===== 20260929041600_limit_new_user_full_name_length.sql =====

-- profiles.full_name allows 1 to 100 characters. A longer full_name in the
-- sign-up metadata or a long email prefix would fail that check and block the
-- whole user from being created, so cut the name to 100 characters first.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(split_part(new.email, '@', 1), ''),
        'User'
      ),
      100
    )
  );
  return new;
end;
$$;

-- ===== 20260929042000_allow_users_to_edit_own_name.sql =====

-- REQ-AUTH-09: every user can fix their own display name, but nobody can
-- change their own role (REQ-AUTH-07), so at least one admin always remains.
-- Admins keep editing other users' names and roles through the existing policy.
-- RLS works on whole rows, so the policy allows the user's own row and the
-- trigger below rejects any change to its role.

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id = auth.uid()
    and new.role is distinct from old.role then
    raise exception 'You cannot change your own role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

-- ===== 20260929052900_add_admin_list_users_function.sql =====

-- User list for the admin Users page (REQ-AUTH-07). Emails live in auth.users,
-- which clients cannot read, so this function joins them for admins only.
-- Anyone else gets an empty result. Copying emails into profiles would expose
-- every email to technicians through the profiles select policy.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role public.app_role,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, p.full_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.current_user_role() = 'admin'
  order by p.full_name;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- ===== 20261001090000_add_viewer_role.sql =====

-- REQ-AUTH-08 (Bonus 9.3): a read-only Viewer role, e.g. for a production
-- manager. Viewers can sign in and read everything signed-in users read, and
-- write nothing but their own display name (REQ-AUTH-09).
--
-- No policy changes are needed: every write policy and trigger already names
-- the roles it allows ('admin', or 'admin' and 'technician'), so a viewer is
-- refused by RLS everywhere. New users still start as 'technician'; an admin
-- sets 'viewer' on the Users page.
--
-- Kept in its own migration: Postgres does not let a new enum value be used in
-- the same transaction that adds it.

alter type public.app_role add value if not exists 'viewer';

-- ===== 20261001090100_restrict_maintenance_assignee_role.sql =====

-- Bonus 9.3: with the Viewer role, an admin could otherwise assign a
-- maintenance record to a viewer, who can neither see it as their work nor
-- update it. The responsible person must be an admin or a technician.
--
-- Checked when a record is created and when its technician changes, not on
-- other edits, so a record whose technician later became a viewer can still be
-- updated. Applies to every client, including the SQL editor.

create or replace function public.enforce_maintenance_assignee_role()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if tg_op = 'UPDATE' and new.technician_id is not distinct from old.technician_id then
    return new;
  end if;

  select role into v_role from public.profiles where id = new.technician_id;

  -- A missing profile is left to the foreign key, which reports it as 23503.
  if v_role is not null and v_role not in ('admin', 'technician') then
    raise exception 'maintenance_records_technician_role: the responsible person must be an admin or a technician'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger maintenance_records_enforce_assignee_role
  before insert or update on public.maintenance_records
  for each row execute function public.enforce_maintenance_assignee_role();
