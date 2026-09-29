-- Shared trigger function that keeps an updated_at column current.
-- Every table with an updated_at column attaches it as a BEFORE UPDATE trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
