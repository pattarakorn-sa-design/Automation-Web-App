-- RLS for maintenance_records. Everyone signed in reads; admins create and
-- update any record; technicians create and update only records they are
-- responsible for (BR-MNT-01, OQ-02) and cannot hand them to someone else.
-- No delete policy: the requirement is create, read and update only.

create policy "Signed-in users can read maintenance records"
  on public.maintenance_records for select
  to authenticated
  using (true);

create policy "Admins and responsible technicians can create maintenance records"
  on public.maintenance_records for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (select public.current_user_role()) = 'admin'
      or (
        (select public.current_user_role()) = 'technician'
        and technician_id = (select auth.uid())
      )
    )
  );

create policy "Admins and responsible technicians can update maintenance records"
  on public.maintenance_records for update
  to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    or (
      (select public.current_user_role()) = 'technician'
      and technician_id = (select auth.uid())
    )
  )
  with check (
    (select public.current_user_role()) = 'admin'
    or (
      (select public.current_user_role()) = 'technician'
      and technician_id = (select auth.uid())
    )
  );
