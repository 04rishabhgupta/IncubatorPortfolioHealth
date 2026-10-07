# Supabase Migration Plan

**Status:** Draft for team review · **Owner:** Rishabh Gupta · **Last updated:** 2026-10-07

## Goal

Move Folio OS off mock data and browser storage. All startup and portfolio data will live in Supabase (Postgres + Auth), with access enforced in the database rather than in the UI.

## Current state

| Area | Today | Where |
|---|---|---|
| Data storage | One zustand store with 13 collections, seeded from TS files and persisted to `localStorage`. Each browser has its own copy; nothing is shared between users. | `src/store/index.ts`, `src/data/seed/*` |
| Data access | 24 files use `useStore`; ~25 call sites invoke store actions (`updateStartup`, `addMentorRequest`, `upsertMetric`, …). | `src/app/**`, `src/components/**` |
| Side effects | Store actions recompute investibility + AI analysis, write activity logs and create notifications. | `src/store/index.ts`, `src/lib/aiAnalysis.ts` |
| Permissions | Client-side only: `scopeStartups()` and `can()`. Not a security boundary. | `src/lib/rbac.ts`, `src/lib/rbac.test.ts` |
| Users & login | Hardcoded user list with demo passwords; 14 files import it directly. Navbar has a persona switcher. | `src/data/seed/users.ts`, `src/components/layout/TopNavbar.tsx` |
| Route protection | Client-side redirect after mount. | `src/components/AuthGuard.tsx` |
| Founder portal | Public `/founder/[token]` page; finds startup by plain-text `founderToken`; writes submissions, milestones, data-request status. | `src/app/founder/[token]/page.tsx` |
| FITT tracker | Large nested object on `startup.fittTracker`; edited as a whole (Excel import or `updateStartup`). | `src/types/index.ts`, `src/lib/excelService.ts` |
| Clock | Fixed `DEMO_TODAY = '2026-10-05'`, used in 8 files. | `src/lib/clock.ts` |

## Architecture

1. **Keep the `useStore` interface; replace its internals.** After login, the store hydrates from Supabase instead of seed files. Actions become async: persist to Supabase, then update local state. Screens keep calling the same functions. At incubator scale (dozens of startups, a few thousand rows) loading the user's full scope up front is fine; per-page queries can come later.
2. **Writes go through Next.js Server Actions** using the `@supabase/ssr` server client with the user's session, so RLS still applies. Scoring, activity logs and notifications run server-side in the existing TypeScript, so a client can't skip or tamper with them. Multi-step writes that must be atomic go into Postgres functions (RPC).
3. **Reads go straight from the browser client.** RLS limits each role to its own startups.
4. **FITT tracker is stored as one `jsonb` column initially.** Split out sub-collections (monthly check-ins, support log) only when there's a need to query them independently.

## Environment and workflow

**One Supabase project, managed from the dashboard (no Supabase CLI).**

- **Single project until real data.** All data is demo data today, so one project is enough. Before the first real startup is entered, create a separate production project (decision D5). Until then, everything in the project is treated as disposable.
- **SQL lives in git; the dashboard only runs it.** Every schema, RLS, function or trigger change is a numbered file in `supabase/sql/` (e.g. `001_schema.sql`, `002_rls.sql`, `003_functions.sql`). Changes go through a PR. After approval, the author runs the file in the dashboard SQL editor and notes it in the PR.
- **No ad-hoc dashboard edits** to tables, policies or functions. If a quick fix is made in the dashboard, it is written back to a new SQL file the same day.
- **Why this matters:** RLS is the security boundary. Keeping it in git makes policy changes reviewable, keeps RLS and `can()` in sync, and lets us rebuild the schema on the production project by running the files in order.
- **Applied-files log:** a `supabase/sql/APPLIED.md` table (file, date, applied by) records what has been run on each project.

## Phase 0: Setup

- [ ] Create one Supabase project in the dashboard, region `ap-south-1` (Mumbai) pending decision D1.
- [ ] Turn off public sign-ups (Authentication settings); users are invite-only.
- [ ] Create `supabase/sql/` and `supabase/sql/APPLIED.md` in the repo (see *Environment and workflow*).
- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`.
- [ ] Add `src/lib/supabase/client.ts` (browser), `server.ts` (server, user session) and `admin.ts` (service role, **server-only**; never imported from client code).
- [ ] Generate types into `src/types/database.ts`, either by downloading them from the dashboard or with the one-off command `npx supabase gen types typescript --project-id <project-id>` (no CLI setup needed). Regenerate after every applied SQL file that changes tables.
- [ ] Add a mapping layer between DB `snake_case` rows and the existing camelCase types in `src/types/index.ts`.
- [ ] Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_DEMO_MODE`. Add `.env.example`; share real values through a password manager, never in git.

**Done when:** the app connects to the Supabase project and builds with generated types.

## Phase 1: Schema, RLS and seed

### Tables

All IDs are `uuid`; every table has `created_at` and `updated_at`.

| Table | Notes |
|---|---|
| `profiles` | 1:1 with `auth.users`. `role` enum (`ADMIN` / `INVESTMENT_MANAGER` / `INVESTMENT_ASSOCIATE`), `label`, `manager_id` → `profiles`. Check: associates must have a manager. |
| `startups` | Current fields, plus `investibility jsonb`, `ai_analysis jsonb`, `reg_tags text[]`, `created_by`. Grants as `numeric(14,2)`. `trl` checked 1–9. |
| `startup_fitt_trackers` | `startup_id` (PK, FK), `data jsonb`, `checked_on`. |
| `founder_links` | `startup_id`, `token_hash`, `expires_at`, `revoked_at`. Replaces plain-text `founderToken`. |
| `team_members` | As today. |
| `milestones` | As today. |
| `monthly_metrics` | Unique on `(startup_id, month)`. |
| `health_assessments` | `dimensions jsonb`, `actions jsonb`; status transitions enforced (see RLS). |
| `data_requests` | `custom_questions jsonb`, `milestone_ids uuid[]`. |
| `founder_submissions` | `payload jsonb`. |
| `mentors` | As today. |
| `mentor_requests` | `ranked jsonb`, `expertise_needed text[]`. |
| `mentor_matches` | As today, minus the `sessions` array. |
| `mentor_sessions` | Moved out of the match's `sessions` array. |
| `founder_action_items` | As today. |
| `activity_logs` | Insert-only (no update/delete grants). |
| `notifications` + `notification_recipients` | Read state per recipient (`recipient_id`, `read_at`). Today `read` is a single shared flag, which breaks with multiple real users. |
| `regulatory_items` | Reference data; admin-only writes. |

### Row-level security

Mirror `can()` in `src/lib/rbac.ts`:

- Helper functions (`security definer`, `stable`): `current_role()` and `can_access_startup(startup_id)`.
  - Admin → all startups.
  - Manager → `startups.manager_id = auth.uid()`.
  - Associate → `startups.associate_id = auth.uid()`.
- Every startup-scoped table reuses `can_access_startup(startup_id)` for select/insert/update.
- `manager_id` / `associate_id` cannot be updated directly (revoke column update). Changes go through `update_assignment()` RPC, which validates that the associate reports to the manager (same rule as `updateAssignment` today). Reassigning manager is admin-only.
- Assessments: manager or associate may draft; only the owning manager may approve. Enforce approval through an RPC, not just UI.
- Startup delete: admin or owning manager only. See decision D4 (archive vs delete).
- `mentors`: readable by all staff; writable by admin and managers.
- `profiles`: readable by all staff (needed for names); users may edit their own `label`; role/manager changes are admin-only via server action.

### Seed script

`scripts/seed-supabase.ts`:

- Imports existing `src/data/seed/*.ts`.
- Maps old string IDs to **deterministic uuids (v5)** so references stay intact and re-runs are idempotent.
- Creates demo users as real Supabase Auth accounts with `profiles` rows.
- Computes `investibility` / `ai_analysis` once via `src/lib/aiAnalysis.ts`.
- Inserts in dependency order using the service-role key.
- Safe to re-run: upserts by uuid, never truncates. It must **never** be run against the production project once it exists.

### Tests

Port the cases in `src/lib/rbac.test.ts` to run against the Supabase project as each demo user (vitest with one Supabase client per role). This proves RLS matches `can()`. Tests only read data or write to demo rows they create and clean up.

**Done when:** SQL files are applied and logged in `APPLIED.md`, the project seeds cleanly, and RLS tests pass for all three roles.

## Phase 2: Authentication

- [ ] Replace `authenticate()` in `src/data/seed/users.ts` with `supabase.auth.signInWithPassword`. Login UI is unchanged.
- [ ] Demo Credentials popup signs in with real seeded accounts; only rendered when `NEXT_PUBLIC_DEMO_MODE=true`.
- [ ] Add `middleware.ts` to refresh sessions and protect `/(authenticated)`. Remove `AuthGuard`.
- [ ] `currentUser` comes from `profiles`. Replace all 14 direct imports of `data/seed/users` with a profiles query/hook.
- [ ] Navbar persona switcher: remove, or make demo-only (sign out → sign in as selected user).
- [ ] Admin users page: invite via `auth.admin.inviteUserByEmail` (server action), then set role and manager. Disable public sign-ups in Supabase (invite-only).

**Done when:** all three roles log in with real sessions and see only their scoped startups.

## Phase 3: Data access, area by area

Migrate one area at a time; the app must run end to end after each step.

1. **Reads.** Add `hydrate()` to the store; fetch all collections after login. Remove the `persist` middleware and `reconcileById` merge logic.
2. **Startups.** `createStartup`, `updateStartup`, `deleteStartup`, `updateAssignment` → server actions that save, recompute scores, log activity and notify in one go. Touches the startup page, `SettingsTab`, `AIDiagnosticsTab`, `Header`, `StartupEditModal`, `StartupUploadModal`.
3. **Metrics & assessments.** `upsertMetric` (also recomputes scores), `addAssessment`, `updateAssessment`.
4. **Mentor Connect.** Requests, matches, sessions.
5. **Data requests & submissions**, plus founder action items.
6. **Notifications.** Per-recipient read state; mark-all-read.

Conventions for every mutation:

- Server action returns `{ data, error }`.
- Call site awaits, shows a toast on failure, and rolls back any optimistic update.
- Inputs validated with zod on the server, including parsed Excel imports.
- FITT tracker writes use optimistic concurrency: update only if `updated_at` matches the loaded value; otherwise surface a conflict.

## Phase 4: Founder portal

- [x] `/founder/[token]` becomes a server-rendered page: hash token → look up active `founder_links` row → load only that startup's data with the admin client.
- [x] Founder actions (submit data, update milestone) are server actions that re-validate the token on every call and allow only founder-editable fields (milestone status, progress, evidence; not owner or targets).
- [x] Staff can rotate/revoke a startup's link from Settings; links expire.

## Phase 5: Optional

- **Realtime notifications:** subscribe to `notification_recipients` for the current user.
- **Storage:** private bucket for uploaded Excel files (audit) and milestone evidence, with startup-scoped policies.
- **Real AI analysis:** if `ai_analysis` should come from an LLM rather than heuristics, move it to a background job that writes the column when done.

## Phase 6: Production project (before real data)

Triggered by decision D5: complete this before the first real startup is entered.

- [ ] Create the production project in the same region.
- [ ] Run every file in `supabase/sql/` in order; log each in `APPLIED.md`.
- [ ] Configure Auth (invite-only, email templates, site URL) to match the existing project.
- [ ] Do **not** run the seed script. Create real staff accounts via admin invites.
- [ ] Point the production deployment's env vars at the new project. The existing project becomes dev/demo.
- [ ] Confirm the plan's backup coverage on the production project.

## Phase 7: Cleanup

- [ ] Remove seed files from the app bundle (seed script only).
- [ ] Replace `DEMO_TODAY` in `src/lib/clock.ts` (used in 8 files) with the real date.
- [ ] Regulatory feed and `generateInsights()` run on sample data: label as sample or connect a real feed.

## Risks

| Risk | Mitigation |
|---|---|
| Making store actions async touches ~25 call sites across most screens. | Mechanical; migrate area by area (Phase 3) and keep each step shippable. |
| RLS and `can()` drift apart: UI shows actions the DB rejects. | RLS test suite from Phase 1 runs in CI. |
| FITT tracker saved as a whole object: concurrent edits overwrite each other. | `updated_at` version check on write. |
| Service-role key leaking to the client. | Only imported from `src/lib/supabase/admin.ts`, which is marked server-only. |
| Dashboard changes drift from the SQL files in git. | All changes go through `supabase/sql/` + PR; ad-hoc fixes written back the same day; `APPLIED.md` log. |
| With a single project, a bad migration or seed re-run damages data. | Acceptable while data is demo-only. Split to a production project before real data (Phase 6, D5). |

## Open decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | Region / data residency (any FITT or IIT Delhi requirements?) | Mumbai `ap-south-1` |
| D2 | Founders: keep magic links or give them accounts? | Magic links for now |
| D3 | Demo popup and seeded accounts in production, or only on a separate demo deployment? | Until the split (D5), demo accounts live in the single project. Afterwards, demo only on the dev/demo project. |
| D4 | Deleting a startup: hard delete or archive? | Archive (soft delete) |
| D5 | When to create a separate production project? | Before the first real startup is entered (Phase 6). Until then, one project. |
