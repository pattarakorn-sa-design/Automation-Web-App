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
