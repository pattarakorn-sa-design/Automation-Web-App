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
