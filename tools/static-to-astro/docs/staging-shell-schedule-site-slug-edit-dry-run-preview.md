# Staging shell schedule site_slug edit dry-run preview (G-9g1)

**Phase:** `G-9g1-staging-shell-schedule-site-slug-edit-dry-run-preview`  
**Date:** 2026-06-17  
**Prior:** G-9g planning commit `d4e8f98`  
**Type:** dry-run Preview only — no Save, no DB write

---

## 1. Background

G-9g planned safe-field edits for `site_slug=gosaki-piano`. G-9g1 implements **dry-run Preview only** — client-side preview with optional stale SELECT, no `updateScheduleWrite`.

Planning doc: [staging-shell-schedule-site-slug-edit-planning.md](./staging-shell-schedule-site-slug-edit-planning.md)

---

## 2. Target shell

| Item | Value |
| --- | --- |
| **Route** | `/__admin-staging-shell/musician-basic/#schedule` |
| **Section** | `AdminStagingScheduleSiteSlugEditSection` (after G-9f read section) |
| **NOT touched** | `src/pages/admin/`, G-6 PoC sections |

---

## 3. Target row (fixed G-9g1)

| Field | Value |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `site_slug` | `gosaki-piano` |

Loaded via `loadScheduleRowForSiteSlugRead` — SELECT with `.eq("id")` + `.eq("site_slug")`.

---

## 4. Safe fields

Helper supports all safe fields:

```txt
title, venue, open_time, start_time, price, description
```

**G-9g1 initial UI slice:** `title` input only. Helper `buildSiteSlugScheduleEditDryRunResult` accepts full patch for future slices.

---

## 5. Dry-run preview

| Rule | Value |
| --- | --- |
| Button | `Preview dry-run` only |
| `actualWrite` | always `false` |
| DB UPDATE | never called |
| Stale check | SELECT `updated_at` via `runDryRunStaleCheck` when Supabase env live |

Preview output includes: `target`, `before`, `after`, `changedFields`, `optimisticLock` (`expectedBeforeUpdatedAt`, `currentUpdatedAt`, `stale`).

Stale message: `Stale row detected. Preview only. Save remains unavailable.`

---

## 6. Safety

| Rule | Status |
| --- | --- |
| Save / Update / Delete UI | **none** |
| `service_role` | not used |
| DB write / SQL | none |
| FTP / workflow_dispatch | none |
| `/admin` | not modified |
| G-9f read section | unchanged |

---

## 7. Implementation

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g1 constants, safe fields, target row |
| `staging-schedule-read.ts` | `loadScheduleRowForSiteSlugRead()` |
| `staging-schedule-site-slug-edit-dry-run.ts` | Pure dry-run result builder |
| `staging-schedule-site-slug-edit-binding.ts` | SSR binding |
| `staging-schedule-site-slug-edit-ui.ts` | Client Preview handler |
| `AdminStagingScheduleSiteSlugEditSection.astro` | UI section |
| `musician-basic-admin-prototype.astro` | Wire after read section |

---

## 8. Verification

```bash
cd tools/static-to-astro
node scripts/verify-url-to-staging-pipeline.mjs  # G-9g1 assertions
# ... standard verifiers
```

Local dev:

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
npm run dev
# → #schedule → Preview dry-run on title field
```

---

## 9. Gates

```txt
stagingShellScheduleSiteSlugEditDryRunPreviewComplete: true
stagingShellScheduleEditDryRunOnly: true
stagingShellScheduleEditActualWriteFalse: true
stagingShellScheduleEditSafeFieldsPreviewReady: true
stagingShellScheduleEditTargetScopedBySiteSlug: true
stagingShellScheduleEditNoSaveUi: true
stagingShellNoAdminRouteTouched: true
readyForG9g1Commit: true
readyForG9g2NonDryRunPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 10. Next

- **G-9g2** — single-row title non-dry-run PoC with `site_slug` UPDATE filter + operator approval
