# Team Notes

Things worth knowing that are not obvious from the code. Read this after pulling.
Add a new entry at the top when you change something the other person will trip over.
Keep entries short, in English, and do not mention AI tools.

## Maintenance (`features/maintenance/`, `app/maintenance/`)

- Who may edit: `canEditMaintenance()` in `rules.ts` (admin: every record, technician: only where
  they are `technician_id`). RLS enforces the same rule. The Edit link and the edit page use it.
- Technicians never choose the technician: the form shows their name, and the Server Action
  replaces whatever was submitted with their own id (`responsibleTechnician()`), so they cannot
  create or hand a record to someone else.
- The "Caused by alarm" select only lists alarms of the selected machine (BR-MNT-03), from the
  200 most recent alarms plus the one already linked. The database rejects a mismatch too; that
  error is shown under the alarm field.
- `start_date` / `end_date` are `date` columns: use `<input type="date">`, `bangkokToday()`,
  `isDateValue()` and `formatDate()` from `lib/format.ts`. No time zone conversion is needed.
- `/maintenance/new?machine=<id>&alarm=<id>` preselects the fields. The alarm page links to it
  ("Record maintenance") and the machine page links with the machine only.
- Option lists for selects: `listProfileOptions()` (`features/users/queries.ts`) and
  `listAlarmOptions()` (`features/alarms/queries.ts`).

## Alarms (`features/alarms/`, `app/alarms/`)

- Status rules live in `features/alarms/status.ts` (`nextStatuses`, `canChangeStatus`,
  `canUpdateAlarm`) and mirror the database trigger. If a rule changes, change both, or the page
  will offer an option the database then refuses (shown as "เปลี่ยนสถานะนี้ไม่ได้ ...").
- Two forms: `AlarmDetailsForm` (admin: machine, code, description, time, cause) on `/alarms/new`
  and `/alarms/[id]/edit`, and `AlarmStatusForm` (admin and technician: status, cause, action
  taken) on `/alarms/[id]`. Technicians see a closed alarm read-only.
- `<input type="datetime-local">` has no time zone. Values are read and written as Bangkok time
  with `toBangkokInputValue()` / `fromBangkokInputValue()` in `lib/format.ts`, because the server
  (Vercel) runs in UTC. Never pass a datetime-local string straight to `new Date()`.
- `/alarms/new?machine=<id>` preselects the machine; the machine page links to it for admins.
- Machine status does not change when an alarm opens or closes (OQ-03). Admins change it on the
  machine's edit page.
- `listMachineOptions()` in `features/machines/queries.ts` returns every machine for a `<select>`.

## Form fields (`components/`)

- `TextAreaField` and `SelectField` take the same props as `TextField` (`label`, `name`, optional
  `id`, `error`, `hint`) and use the same styling. `SelectField` takes `options` as
  `{ value, label }[]` and an optional `placeholder` shown as an empty first option.

## Machines (`features/machines/`, `app/machines/`)

- List filters live in the URL: `/machines?q=cnc&status=Running&type=Robot&page=2`.
  `parseMachineFilters()` drops invalid values instead of failing, and the filter form uses
  `next/form` with GET, so refresh and shared links keep the same results.
- `filters.ts` also has `containsPattern()` (safe ILIKE text for `.or(...)` searches),
  `pageRange()` and `pageCount()` (20 rows per page). Reuse them for the Alarm and Maintenance lists.
- Database errors become Thai messages in `errors.ts` by SQLSTATE: `23505` duplicate Machine ID
  (shown under the field), `23503` machine still has alarms or maintenance, `42501` no permission.
- React resets a form after its action runs, so a failed save would wipe what the user typed.
  The Server Action returns the submitted `values` and the form uses them as `defaultValue`.
- Machine types have no table of their own: the Type filter and the form's suggestions read the
  distinct `type` values from `machines`.
- `MachineTable` shows each machine as a card below `md` (768 px) and as a table from `md` up. A
  table with five columns does not fit 360 px, and the status was off-screen when it only scrolled
  sideways. Use the same card-plus-table pattern for the Alarm and Maintenance lists.
- Every filter control and button has the same height (`h-10`), so the search box, selects and buttons
  line up in one row. Keep that when adding filters.
- `@next/next/no-html-link-for-pages` fails lint when a plain `<a>` points at a real page, even in
  a test. Use `<Link>` in app code, or an in-page `#anchor` in tests.
- Dates: `formatDateTime()` in `lib/format.ts` shows timestamps in Asia/Bangkok time.

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
- `Navbar`: the top menu, rendered once in `app/layout.tsx` only when `getCurrentUser()` returns a
  user, so it never shows on `/login`. Do not add your own header to a page. It shows Dashboard,
  Machines, Alarms, Maintenance, and Users for admins only, plus the user's name (link to `/profile`),
  role and a Logout button. On screens below `lg` (1024 px) the menu folds behind a button.
  - To add or hide a menu item, edit `NAV_ITEMS` in `components/navigation.ts` (`roles` limits who
    sees it). This only hides links: the page must still call `requireRole(...)`.
  - The menu links to pages that arrive with the feature PRs (`/machines`, `/alarms`,
    `/maintenance`), so those links show a 404 until the page exists.
  - The temporary home page still has its own Logout button and Profile/Users links. Remove them
    when the real Dashboard replaces that page (phase 7).
  - Because the layout reads the session, every page (including not-found) is rendered on demand.
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
  - Example: `features/auth/LoginForm.tsx` is built from all three. It wraps the form in `LoginCard`
    (passing `state.formError` as `error`) and keeps A's `useActionState` and zod validation as they
    were, so copy that file as the starting point for new forms.
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
- To look at a page at 360 px or in dark mode without a real login, make a temporary page such as
  `app/preview/page.tsx` that renders the components with sample data, and add its path to
  `PUBLIC_PATHS` in `lib/supabase/proxy.ts`. Neither change is ever committed: list the preview folder
  in `.git/info/exclude`, undo the proxy edit, and check `git status` before every commit. A headless
  Chrome can then take screenshots (emulate `prefers-color-scheme` to see both themes).

## Next.js 16

- This is not the Next.js from older docs. Read the matching guide in `node_modules/next/dist/docs/`
  before using an API you are not sure about (for example `proxy.ts` replaces `middleware.ts`).
