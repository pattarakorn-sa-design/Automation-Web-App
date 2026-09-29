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
