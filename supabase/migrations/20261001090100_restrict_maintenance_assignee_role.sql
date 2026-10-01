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
