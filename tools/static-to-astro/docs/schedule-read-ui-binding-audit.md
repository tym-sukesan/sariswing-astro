# Schedule read UI binding audit (G-6-f2)

Last updated: 2026-06-14  
Phase: `G-6-f2-schedule-read-ui-binding-audit`  
Approval: read-only / SELECT only — no write approval required

## Prerequisites (completed)

- **G-6-e5** — Schedule non-dry-run PoC succeeded (`description` update on staging `public.schedules` one row). `service_role` unused. `schedule_months` untouched.
- **G-6-f1** — Hidden PoC trigger disarmed by default. `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true` required to re-arm Danger Zone. Dry-run default documented.

## Goal

Audit and minimally connect `ScheduleAdminUi` in the staging shell to real schedule read data (`SELECT only`). No writes, no Run button, no PoC re-arm.

---

## 1. Current Schedule read UI structure

### Routes

| Route | Purpose |
| --- | --- |
| `/__admin-staging-shell/musician-basic/` | Staging shell — Kit development only |
| `/__admin-preview/musician-basic/` | Local preview — static fixtures |
| `/admin/*` | Sariswing production admin — **not modified in this phase** |

### Components and data paths (before G-6-f2)

| Area | Component / module | Data source | Notes |
| --- | --- | --- | --- |
| Schedule module UI | `ScheduleAdminUi.astro` | Static `scheduleItems` in prototype | `data-scaffold="true"`, all actions disabled |
| Read-only adapter panel | `AdminReadOnlyDataStatusPanel.astro` | `loadStagingReadOnlyPreview()` | G-5z-c/d; shows schedule preview (published-only, limit 20) |
| Schedule dry-run PoC | `AdminStagingScheduleDryRunPocSection` + client `staging-schedule-dry-run-ui.ts` | `loadSchedulesForDryRunUi()` | Client-side SELECT; all rows up to 100; mock fallback |
| G-6-e5 completed notice | `AdminStagingScheduleNonDryRunPocCompletedNotice` | Static | No Run button |
| Hidden PoC trigger | `AdminStagingScheduleNonDryRunPocTriggerSection` | Gated env | Disarmed unless `EXPLICIT_RERUN` |

**Gap:** Schedule module UI and dry-run read path were **not connected**. Two parallel read implementations existed:

1. **G-5z read-only adapter** — `supabase-read-only-data-adapter.listSchedules()` — `published=true`, limit 20, approved columns only.
2. **G-6-e2 dry-run loader** — `loadSchedulesForDryRunUi()` — no published filter, limit 100, wider column set for dry-run diff.

### Profile read pattern (reference)

`ProfileAdminUi` in staging shell receives static `profile` fixture in prototype; live profile binding for write PoC is separate (`AdminStagingProfileUpdatePocSection`). Read-only adapter panel already loads profile via `getProfile()` at SSR.

G-6-f2 follows the **dry-run loader path** for Schedule admin binding because admin UI needs unpublished rows and `description` (including G-6-e5 PoC marker).

---

## 2. Read provider current state

### `loadSchedulesForDryRunUi` (`staging-schedule-read.ts`)

- **Table:** `public.schedules`
- **Operation:** SELECT only (anon client, no `service_role`)
- **Filter:** none (all rows in limit)
- **Order:** `date` ascending
- **Limit:** 100
- **Fallback:** `SCHEDULE_DRY_RUN_MOCK_RECORDS` on missing config, error, or empty result
- **Return:** `{ records, source: "supabase" | "mock", error? }`

### G-5z `listSchedules` (`supabase-read-only-data-adapter.ts`)

- **Table:** `public.schedules`
- **Filter:** `published = true`
- **Limit:** 20
- **Use:** read-only status panel preview — **not** Schedule admin module binding

### `public.schedule_months`

- **Status:** read-only / derived — **not read in G-6-f2**
- **Reason:** source of truth for CMS editing is `public.schedules`; month aggregates are for public site / future optimization

---

## 3. Binding policy (`ScheduleAdminUi` ↔ read data)

### Source of truth

- **Admin schedule list:** `public.schedules` via `loadSchedulesForDryRunUi` at SSR when staging gates allow.
- **Not** `schedule_months` in this phase.

### Env gates (staging shell SSR)

All required for live Supabase read:

```bash
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>"
```

Implemented via `getReadOnlyDataConfig()` (`read-only-data-config.ts`).

### Fallback ladder

1. Not staging shell → static prototype `scheduleItems`
2. Data read off or provider not `supabase` → static fixtures + message
3. Supabase URL/key missing → static fixtures + message
4. Supabase error or empty → mock or static fixtures + message

### Display fields (minimum for musician-basic)

| Field | Display |
| --- | --- |
| `date` | Table column |
| `title` | Table column; empty → `—`; legacy `<>` shown as-is |
| `venue` | Table column; empty → `—` |
| `description` | Truncated preview column (48 chars); G-6-e5 PoC text shown as-is |
| `published` | Status column (Published / Draft) |
| `sort_order` | Sort control scaffold only (not column) |
| `show_on_home` | Not in table yet — defer to edit prototype (G-6-f3+) |
| `image_url` | Not in dry-run SELECT for admin binding — defer to media phase |

### Future / past / month grouping

- **G-6-f2:** flat table ordered by `date` from loader (same as dry-run loader order).
- **Defer:** upcoming vs past tabs, month grouping UI — G-6-f4+ generalization.

### Legacy vs new CMS data

- Both use same `public.schedules` rows; distinguish via `legacy_id`, `source_file`, `source_route` in data model — **not shown in G-6-f2 table** (available in `ScheduleRecord` for later).

### Read-only vs edit UI boundary

- **Read UI (G-6-f2):** table + disabled form scaffold; `data-select-only="true"`; no write provider calls.
- **Edit UI (G-6-f3+):** description dry-run prototype, then safe-field writes behind dry-run default.

### Types / validation before write UI

- Reuse `ScheduleRecord` / `ScheduleWriteInput` from dry-run types.
- Snapshot dry-run diff before any non-dry-run field expansion.

---

## 4. SELECT-only safety rules (this phase)

- No INSERT / UPDATE / DELETE / UPSERT
- No `service_role`
- No hidden PoC Run click
- No `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true`
- No `/admin` or `src/pages/admin` changes
- No `schedule_months` writes or reads
- No Storage / Publish / FTP / GitHub dispatch
- No Playwright auto-click on write controls

---

## 5. Implementation (G-6-f2)

### New file

- `src/lib/admin/staging-write/schedule-admin-ui-binding.ts`
  - `resolveScheduleAdminUiBinding(staticFallback)` — SSR SELECT via `loadSchedulesForDryRunUi`
  - `mapScheduleRecordToAdminItem()` — maps `ScheduleRecord` → admin table row
  - Returns `source`, `message`, host/project metadata, `selectOnly: true`

### Updated files

- `tools/static-to-astro/templates/admin-cms/modules/ScheduleAdminUi.astro`
  - Props: `readSource`, `readMessage`, `dataReadEnabled`, `supabaseHost`, `expectedProject`, `expectedHost`, `recordCount`
  - Description column in table
  - Read-only banner with source badge (`static | supabase | mock`)
  - `data-read-source` attribute; `data-scaffold="false"` when live supabase

- `tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro`
  - When `stagingShellMode`, `await resolveScheduleAdminUiBinding(scheduleItems)` at SSR
  - Passes binding result to `ScheduleAdminUi`

### Not implemented (intentional)

- Client-side hydration re-fetch (SSR sufficient for audit; dry-run section still client-side)
- `schedule_months` read
- Upcoming/past split UI
- Wiring G-5z adapter to Schedule module (duplicate path; dry-run loader chosen)
- Profile module live read binding (out of scope)

---

## 6. SELECT-only dev startup example

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
npm run dev
```

Open: `http://localhost:4321/__admin-staging-shell/musician-basic/#schedule`

Expected when gates + anon RLS allow:

- Schedule section: `Source: supabase`
- Description column includes G-6-e5 marker on PoC row
- Active host: `kmjqppxjdnwwrtaeqjta.supabase.co`

Without data read gates: `Source: static` with info message.

---

## 7. Risks / open questions

| Risk | Mitigation |
| --- | --- |
| SSR SELECT without user session may hit RLS | Same as G-5z panel; mock/static fallback + message |
| Build-time SSR without network/env | Falls back to static; build still succeeds |
| Two schedule read paths (G-5z vs dry-run loader) | Documented; consolidate in G-6-f4+ |
| Published-only adapter vs admin all-rows | Admin binding uses dry-run loader only |
| Large schedule tables | Limit 100; pagination later |
| Empty title `<>` UX | Shown literally; human review in edit phase |

---

## 8. Next phase proposal

**G-6-f3-schedule-description-edit-dry-run-prototype**

- Wire description field edit scaffold to dry-run write provider
- Keep `PUBLIC_ADMIN_WRITE_DRY_RUN=true` default
- Still no non-dry-run / no hidden PoC re-arm
- Optional: unify client dry-run section with `ScheduleAdminUi` selection

---

## 9. Invariant reminders

- `/admin` untouched
- `service_role` not used
- Hidden PoC trigger not re-armed
- `schedule_months` read-only / derived
- G-6-e5 approval ID not reused in general UI
