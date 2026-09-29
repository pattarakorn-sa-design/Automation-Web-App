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
