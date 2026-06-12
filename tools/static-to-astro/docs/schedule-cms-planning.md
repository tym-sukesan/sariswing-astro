# Schedule CMS Planning

## 1. Purpose

**Phase:** `G-6-e-planning-schedule-cms`

This document plans the Schedule CMS module before implementation.
It generalizes the Sariswing schedule CMS pattern for musician websites.
It does not change database schema.
It does not implement write adapters.
It does not perform database writes.
It does not connect /admin.
It does not touch production data.

Cursor does not connect to Supabase or execute SQL in this phase.

Follows [staging-rls-grant-cleanup-result.md](./staging-rls-grant-cleanup-result.md) and [cms-schema-adapters.md](./cms-schema-adapters.md) (`musician-basic-supabase-v1`).

## 2. Product goal

**Goal:**

```txt
Allow musicians to manage live/event schedules from a lightweight CMS, replacing Wix/Studio manual editing.
```

**Primary user:**

```txt
- musician
- music teacher
- band/artist manager
- small venue/performer site owner
```

**Primary value:**

```txt
- update upcoming shows quickly
- keep past shows archived
- show public schedule pages automatically
- reduce maintenance cost compared with Wix/Studio
```

**Priority within CMS Kit:**

```txt
Schedule is the highest-priority musician CMS module after profile PoC.
```

## 3. Sariswing reference pattern

**Sariswing reference (proven on gosaki / Sariswing):**

```txt
- schedule records (public.schedules)
- schedule_months (public.schedule_months)
- venue selection + free text fallback (venue text field)
- duplicate event (admin workflow)
- future/past grouping
- month pages (schedule_months + monthly schedule views)
- public/private state (published flag)
- admin update then static site rebuild
- show_on_home / home_order for featured upcoming events
- legacy_id for migration stability (schedule-YYYY-MM-NNN)
```

**Generalization principles:**

```txt
- musician-basic template should support simple schedules first
- avoid overfitting to Sariswing-specific fields (e.g. home_image_url can be optional later)
- keep migration/import from existing sites possible
- support both structured venue and free-text venue
- preserve compatibility with musician-basic-supabase-v1 adapter where practical
```

**Existing adapter mapping** ([`cms-schema-adapters.json`](../config/schema-adapters/cms-schema-adapters.json)):

| Sariswing table | Role today |
| --- | --- |
| `schedules` | Primary event rows (`date`, `title`, `venue`, `published`, etc.) |
| `schedule_months` | Month index / navigation (`year`, `month`, `label`) |

## 4. MVP feature scope

**In MVP:**

```txt
- schedule list
- create schedule draft in dry-run
- edit schedule draft in dry-run
- duplicate schedule draft in dry-run
- public/private flag
- event date
- start time text
- title
- venue name
- area/location text
- event URL or reservation URL
- description/note
- sort by date
- future/past grouping
```

**Deferred (not MVP):**

```txt
- recurring events
- ticket inventory
- paid booking
- multi-language
- seat map
- image upload
- external calendar sync
- automatic SNS posting
- show_on_home featured module (Sariswing-specific; optional follow-up)
- flyer / home_image Storage migration (separate G-4+ phase)
```

## 5. Proposed fields

Planning field set for musician-basic Schedule CMS. Maps to existing `schedules` columns where noted.

| Field | Required | Public display | Admin UI | Migration/import | Existing column / note |
| --- | --- | --- | --- | --- | --- |
| `id` | yes (system) | no | read-only | no | `schedules.id` (uuid) |
| `legacy_id` | yes (import) | no | optional | yes | `schedules.legacy_id` — keep for Sariswing compat |
| `title` | yes | yes | yes | yes | `schedules.title` |
| `event_date` | yes | yes | yes | yes | maps to `schedules.date` |
| `start_time` | optional | yes | yes | yes | **new text column or JSON** — not in current adapter |
| `open_time` | optional | yes | yes | yes | deferred / optional |
| `venue_name` | optional | yes | yes | yes | maps to `schedules.venue` |
| `venue_area` | optional | yes | yes | yes | **new** — area/location text |
| `venue_address` | optional | optional | yes | yes | deferred MVP+ |
| `venue_url` | optional | link | yes | yes | **new** — venue website |
| `reservation_url` | optional | CTA button | yes | yes | **new** — ticket/reservation link |
| `performers` | optional | yes | yes | yes | **new** — text or comma-separated |
| `description` | optional | yes | yes | yes | `schedules.description` |
| `price_text` | optional | yes | yes | yes | **new** — free text (e.g. "¥3,000") |
| `is_published` | yes | gates visibility | yes | yes | maps to `schedules.published` |
| `is_featured` | optional | home module | yes | partial | maps to `show_on_home` (Sariswing; defer MVP) |
| `sort_order` | optional | list order | yes | yes | `schedules.sort_order` |
| `source_url` | optional | no | read-only | yes | import provenance |
| `created_at` | system | no | read-only | no | standard |
| `updated_at` | system | no | read-only | no | standard |
| `updated_by` | system | no | read-only | no | prefer trigger; see §12 |
| `month` | derived | nav | read-only | derived | FK to `schedule_months.month` in Sariswing — derive from `event_date` |

**MVP minimum write payload (dry-run):** `title`, `event_date`, `venue_name`, `is_published`, plus optional `start_time`, `venue_area`, `reservation_url`, `description`.

## 6. Data model options

### Option A: Use existing schedules + schedule_months structure

```txt
Pros: Sariswing-compatible; adapter proven; month pages already modeled
Cons: Authors must maintain month rows; duplicate authoring surface
```

### Option B: Simplify to schedules only for musician-basic

```txt
Pros: Simplest authoring; one table to write
Cons: Breaks month FK pattern; Sariswing export/import may need adapter changes
```

### Option C: Keep schedule_months as generated/read model, not authoring model

```txt
Pros: Simple authoring on schedules; month nav still works; Sariswing compat preserved
Cons: Requires sync job or trigger to upsert schedule_months from event_date (future phase)
```

### Recommendation

```txt
Prefer a simple schedules-first authoring model (Option C direction).
Month grouping can be generated from event_date where possible.
Keep compatibility with existing schedule_months if already present.
Do not require authors to create schedule_months rows manually in MVP.
```

**Sariswing compatibility:**

```txt
- Keep legacy_id and published on schedules
- Do not drop schedule_months table
- G-6-e1 read audit must confirm staging column names vs adapter before any write adapter
- New fields (start_time, venue_area, reservation_url) require separate schema planning phase if not present on staging
```

## 7. Admin UI planning

**Staging shell route (future):** `/__admin-staging-shell/musician-basic/` — Schedule section (not `/admin/`).

**Schedule list:**

```txt
- upcoming first (event_date >= today)
- past collapsed or separate tab
- published/draft badge (is_published)
- duplicate button (dry-run)
- edit button
- no delete button in first implementation
```

**Schedule form:**

```txt
- title (required)
- event date (required)
- open time (optional)
- start time (optional)
- venue name (free text; structured venue picker deferred)
- area / location
- reservation URL
- performers
- price text
- description
- published flag
```

**Actions (G-6-e initial):**

```txt
- dry-run create
- dry-run update
- dry-run duplicate
- dry-run delete: disabled initially
```

**UI patterns (reuse from profile PoC):**

```txt
- Debug Panel: Auth status, Dry-run mode, operation result
- Save button gated by PUBLIC_ADMIN_WRITE_DRY_RUN=true default
- Payload preview before any non-dry-run phase
```

## 8. Public site display planning

```txt
- upcoming schedules list (is_published = true, event_date >= today)
- past schedules archive (is_published = true, event_date < today)
- optional monthly grouping (derive YYYY-MM from event_date; link to month view if schedule_months exists)
- hidden unpublished items (anon SELECT + RLS published filter)
- sort: upcoming ascending by date; past descending by date
- reservation URL button when present
- venue link when venue_url present
- venue name + area as primary location display
```

**musician-basic template pages:**

```txt
- /schedule/ or equivalent upcoming list
- optional /schedule/archive/ or past section
- optional monthly pages if schedule_months populated
```

## 9. Migration/import planning

**Sources (Wix / Studio / Jimdo / static HTML):**

```txt
- existing schedule page
- event listing page
- static HTML tables
- repeated event cards
- free text blocks
```

**Extraction targets:**

```txt
- date
- time
- venue
- title
- reservation URL
- description
```

**Approach:**

```txt
semi-automatic import with review
```

**Pipeline (aligned with static-to-astro tools):**

```txt
1. URL crawl / static HTML parse → schedule candidates JSON
2. Human review queue (date conflicts, missing venue, ambiguous titles)
3. Map to legacy_id pattern schedule-YYYY-MM-NNN
4. Staging seed or dry-run import preview
5. No automatic production write
```

**Existing tooling hooks:** `review-schedule-storage-assets.mjs`, schema adapter `musician-basic-supabase-v1`, seed extractor patterns from G-4/G-5.

## 10. Write safety plan

**G-6-e implementation safety (future phases):**

```txt
- dry-run first (default PUBLIC_ADMIN_WRITE_DRY_RUN=true)
- one module only: schedule
- one operation at a time
- start with create/update dry-run
- no delete in first implementation
- non-dry-run requires separate manual approval + prep doc (profile G-6-d pattern)
- rollback SQL or manual row revert plan required before non-dry-run
- production remains blocked
- staging project only: static-to-astro-cms-staging
- no service_role in browser
```

**Approval ID (to be defined at G-6-e3+):**

```txt
Example: G-6-e6-manual-schedule-non-dry-run-poc
```

## 11. RLS / GRANT considerations

**Public (anon):**

```txt
- SELECT only published schedule records (published = true)
- existing schedules_public_select policy pattern from staging RLS audit
```

**Authenticated admin/editor:**

```txt
- SELECT all schedule records
- INSERT/UPDATE only if role is admin/editor (via is_admin() or equivalent)
- DELETE disabled initially or admin-only in later phase
```

**admin_users reference:**

```txt
Use auth.uid() + public.admin_users role checks, consistent with profile.
Same pattern as G-6-d profile UPDATE policy.
```

**GRANT policy (post cleanup):**

```txt
- anon SELECT only where public display requires it
- authenticated SELECT/INSERT/UPDATE only where RLS restricts admin/editor
- no TRUNCATE/TRIGGER/REFERENCES grants (removed in G-6-rls-grant-cleanup-result)
- verify INSERT/UPDATE grants exist before G-6-e non-dry-run — G-6-e1 audit
```

## 12. updated_by plan

G-6-d left `profile.updated_by` NULL after manual update.

**Schedule recommendation:**

```txt
Prefer DB-side updated_by trigger using auth.uid(), after dedicated planning.
Do not implement in this planning phase.
Apply consistently to schedules (and profile) in a future G-6-d-updated-by-support or schedule-specific trigger phase.
```

## 13. Dry-run result model

Schedule dry-run UI should display:

```txt
operation: create | update | duplicate
targetTable: schedules
payload preview: { title, event_date, venue_name, is_published, ... }
validation result: pass | field_errors
wouldWrite: true
actualWrite: false
rollbackHint: "No row written. Safe to retry or cancel."
approvalId: null (until non-dry-run phase)
dryRunMode: true
authStatus: authenticated
```

**Duplicate dry-run:** show source `legacy_id` / `id` and proposed new payload with new `legacy_id` suggestion.

## 14. Non-dry-run PoC plan

### Option A: Create one test draft schedule

```txt
Pros: Tests INSERT path and RLS INSERT policy
Cons: Leaves orphan test row; requires manual cleanup; legacy_id assignment risk
```

### Option B: Update one pre-seeded test schedule row

```txt
Pros: Matches G-6-d profile pattern; bounded change; easier rollback (restore previous values)
Cons: Does not validate INSERT until later phase
```

### Recommendation

```txt
Prefer Option B for first non-dry-run schedule PoC: update one pre-seeded test schedule row.
Safer and consistent with G-6-d profile non-dry-run success path.
Follow with Option A (create test draft) only after UPDATE PoC passes and rollback doc exists.
```

**First non-dry-run schedule PoC checklist (future G-6-e5/e6):**

```txt
- staging project confirmed
- dry-run create/update/duplicate all pass
- target row identified (test schedule, published=false)
- before snapshot recorded
- single field update only (e.g. description append)
- after verification SQL
- smoke test on public read (unpublished stays hidden)
- rollback plan documented
```

## 15. G-6-e implementation gate

```txt
readyForG6EPlanning: true (this document)
readyForG6EImplementation: false until:
- schedule schema compatibility reviewed (G-6-e1)
- schedule write target selected (schedules table; schedule_months read-only/generated)
- dry-run UI designed (G-6-e2)
- approval ID defined (G-6-e5+)
- rollback plan defined (per operation)
- RLS policy plan defined and verified on staging
- no delete in first implementation
- broad GRANT cleanup applied (done — G-6-rls-grant-cleanup-result)
```

## 16. Recommended implementation sequence

```txt
G-6-e1-schedule-schema-read-audit: Schedule schema/read audit
G-6-e2-schedule-dry-run-ui-scaffold: Schedule dry-run UI scaffold
G-6-e3-schedule-dry-run-adapter: Schedule dry-run create/update adapter
G-6-e4-schedule-dry-run-verification: Schedule dry-run verification/report
G-6-e5-manual-schedule-non-dry-run-prep: Manual non-dry-run schedule PoC prep
G-6-e6-manual-schedule-non-dry-run-poc: Manual staging non-dry-run schedule PoC
```

**Recommended next phase:** `G-6-e1-schedule-schema-read-audit` — DONE (see [schedule-schema-read-audit.md](./schedule-schema-read-audit.md))

**G-6-e1-schedule-schema-read-audit（完了）:** read-only audit plan; manual SQL for `schedules` / `schedule_months`.

**G-6-e1-schedule-schema-read-audit-result（完了）:** [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md) — schema compatible for MVP; `schedule_months` derived/read model; `readyForG6E2ScheduleDryRunUiPlanning: true`; next: G-6-e2-schedule-dry-run-ui-planning.

**After G-6-e6 (if successful):** evaluate duplicate dry-run non-dry-run, then optional schema extension for new fields, then `/admin` connection remains separate gate.

## 17. Final safety statement

```txt
This phase is planning only.
No schedule schema is changed.
No schedule records are written.
No production data is touched.
No /admin route is connected.
G-6-e implementation remains blocked until a separate approved implementation phase.
```

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-cms-planning.mjs \
  --out-dir tools/static-to-astro/output/schedule-cms-planning/gosaki
```
