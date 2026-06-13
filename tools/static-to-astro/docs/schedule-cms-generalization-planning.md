# Schedule CMS Generalization Planning

**Phase:** `G-6-f-schedule-cms-generalization-planning`  
**Prerequisites:** [schedule-non-dry-run-poc-explicit-retry-result.md](./schedule-non-dry-run-poc-explicit-retry-result.md) (commit `e9e3861`)

## 1. Purpose

This document plans the transition from the G-6-e5 hidden non-dry-run PoC trigger to a safe, productizable Schedule edit UI / write flow for the Musician CMS Kit.

This phase is **planning only**.

It does not implement write UI.  
It does not perform database writes.  
It does not click the hidden PoC Run button.  
It does not execute rollback SQL.  
It does not modify `/admin` or `src/pages/admin`.  
It does not change Supabase schema, RLS, or GRANT.  
It does not use `service_role`.

## 2. Prerequisite success (G-6-e5)

```txt
Phase: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
Result: SUCCESS
Staging project: static-to-astro-cms-staging
Route: /__admin-staging-shell/musician-basic/
Table: public.schedules (one existing row)
Change: description only
Before: 出演：
After: 出演： [G-6-e5 non-dry-run PoC]
actualWrite: true
rowsAffected: 1
changedFields: ["description"]
service_role: not used
schedule_months: not touched
productionBlocked: true
rollbackNeeded: false
Run button: user manual once (no Cursor / Playwright)
```

## 3. Current implementation structure (summary)

### 3.1 Routes and boundaries

| Area | Path | Role |
| --- | --- | --- |
| Staging shell (active dev) | `/__admin-staging-shell/musician-basic/` | G-5x runtime shell; all Kit write PoCs |
| Sariswing production admin | `/admin/schedule/` etc. | **Do not modify** in Kit generalization |
| Local preview scaffold | `/__admin-preview/musician-basic/` | Static scaffold only |

**Rule:** New Schedule CMS work stays on staging shell until an explicit future phase connects production admin.

### 3.2 Staging shell stack

```txt
src/pages/__admin-staging-shell/musician-basic/index.astro
  → tools/static-to-astro/templates/admin-cms/preview/staging-shell-wrapper.astro
  → tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro
```

Sections on staging shell (schedule-related):

| Component | Purpose |
| --- | --- |
| `AdminStagingReadOnlyDataSection` | Read-only data provider display |
| `AdminStagingScheduleDryRunPocSection` | Schedule dry-run UI + adapter routing |
| `AdminStagingScheduleNonDryRunPocTriggerSection` | **Hidden env-gated PoC trigger (G-6-e5)** |
| `ScheduleAdminUi` | Static scaffold list/edit UI (G-5m-a; not wired to Supabase) |
| `AdminAuthAdapterStatusPanel` | G-5y-d scaffold; static "DB access: disabled" |
| `AdminStagingAuthWriteDebugPanel` | G-6-d debug gates |

### 3.3 Schedule write module (`src/lib/admin/staging-write/`)

| Module | Phase | Role |
| --- | --- | --- |
| `schedule-dry-run-*` | G-6-e2/e3 | Pure dry-run validation; `actualWrite: false` always |
| `staging-schedule-read.ts` | G-6-e2 | SELECT schedules for dry-run UI |
| `staging-schedule-dry-run-ui.ts` | G-6-e2 | Browser dry-run form UI |
| `schedule-write-adapter.ts` | G-6-e4 | Real UPDATE only; separate from dry-run |
| `schedule-write-guards.ts` | G-6-e4 | Payload allowlist / forbidden keys |
| `schedule-write-types.ts` | G-6-e4/e5 | Approval ID `G-6-e5-schedule-non-dry-run-poc` |
| `schedule-non-dry-run-poc-*` | G-6-e5 | Hidden trigger config, auth warnings, execution |
| `staging-schedule-non-dry-run-poc-ui.ts` | G-6-e5 | Danger Zone UI + result panel |

**Critical design (already implemented):**

```txt
ScheduleDryRunAdapter ≠ ScheduleWriteAdapter (no shared dryRun flag)
Write path uses authenticated Supabase client only (no service_role)
```

### 3.4 Profile PoC success pattern (reference)

| Aspect | Profile (G-6-d) | Schedule (G-6-e5) |
| --- | --- | --- |
| Adapter | `profile-update-poc-adapter.ts` | `schedule-write-adapter.ts` |
| UI | Visible form + Save | Hidden Danger Zone + Run |
| Approval ID | `G-6-d-staging-profile-update-poc` | `G-6-e5-schedule-non-dry-run-poc` |
| Auth gate | Signed-in session; no mock hard gate | Same (after G-6-e5 fix) |
| Write auth | RLS + `admin_users` | RLS + `admin_users` |
| Dry-run default | `PUBLIC_ADMIN_WRITE_DRY_RUN=true` | PoC used explicit `false` |
| Result panel | Inline success message | Structured result panel |

**Lesson:** Visible UI + dry-run first + single approval ID per PoC phase works. Schedule should converge toward Profile's visible flow, not keep expanding the hidden trigger.

### 3.5 Auth / data providers

```txt
staging-auth/* — Supabase Auth session, mock allowlist display (informational)
staging-data-read/* — Read-only module display (schedule list preview)
staging-write/staging-write-config.ts — Profile write gates (module=profile only)
schedule-non-dry-run-poc-config.ts — Separate gates for hidden PoC trigger
```

Mock allowlist role display (`denied`) does **not** block write when signed in; RLS + `admin_users` is source of truth (proven in G-6-e5).

### 3.6 Data model (staging)

**Authoring table:** `public.schedules`

**Read-only / derived:** `public.schedule_months` — never write from CMS Kit PoCs.

**Write adapter allowed payload keys** (`schedule-write-guards.ts`):

```txt
date, title, venue, open_time, start_time, price, description,
published, show_on_home, home_order, sort_order, updated_at
```

**Forbidden payload keys:**

```txt
id, legacy_id, year, month, image_url, home_image_url,
source_file, source_route, created_at, updated_by
```

**PoC used only:** `description`.

**Observed:** `updated_at` did not change after successful write (no DB trigger or not in PoC payload). Treat as open question for general UI.

### 3.7 Env gates (current)

Hidden PoC trigger (`getScheduleNonDryRunPocConfig`) requires:

```txt
DEV=true
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true
PUBLIC_ADMIN_NON_DRY_RUN_POC_TARGET_ID=<fixed uuid>
PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY (staging host)
```

Profile write config (`getStagingWriteConfig`) requires `PUBLIC_ADMIN_WRITE_MODULE=profile` — schedule general UI must not accidentally reuse profile approval without new gates.

## 4. Design direction

### 4.1 Goals

```txt
1. Replace hidden PoC trigger with intentional Schedule edit UI on staging shell.
2. Keep dry-run as default; non-dry-run only with explicit approval ID + manual confirm.
3. Expand field scope gradually (description → safe text fields → dates/toggles).
4. Defer INSERT, DELETE, duplicate, image upload, and schedule_months writes.
5. Reuse proven write adapter + guards; add UI layer only.
6. Keep Sariswing /admin and production Supabase untouched.
```

### 4.2 Do / do not

**Do (next phases):**

```txt
- Build visible Schedule list + edit UI on staging shell
- Bind list to staging-schedule-read (SELECT only)
- Route saves through existing dry-run adapter first
- Introduce new approval IDs per non-dry-run milestone (not reuse G-6-e5)
- Show Supabase host + expected project on write UI
- Keep manual confirm for non-dry-run saves
- Record beforeSnapshot / afterSnapshot / changedFields in result panel
- Document rollback SQL per write milestone
- Isolate or disable hidden G-6-e5 PoC trigger after general UI is ready
```

**Do not (until explicit later phases):**

```txt
- Modify src/pages/admin or connect /admin
- INSERT / DELETE / UPSERT schedules
- Write schedule_months
- Use service_role
- Auto-click Save / Run (Playwright / Chromium)
- Re-click G-6-e5 hidden PoC Run button
- Physical delete (use future logical-delete phase: G-6-f-staging-logical-delete-restore in write-operation-safety-plan)
- Image / Storage upload for schedule flyers
- Production FTP / workflow_dispatch / publish from Kit staging shell
- Merge dry-run and write adapters behind one dryRun flag
```

### 4.3 PoC trigger vs general UI separation

| Concern | G-6-e5 hidden PoC | Future general UI |
| --- | --- | --- |
| Visibility | Env-gated Danger Zone | Normal Schedule module section |
| Target | Fixed UUID | User-selected row from list |
| Payload | Fixed description | Form-driven; guards enforce allowlist |
| Approval ID | `G-6-e5-schedule-non-dry-run-poc` | New IDs per milestone (e.g. `G-6-f5-…`) |
| Enablement | `PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER` | Module-specific write flags |
| Retirement | Hide after general path verified | Primary path |

**Recommendation:** Keep PoC code paths but default-hidden; do not delete until `G-6-f6` or later documents retirement.

## 5. Design topics

### 5.1 UI / UX

**musician-basic Schedule module (target):**

```txt
- List: date, title, venue, published badge, future/past grouping (later)
- Detail / edit: mobile-first single-column form
- Primary actions: Save (dry-run default), Save to staging (non-dry-run gated)
- Status: draft vs published; clear label for unpublished rows
```

**Field rollout (recommended order):**

| Phase | Fields | Notes |
| --- | --- | --- |
| MVP read | all columns in SELECT | List only |
| F3 | `description` | Matches PoC proof |
| F4 | `title`, `venue`, `open_time`, `start_time`, `price` | Text fields |
| F5 | `published`, `show_on_home`, `home_order`, `sort_order` | Toggles / numbers |
| Later | `date` | Requires validation + month derivation review |
| Deferred | `image_url`, `home_image_url` | Storage phase |
| Deferred | create, delete, duplicate | Separate phases |

**New create / delete:**

```txt
Create (INSERT): defer until G-6-g-schedule-create-flow-planning + RLS INSERT grant review
Delete: defer; align with G-6-f-staging-logical-delete-restore (soft delete columns not in current schema audit)
Duplicate: dry-run adapter supports duplicate op; real duplicate INSERT is post-create phase
```

**show_on_home / home_order:**

```txt
Optional for musician-basic MVP; Sariswing-specific prominence.
Plan as advanced fields after core event text fields work.
Default show_on_home=false for new Kit customers unless template enables home module.
```

### 5.2 Data model

```txt
public.schedules — authoring table; all CMS writes go here
public.schedule_months — derived/read-only; populated by import, export, or future DB job — NOT CMS write target
```

**year / month / legacy_id:**

```txt
Forbidden in write payload today.
year/month likely derived from date on import or DB trigger — confirm before allowing date edits.
legacy_id: migration stability; assign on import/create pipeline, not manual CMS edit in early phases.
```

**source_file / source_route:**

```txt
Legacy static-site migration metadata.
CMS-created rows: null or kit-generated routes in a future export/build phase.
Do not expose in general edit UI initially.
```

**updated_at behavior:**

```txt
G-6-e5 write succeeded but updated_at unchanged in SQL verification.
Before date/published writes: audit whether trigger exists on staging schedules.
Optimistic lock via updated_at optional; PoC did not pass expectedBeforeUpdatedAt.
```

**Validation rules (carry from dry-run):**

```txt
- date format / required title for publish
- string length limits on venue, price, description
- show_on_home requires sensible home_order when true
- published row must have minimum fields (title, date) before non-dry-run save
```

### 5.3 Write flow

**Staged expansion:**

```txt
1. Dry-run UI — validate + preview payload, actualWrite:false
2. Non-dry-run — one approval ID, manual confirm, beforeSnapshot, updateScheduleWrite
3. Widen allowed payload in guards per phase (not widen UI alone)
```

**Patterns to keep from G-6-e5:**

```txt
- getStagingSupabaseClient(url, anonKey) + authenticated session
- beforeSnapshot SELECT before UPDATE
- changedFields computation in write adapter
- result panel: status, actualWrite, errorCode, warnings, JSON detail
- scrollIntoView on result
- double-click guard on Save
```

**New approval IDs (examples — assign at implementation):**

```txt
G-6-f3-schedule-description-edit-dry-run — planning/verification only
G-6-f5-schedule-safe-field-update-non-dry-run — first visible non-dry-run UI
(Do not reuse G-6-e5-schedule-non-dry-run-poc for general UI)
```

**Rollback strategy:**

```txt
Per milestone: document beforeSnapshot SQL + rollback UPDATE for changed fields only
User or operator runs rollback manually on staging — no auto rollback in UI
PoC rollback SQL remains valid for description-only restore
```

### 5.4 Safety gates

```txt
staging shell only (/__admin-staging-shell/musician-basic/)
production block via env (ADMIN_AUTH_ENV, PROD)
Supabase host display + expected project static-to-astro-cms-staging
PUBLIC_ADMIN_WRITE_DRY_RUN=true as default for day-to-day dev
non-dry-run: explicit env + approval ID + manual confirm string
INSERT/DELETE disabled in getScheduleWriteSafety()
Playwright auto-click prohibited
/admin boundary: no src/pages/admin changes
```

**Non-dry-run unlock checklist (template for each milestone):**

```txt
[ ] Staging project confirmed
[ ] beforeSnapshot SQL recorded
[ ] dry-run pass for same payload
[ ] approval ID matches env
[ ] user signed in (authenticated session)
[ ] host matches kmjqppxjdnwwrtaeqjta.supabase.co
[ ] rollback SQL documented
[ ] user manual Save once; no auto retry
```

### 5.5 Generalization / productization

```txt
musician-basic first; dance-school / generic templates reuse ScheduleAdminUi + adapters with kit config
Static-to-Astro import produces schedules rows + schedule_months read model
Customer onboarding: staging Supabase project, seed, admin_users row, inline env docs
Minimum musician kit schedule features: list, edit text fields, publish toggle, mobile-friendly
Sariswing-specific: home featured events, home_image — keep in Sariswing /admin, optional Kit module flags
Kit vs Sariswing: all new code in tools/static-to-astro templates + src/lib/admin; not src/pages/admin
```

## 6. Phased implementation plan

**Naming note:** `G-6-f-staging-logical-delete-restore` already exists in [write-operation-safety-plan.md](./write-operation-safety-plan.md) for cross-module soft delete. Schedule generalization phases use `G-6-f1`…`G-6-f6` suffixes below to avoid collision.

| Phase | Name | Scope | Writes |
| --- | --- | --- | --- |
| **G-6-f** | `schedule-cms-generalization-planning` | This document | None |
| **G-6-f1** | `schedule-poc-isolation-dry-run-default` | **DONE** — explicit rerun gate; completed notice; dry-run default docs | None |
| **G-6-f2** | `schedule-read-ui-binding-audit` | Wire `ScheduleAdminUi` to `loadSchedulesForDryRunUi`; list/detail read-only on staging shell | SELECT only |
| **G-6-f3** | `schedule-description-edit-dry-run-prototype` | Visible description edit form; dry-run adapter; result panel | None (dry-run) |
| **G-6-f4** | `schedule-safe-fields-dry-run` | Add title, venue, times, price to dry-run form + validation | None (dry-run) |
| **G-6-f5** | `schedule-safe-fields-non-dry-run` | Visible Save with new approval ID; multi-field or staged single-field; before/after SQL | UPDATE staging (approved) |
| **G-6-f6** | `schedule-write-ui-hardening` | Optimistic lock decision, updated_at audit, error panel parity with PoC, mobile QA | As approved |
| **G-6-g** | `schedule-create-flow-planning` | INSERT planning, legacy_id rules, RLS INSERT review | Planning only |
| Later | `schedule-date-edit` | `date` change + month derivation impact analysis | After G-6-g |
| Later | `G-6-f-staging-logical-delete-restore` | Soft delete / restore (cross-module) | Separate approval |

**Recommended immediate next phase:** `G-6-f2-schedule-read-ui-binding-audit` (G-6-f1 complete).

## 7. Open questions

```txt
1. Does staging schedules have updated_at trigger? Why unchanged after G-6-e5?
2. Are year/month computed by trigger on date change or only on import?
3. When should schedule_months be refreshed — export job, view, or materialized pipeline?
4. Should general UI resolve admin_users role for display (beyond mock allowlist)?
5. Per-customer approval IDs vs single Kit approval ID with env customer slug?
6. Duplicate flow: dry-run only until INSERT phase approved?
7. Should published=false rows be default target for first non-dry-run UI tests?
8. Rollback: keep PoC description marker or restore to 出演： before next customer demo?
```

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| Accidental reuse of G-6-e5 env gates | New approval IDs; separate config module for general write UI |
| root `.env` production Supabase URL | Inline staging env at dev start; host display in UI |
| Mock allowlist confusion | Document UI vs RLS; optional admin_users read resolver later |
| Hidden PoC re-click | Default hide trigger; explicit "do not re-click" in AGENTS.md |
| date edit breaks month pages | Defer date writes; audit derivation before enabling |
| schedule_months drift | Treat as derived; document rebuild path; never CMS-write |
| scope creep to /admin | Hard rule: staging shell until explicit production admin phase |
| service_role temptation | Adapter types enforce serviceRoleUsed: false |

## 9. Rollback / recovery policy

```txt
Staging row restore: manual SQL UPDATE documented per milestone
G-6-e5 PoC rollback (description only, not executed unless requested):

  update public.schedules
  set description = '出演：'
  where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

No automatic rollback in UI.
After non-dry-run tests: restart dev with PUBLIC_ADMIN_WRITE_DRY_RUN=true.
Do not commit .env secrets or output/ reports.
```

## 10. Safety invariants (unchanged)

```txt
- production / Sariswing production: do not touch
- Supabase production project: do not touch
- staging project only: static-to-astro-cms-staging
- service_role: prohibited
- /admin and src/pages/admin: do not modify
- schedule_months: read-only
- INSERT / DELETE / UPSERT: deferred
- Storage / Publish / FTP / workflow_dispatch: prohibited
- Playwright / Chromium auto-click: prohibited
- hidden G-6-e5 Run button: do not re-click
```

## 11. Gate decision

```txt
scheduleCmsGeneralizationPlanningComplete: true
scheduleNonDryRunPocCompleted: true
readyForScheduleGeneralUi: false
readyForScheduleCreate: false
readyForScheduleDelete: false
recommendedNextPhase: G-6-f1-schedule-poc-isolation-dry-run-default
```

## 12. Related documents

```txt
schedule-cms-planning.md — G-6-e initial module planning
schedule-write-adapter-planning.md — G-6-e4 write adapter design
schedule-non-dry-run-poc-explicit-retry-result.md — G-6-e5 success record
staging-profile-non-dry-run-result-report.md — Profile PoC pattern
write-operation-safety-plan.md — cross-module write safety matrix
admin-runtime-integration-plan.md — staging shell vs /admin roadmap
```

## Report

Planning phase only. No reporter script required.

Optional future:

```bash
node tools/static-to-astro/scripts/report-schedule-cms-generalization-planning.mjs \
  --out-dir tools/static-to-astro/output/schedule-cms-generalization-planning/gosaki
```

(Do not commit `output/`.)
