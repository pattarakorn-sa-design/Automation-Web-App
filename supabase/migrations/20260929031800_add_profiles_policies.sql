-- RLS for profiles. Rows are created by the auth trigger and removed with the
-- auth user, so there are no insert or delete policies.

create policy "Signed-in users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- REQ-AUTH-07: admins change other users' roles but never their own, so the
-- system can never be left without an admin by accident.
create policy "Admins can update other users' profiles"
  on public.profiles for update
  to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    and id <> (select auth.uid())
  )
  with check (
    (select public.current_user_role()) = 'admin'
    and id <> (select auth.uid())
  );
