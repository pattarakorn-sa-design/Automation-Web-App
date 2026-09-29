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
