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
