-- RLS for alarms. Everyone signed in reads; only admins create (OQ-01);
-- admins and technicians update. No delete policy: alarms are kept (REQ-ALM-08).
-- Which columns a technician may change and which status changes are allowed
-- are enforced by the trigger in the next migration, because RLS works on
-- whole rows and cannot tell columns apart.

create policy "Signed-in users can read alarms"
  on public.alarms for select
  to authenticated
  using (true);

create policy "Admins can create alarms"
  on public.alarms for insert
  to authenticated
  with check (
    (select public.current_user_role()) = 'admin'
    and created_by = (select auth.uid())
  );

create policy "Admins and technicians can update alarms"
  on public.alarms for update
  to authenticated
  using ((select public.current_user_role()) in ('admin', 'technician'))
  with check ((select public.current_user_role()) in ('admin', 'technician'));
