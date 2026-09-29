-- profiles.full_name allows 1 to 100 characters. A longer full_name in the
-- sign-up metadata or a long email prefix would fail that check and block the
-- whole user from being created, so cut the name to 100 characters first.

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
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(split_part(new.email, '@', 1), ''),
        'User'
      ),
      100
    )
  );
  return new;
end;
$$;
