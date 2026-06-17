# Staging shell schedule site_slug edit planning (G-9g)

**Phase:** `G-9g-staging-shell-schedule-site-slug-edit-planning`  
**Date:** 2026-06-17  
**Prior:** G-9f commit `8be88e7`  
**Type:** planning only — no implementation, no DB write, no Supabase SQL, no Save UI

---

## 1. Background

G-9e generalized convert-time schedule read by `site_slug`. G-9f added staging shell read-only visibility for Gosaki (`site_slug=gosaki-piano`, 60 rows). G-9g plans how to edit those rows safely from the staging shell **before** any write UI or non-dry-run work.

**This phase performed:** code/docs audit, safety design, slice map, AI context updates.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, Save / Preview buttons, `/admin` changes, `service_role`, FTP, workflow_dispatch.

---

## 2. G-9e / G-9f baseline

| Phase | Outcome |
| --- | --- |
| G-9e | `loadScheduleRowsFromSupabase({ siteSlug, months, canonicalRoutePrefix })`; Gosaki wrapper; static-fallback preserved |
| G-9f | `loadSchedulesForSiteSlugRead()`; `AdminStagingScheduleSiteSlugReadSection` at `#schedule`; read-only table + month counts |
| G-9c2c | Staging DB: 60 rows `site_slug=gosaki-piano`; canonical `source_route`; PoC row restored |

```txt
Route: /__admin-staging-shell/musician-basic/#schedule
Staging DB: static-to-astro-cms-staging only
Test row (recommended): aa440e29-5be8-402e-9190-0d81c48434c0 (schedule-2026-07-010)
  site_slug=gosaki-piano, title=<>, venue/open_time/start_time/price=null, show_on_home=false
```

Doc: [staging-shell-schedule-site-slug-read-binding.md](./staging-shell-schedule-site-slug-read-binding.md)

---

## 3. Goals

Enable staging shell operators to edit Gosaki schedule rows with:

1. **site_slug scoping** — never update another site's rows
2. **Dry-run first** — preview before any DB write
3. **Optimistic lock** — reuse G-6-f10 `expectedBeforeUpdatedAt` pattern
4. **Slice discipline** — one approval ID per non-dry-run slice (G-6 lesson)
5. **G-9f preservation** — read-only section unchanged
6. **G-6 PoC isolation** — frozen G-6-e5 / G-6-f6 / G-6-g1 / G-6-g2 paths untouched

---

## 4. Edit target fields (safe fields)

Initial product path — same spirit as G-6 safe fields:

| Field | Edit in first slices? | Notes |
| --- | --- | --- |
| `title` | **Yes** (G-9g2 first non-dry-run) | Low risk; proven in G-6-g1 pattern |
| `venue` | **Yes** (G-9g3) | Text; G-6-f6 proved write path |
| `open_time` | **Yes** (G-9g3 or sub-slice) | Nullable text |
| `start_time` | **Yes** (G-9g3 or sub-slice) | Nullable text |
| `price` | **Yes** (G-9g3 or G-9g4) | Nullable text |
| `description` | **Yes** (G-9g3) | Text; longer content |

**G-9g3 grouping recommendation:** follow G-6 slice order where possible — title alone first (G-9g2), then time fields, then price, then venue+description — **or** one safe-fields bundle with separate approval if operator prefers fewer Save clicks. Default plan: **match G-6-g slice order** for audit trail.

---

## 5. Out-of-scope fields (initial slices)

Do **not** include in payload or UI for G-9g1–G-9g3:

```txt
id
legacy_id
site_slug
source_route
source_file
month
date
year
sort_order
published
show_on_home
home_order
image_url
home_image_url
created_at
updated_at
```

### Deferred to later phases

| Field | Why defer | Suggested phase |
| --- | --- | --- |
| `date` | Affects month routing / static pages | G-9g5+ |
| `published` | Site visibility | G-9g6+ with extra confirm |
| `show_on_home` / `home_order` | Home page visibility | G-9g6+ |
| `sort_order` | List ordering side effects | G-9g7+ |
| INSERT / DELETE | New RLS/grant scope | G-9h+ |

`schedule_months` remains **read-only / derived** — never written from staging shell.

---

## 6. Dry-run first policy

### Rule

**Every non-dry-run Save must be preceded by a successful dry-run Preview** in the same session for the same target row + field set.

### G-9g1 (next implementation)

```txt
Phase: G-9g1-staging-shell-schedule-site-slug-edit-dry-run
Scope: site_slug=gosaki-piano, dry-run preview only
Save / DB update: none
```

Dry-run preview must show:

```txt
before (selected fields + identifiers)
after (proposed values)
changedFields[]
target id
legacy_id
site_slug
updated_at (optimistic lock token / stale baseline)
actualWrite: false
approvalId: (dry-run prototype ID — not a write approval)
```

Implementation notes:

- Reuse dry-run adapter patterns from G-6-f3/f4 (`buildSchedule*DryRunResult`)
- Load `beforeSnapshot` via `loadSchedulesForSiteSlugRead` or row-scoped SELECT with `site_slug` filter
- Stale check: optional SELECT comparing `updated_at` at preview time (G-6-f10 dry-run stale pattern)
- **No** `updateScheduleWrite` call in G-9g1

---

## 7. Optimistic lock policy

Reuse existing G-6-f10 product path without modifying frozen PoCs:

| Item | Policy |
| --- | --- |
| Mechanism | `expectedBeforeUpdatedAt` in `schedule-write-adapter.ts` |
| Builder | `buildScheduleLockedWriteRequest` / `executeScheduleGeneralUpdateWrite` |
| Trigger | `schedules_set_updated_at` on staging (G-6-f8) |
| Config | `getScheduleOptimisticLockConfig().enabled` |
| Payload | Never send `updated_at` in payload — DB trigger sets it |

### Stale row handling

| Context | Behavior |
| --- | --- |
| Dry-run Preview | Show warning if `beforeSnapshot.updated_at` ≠ live SELECT `updated_at`; mark `stale: true` |
| Non-dry-run Save | **Block** write; `errorCode: optimistic_lock_failed`; require re-Preview |

### G-9g extension (implementation phase)

Current adapter UPDATE uses `.eq("id", beforeSnapshot.id)` only. **G-9g2+ must add:**

```txt
.eq("id", targetId)
.eq("site_slug", expectedSiteSlug)   // NEW — required
```

Optional defense-in-depth:

```txt
.eq("legacy_id", beforeSnapshot.legacy_id)  // when legacy_id present
```

`beforeSnapshot` must include `site_slug`; reject if `site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG`.

---

## 8. Update scope policy (non-dry-run)

Minimum match conditions on UPDATE:

```txt
id          — primary key
site_slug   — must equal gosaki-piano (config constant)
updated_at  — optimistic lock via pre-UPDATE SELECT (existing adapter)
legacy_id   — verify in beforeSnapshot guard (existing); optional .eq on UPDATE
```

**Never** update without `site_slug` filter once G-9g write path ships.

Guard additions (planned):

- `assertG9GxSiteSlugPayloadOnly(payload, allowedFields)`
- `assertBeforeSnapshotSiteSlug(beforeSnapshot, expectedSiteSlug)`
- New approval IDs in `SCHEDULE_WRITE_APPROVAL_IDS` — **separate from frozen G-6-g1/g2 IDs**

---

## 9. UI policy

### Section layout in `#schedule`

```txt
#schedule
  ScheduleAdminUi                              ← G-6-f2 (unchanged)
  AdminStagingScheduleSiteSlugReadSection      ← G-9f read-only (unchanged)
  AdminStagingScheduleSiteSlugEditSection      ← NEW (G-9g1+)
  [frozen] AdminStagingScheduleGeneralEditSection / G-6 PoCs (unchanged)
```

### Rules

| Rule | Detail |
| --- | --- |
| Read vs edit | Separate sections; G-9f section stays read-only |
| G-9g1 | **Preview** button only — no Save |
| G-9g2+ | Save only when env arm + approval ID registered; never show Save alongside unarmed dry-run |
| Dry-run vs Save | Do not show armed Save until Preview succeeded for current edits |
| Row picker | Start with fixed test row; later add legacy_id selector scoped to `site_slug` |
| Safety banner | "Staging shell only. site_slug=gosaki-piano. No production." |

### Routing / admin safety

```txt
/__admin-staging-shell/musician-basic/#schedule only
/admin — do not touch
src/pages/admin — do not touch
```

---

## 10. Why non-dry-run is a separate phase

1. G-9f just established read binding — operators need Preview UX validation first
2. G-9g requires **new** `site_slug` UPDATE filter — adapter change deserves its own review
3. G-6 non-dry-run slices proved one-field-one-approval discipline; Gosaki path needs **new** approval IDs
4. Staging row set is production-like (60 rows) — wrong-site UPDATE risk is higher without `site_slug` guard
5. Operator explicit approval text required per G-7f1 destructive/write safety culture

---

## 11. Recommended implementation slices

### G-9g (this phase)

Planning + docs only.

### G-9g1 — dry-run preview only

```txt
Phase: G-9g1-staging-shell-schedule-site-slug-edit-dry-run
Fields: title, venue, open_time, start_time, price, description (inputs)
Action: Preview only → dry-run result panel
Save: none
Approval: dry-run prototype ID only (no write approval)
```

Deliverables: `AdminStagingScheduleSiteSlugEditSection`, dry-run builder, guards for payload keys, verifier assertions.

### G-9g2 — single-row title non-dry-run PoC

```txt
Phase: G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-slice
Fields: title only
Target: aa440e29-5be8-402e-9190-0d81c48434c0 (explicit)
Approval ID: G-9g2-schedule-site-slug-title-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
UPDATE filter: id + site_slug=gosaki-piano + optimistic lock
Operator: manual Save once; Cursor does not click Save
```

### G-9g3 — safe fields non-dry-run (sub-slices)

Follow G-6-g order; each sub-slice = one approval + one Save:

| Sub-slice | Fields | Approval ID pattern |
| --- | --- | --- |
| G-9g3a | open_time + start_time | `G-9g3a-schedule-site-slug-time-fields-non-dry-run-slice` |
| G-9g3b | price | `G-9g3b-schedule-site-slug-price-non-dry-run-slice` |
| G-9g3c | venue + description | `G-9g3c-schedule-site-slug-venue-description-non-dry-run-slice` |

Alternative: keep venue+description split like G-6-f6 vs G-6-g4 if markers conflict.

### Later (not in G-9g scope)

- G-9g5: `published` / `show_on_home` with confirm layer
- G-9g6: `date` / month migration concerns
- G-9h: INSERT / DELETE planning

---

## 12. Code path map (planned)

| Path | Entry | site_slug filter | Lock | Status |
| --- | --- | --- | --- | --- |
| G-9f read | `loadSchedulesForSiteSlugRead` | SELECT | n/a | **Done** |
| G-6 PoC / G-6-g | `executeScheduleGeneralUpdateWrite` | **No** | Yes | **Frozen — do not extend** |
| G-9g write | `executeG9GxSiteSlugScheduleUpdateWrite` (new wrapper) | SELECT + UPDATE | Yes | **Planned** |

New wrapper should call existing `updateScheduleWrite` after guards, passing extended UPDATE filters via adapter change (preferred) or thin wrapper that adds `.eq("site_slug", ...)`.

Reuse:

- `staging-schedule-site-slug-config.ts` — extend with edit phase constants
- `schedule-write-guards.ts` — add G-9g assert functions
- `schedule-general-update-trigger.ts` — consider thin delegate vs fork to avoid touching G-6-g triggers

---

## 13. Risks

| Risk | Mitigation |
| --- | --- |
| Cross-site UPDATE | Mandatory `.eq("site_slug", …)` on UPDATE; beforeSnapshot guard |
| G-9f regression | No edits to read section; separate edit component |
| G-6 PoC confusion | Separate section IDs, approval IDs, env arms |
| Stale concurrent edit | Optimistic lock + Preview stale warning |
| RLS gap | Verify staging RLS allows authenticated UPDATE only for intended rows; planning only — check in G-9g2 preflight |
| 60-row blast radius | Fixed test row for first non-dry-run; row picker filters by site_slug |
| `schedule_months` drift | No date/month edits in early slices |

---

## 14. Verification (G-9g planning)

Standard verifiers — no new assertions required for planning-only phase. G-9g1 will add verifier block (mirror G-9f pattern in `verify-url-to-staging-pipeline.mjs`).

```bash
cd tools/static-to-astro
node scripts/verify-gosaki-schedule-seed-extractor.mjs
node scripts/verify-url-to-staging-pipeline.mjs
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-font-safety.mjs
npm run verify:manual-upload
```

---

## 15. Gates

```txt
stagingShellScheduleSiteSlugEditPlanningComplete: true
stagingShellScheduleEditDryRunFirst: true
stagingShellScheduleEditSafeFieldsDefined: true
stagingShellScheduleEditUpdateScopeDefined: true
stagingShellScheduleEditNonDryRunDeferred: true
stagingShellNoWriteUiAdded: true
stagingShellNoAdminRouteTouched: true
readyForG9g1DryRunImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 16. Next phase

**G-9g1-staging-shell-schedule-site-slug-edit-dry-run** — implementation: edit section + Preview-only dry-run for `site_slug=gosaki-piano`. No Save, no DB write.
