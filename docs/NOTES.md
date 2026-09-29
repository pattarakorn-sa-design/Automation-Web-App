# Team Notes

Things worth knowing that are not obvious from the code. Read this after pulling.
Add a new entry at the top when you change something the other person will trip over.
Keep entries short, in English, and do not mention AI tools.

## Auth (`features/auth/`, `proxy.ts`)

- `proxy.ts` refreshes the session cookie and sends signed-out users to `/login`. To make a page
  public, add its path to `PUBLIC_PATHS` in `lib/supabase/proxy.ts`. The proxy does not check roles.
- In Server Components and Server Actions (both run on the server):
  - `getCurrentUser()` returns `{ id, email, fullName, role }` or `null`. It is cached per request,
    so calling it in a layout and a page costs one query.
  - `requireUser()` redirects to `/login` when nobody is signed in.
  - `requireRole("admin")` also redirects other roles to `/?error=forbidden`, where the home page
    shows "คุณไม่มีสิทธิ์เข้าหน้านั้น". Call it at the top of every admin page and admin Server Action.
- These helpers are `server-only`. A Client Component (e.g. a navbar that needs the role) gets the
  user as a prop from a Server Component parent instead of importing them.
- Logout: `<form action={signOut}><button type="submit">Logout</button></form>` with `signOut`
  from `features/auth/actions.ts`. It works in both Server and Client Components.
- Sign-up is turned off in Supabase (Authentication > Sign In / Providers). New accounts are added
  by the owner in the Supabase dashboard and start as `technician`.
- `proxy.ts` runs on every page, so if `NEXT_PUBLIC_SUPABASE_URL` or
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is missing, every page fails, not just the ones that load
  data. When creating a new Vercel environment or a new local clone, set both before anything else.
- Known limitation, accepted: two admins demoting each other at the same moment could leave no
  admin. It needs two admins acting within the same second, so it is not guarded. To recover, the
  Supabase project owner sets `role = 'admin'` on a profile in the Supabase dashboard.
- `/users` (admin only) edits other users' names and roles; `/profile` lets anyone edit their own
  name. Emails come from the `admin_list_users()` database function, which returns nothing for
  non-admins. `profiles` has no email column on purpose, so technicians cannot see emails.

## Forms pattern (see `features/auth/LoginForm.tsx`, `features/users/`)

- Server Action signature for `useActionState`: `(prevState, formData) => Promise<FormState>`
  returning `fieldErrors` (from `z.flattenError(...).fieldErrors`), `formError` or `success`.
- The Client Component form runs the same zod schema in `onSubmit` and calls `preventDefault()`
  when it fails, so errors show instantly; the Server Action validates again.
- Use `noValidate` on the form so the browser's English popups do not replace the Thai messages.
- After an update, check `.select("id")` returned a row: RLS silently skips rows the user may
  not change instead of returning an error.
- Hide the form-level error while client-side field errors are shown, and hide the "saved"
  message once the user edits the form again (`onChange` on the form), so old messages do not
  stay next to new ones.

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
- Form pieces, for the login page and later forms. None of them touches auth or data, so wire them to
  your own Server Action:
  - `LoginCard`: centred card with the title. Pass `error` for a form-level message such as
    "Email หรือรหัสผ่านไม่ถูกต้อง" (shown as an alert). Put the fields and button inside as children.
  - `TextField`: label plus input. Pass `name`, `label`, optional `error` (shown under the field)
    and `hint`. Other input props (`type`, `autoComplete`, `required`, `defaultValue`) pass through.
    It is uncontrolled, so it works directly inside `<form action={serverAction}>`.
    The input `id` defaults to `field-<name>`. When one page has several forms with a field of the same
    name (one row per user or machine), pass a unique `id`, e.g. `id={`name-${row.id}`}`; the error and
    hint ids are built from it, so the label and error text point at the right input.
  - `SubmitButton`: a Client Component that disables itself and shows `pendingLabel` (default
    `"Saving..."`, UI text is English) while the parent `<form action>` is submitting (it uses
    `useFormStatus`, so it must be inside the form).
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
