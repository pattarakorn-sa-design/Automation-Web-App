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
