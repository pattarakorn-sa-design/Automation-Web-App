-- REQ-AUTH-08 (Bonus 9.3): a read-only Viewer role, e.g. for a production
-- manager. Viewers can sign in and read everything signed-in users read, and
-- write nothing but their own display name (REQ-AUTH-09).
--
-- No policy changes are needed: every write policy and trigger already names
-- the roles it allows ('admin', or 'admin' and 'technician'), so a viewer is
-- refused by RLS everywhere. New users still start as 'technician'; an admin
-- sets 'viewer' on the Users page.
--
-- Kept in its own migration: Postgres does not let a new enum value be used in
-- the same transaction that adds it.

alter type public.app_role add value if not exists 'viewer';
