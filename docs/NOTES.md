# Team Notes

Things worth knowing that are not obvious from the code. Read this after pulling.
Add a new entry at the top when you change something the other person will trip over.
Keep entries short, in English, and do not mention AI tools.

## Database (`supabase/migrations/`, `types/database.ts`)

- Schema changes are SQL files in `supabase/migrations/`, applied in filename order in the
  Supabase SQL Editor. Never edit a migration that has already been applied; add a new one.
- `types/database.ts` is generated from the live database. Do not edit it by hand. After a
  schema change, run `npx supabase login` once, then `npm run db:types`, and commit the result.
- Row types: `import type { Tables, Enums } from "@/types/database"`, then
  `Tables<"machines">` or `Enums<"machine_status">`.
- `db:types` is tied to the project ref in `package.json` (not a secret). Only someone with access
  to that Supabase project can run it, so the generated file is committed for everyone else.
- RLS is on for every table. Anonymous users can read nothing. Technicians cannot write machines,
  cannot create alarms, and can only write maintenance records where they are the technician.
  Alarm status changes and who may edit which alarm columns are enforced by a database trigger.
  `created_by` on alarms and maintenance records cannot be changed after insert.
- A technician can only create a maintenance record with `technician_id` = themselves, so the
  maintenance form must lock the Technician field to the current user for technicians.
- Every user can update their own `full_name`, but nobody can change their own `role` (a trigger
  rejects it), so there is always at least one admin left. Admins can change other users' names
  and roles.
- The alarm and maintenance triggers skip their checks when there is no signed-in user
  (SQL Editor, secret key). Server Actions that write alarms or maintenance records must use the
  user's client from `lib/supabase/server.ts`, never `SUPABASE_SECRET_KEY`, or the status rules
  and `closed_by` / `closed_at` will not be applied.

## Seed data (`supabase/seed.sql`)

- Do not insert into `auth.users` or `profiles`: profiles are created by a trigger when a user is
  added in Authentication. Create at least one test user before running the seed, and pick
  existing profile ids with a subquery (e.g. for `technician_id`, which is required).
- The SQL Editor has no signed-in user, so triggers do not fill `closed_by` / `closed_at`.
  A seeded alarm with status `Closed` must set `closed_at`, `cause` and `action_taken` itself.
- A seeded `Completed` maintenance record needs `action_taken` and `end_date`.
- `alarms.occurred_at` cannot be in the future.
- How to run it: apply the migrations, create at least one user, then paste `supabase/seed.sql`
  into the SQL Editor and run it. Without any user it stops with a clear message and inserts nothing.
- It is safe to run again: if the sample machines (`CNC-001` ... `PMP-001`) already exist it does
  nothing. To reload, delete those machines and their alarms and maintenance records first.
- What it adds: 10 machines (Running 6, Stop 2, Alarm 1, Maintenance 1), 9 alarms (Open 3,
  In Progress 2, Closed 4) and 8 maintenance records (Completed 4, In Progress 2, Pending 2).
  Maintenance records are assigned in turn to the technicians that exist; if there are none it uses
  every profile, so it also works with a single admin.
- The counts above are what the Dashboard should show on a fresh seed (see TC-DSH-01 to 04 in
  `docs/TEST_CHECKLIST.md`).

## Shared UI components (`components/`)

Import them instead of writing your own, so every page looks the same.

- `StatusBadge`: `<StatusBadge status="Running" />`. `status` is `"Running" | "Stop" | "Alarm" | "Maintenance"`.
  It exports the `MachineStatus` type. When `types/` gets the database types, switch the import to those.
  It only covers machine status; alarm and maintenance statuses need their own badge.
- `EmptyState`: default text is "ไม่พบข้อมูล". Optional `title`, `description`, `action`.
  Use it instead of an empty table. It is safe in Server Components.
- `ErrorState`: `role="alert"` with a Thai default message. Optional `title`, `message`, `action`
  (put a retry link or button in `action`). Safe in Server Components.
- `ConfirmDialog`: a Client Component built on the native `<dialog>`. You control it with the `open`
  prop and the `onConfirm` / `onCancel` callbacks. Set `destructive` for delete actions and
  `pending` while the Server Action runs; both buttons are disabled while `pending` is true.
  Esc and a click on the backdrop call `onCancel`.
- These components have `dark:` classes already, so they follow the OS colour scheme.

## Testing (Vitest)

- Run tests with `npm test` (it runs `vitest run` once, no watch mode, so CI never hangs).
- Config is `vitest.config.mts`. Test files are `*.test.ts` / `*.test.tsx` next to the code they test.
- The `@/` import alias works in tests through `resolve.tsconfigPaths`. Do not add `vite-tsconfig-paths`;
  Vitest 5 supports it natively and warns if the plugin is installed.
- Environment is `node`. Add `jsdom` and Testing Library only when a component test needs them.
  Components without state can be tested with `renderToStaticMarkup` from `react-dom/server`
  (see `components/StatusBadge.test.tsx`).
- `lib/supabase/env.ts` reads `process.env` at import time. In tests, use `vi.stubEnv(...)`, then
  `vi.resetModules()` and a dynamic `import()` (see `lib/supabase/env.test.ts`).

## Dependencies

- `@types/node` is `^22` (was `^20`). Vitest 5 has a peer dependency on `@types/node` 22 or newer, so
  `npm install` fails with ERESOLVE on `^20`.
- `npm install` prints an `allow-scripts` warning about `unrs-resolver`. It is harmless.

## CI (`.github/workflows/ci.yml`)

- Runs on every push and on pull requests into `main`: `npm ci`, `npm run lint`, `npm run build`, `npm test` (Node 22).
- `next build` needs the two `NEXT_PUBLIC_SUPABASE_*` variables to exist, so the workflow sets placeholder
  values. No real Supabase key is used in CI. If a build or test starts calling Supabase for real, switch
  those two values to GitHub Secrets (Settings > Secrets and variables > Actions).
- CI must be green before a PR is merged.

## Local checks

- `npx tsc --noEmit` reports `Cannot find name 'LayoutProps'` on a fresh clone. Those types are generated by
  Next.js, so run `npm run build` (or `npx next typegen`) once first, then `tsc` passes.
- `.env.local` is created by hand from `.env.example` and is git-ignored. Never commit it.

## Next.js 16

- This is not the Next.js from older docs. Read the matching guide in `node_modules/next/dist/docs/`
  before using an API you are not sure about (for example `proxy.ts` replaces `middleware.ts`).
