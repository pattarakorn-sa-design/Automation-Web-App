-- RLS for machines (REQ-MCH-01, REQ-MCH-05): everyone signed in reads,
-- only admins write.

create policy "Signed-in users can read machines"
  on public.machines for select
  to authenticated
  using (true);

create policy "Admins can create machines"
  on public.machines for insert
  to authenticated
  with check ((select public.current_user_role()) = 'admin');

create policy "Admins can update machines"
  on public.machines for update
  to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Admins can delete machines"
  on public.machines for delete
  to authenticated
  using ((select public.current_user_role()) = 'admin');
