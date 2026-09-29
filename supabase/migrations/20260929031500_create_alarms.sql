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
