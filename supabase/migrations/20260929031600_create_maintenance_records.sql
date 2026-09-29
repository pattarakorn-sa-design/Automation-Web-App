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
