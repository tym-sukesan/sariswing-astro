# Staging shell schedule site_slug title non-dry-run PoC implementation (G-9g2)

**Phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation`  
**Date:** 2026-06-17  
**Prior:** G-9g2 planning commit `91f8b50`  
**Type:** gated Save UI + adapter — **no Save execution in implementation phase**

---

## 1. Background

G-9g2 planning defined title-only non-dry-run PoC for Gosaki `site_slug=gosaki-piano`. This phase adds gated Save UI and `site_slug`-scoped UPDATE adapter. Cursor / AI / CI did **not** click Save or execute DB writes.

Planning: [staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md)

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
```

---

## 3. Title payload

```txt
[CMS Kit staging] G-9g2 title PoC
```

---

## 4. Env arm

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
```

Plus standard staging write stack:

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g2-schedule-site-slug-title-non-dry-run-poc
```

Default: Save disabled; dry-run preview only.

---

## 5. Approval ID

```txt
G-9g2-schedule-site-slug-title-non-dry-run-poc
```

---

## 6. Save UI conditions

Save `Save title PoC` enabled only when:

- G-9g2 env arm + write gates satisfied
- Dry-run preview succeeded in session
- `optimisticLock.stale === false`
- `changedFields === ["title"]`
- Title input matches previewed value
- Target id / legacy_id / site_slug match

---

## 7. UPDATE scope

```txt
.update({ title })
.eq("id", targetId)
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

Pre-UPDATE SELECT verifies `site_slug`, `legacy_id`, `updated_at` (optimistic lock).

---

## 8. actualWrite

| Path | actualWrite |
| --- | --- |
| G-9g1 Preview dry-run | `false` (unchanged) |
| G-9g2 Save (when operator clicks) | `true` on success |

Implementation phase: Save **not** executed by Cursor.

---

## 9. Restore

**Not implemented.** Restore to `title = <>` requires separate approval phase.

---

## 10. Safety

| Rule | Status |
| --- | --- |
| Cursor Save click | **no** |
| DB write / SQL | **no** (implementation phase) |
| `service_role` | not used |
| `/admin` | not modified |
| G-9g1 preview path | preserved |
| G-6 PoC paths | unchanged |

---

## 11. Changed files

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g2 constants |
| `staging-schedule-site-slug-title-poc-config.ts` | Env arm config |
| `staging-schedule-site-slug-title-poc-save.ts` | `executeG9G2TitleNonDryRunSave` |
| `schedule-write-adapter.ts` | Optional `writeScope` on UPDATE |
| `schedule-write-guards.ts` | `assertG9G2TitlePayloadOnly`, `assertBeforeSnapshotSiteSlugScope` |
| `schedule-write-types.ts` | G-9g2 approval ID |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g2 binding fields |
| `staging-schedule-site-slug-edit-ui.ts` | Preview + gated Save handlers |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Save title PoC button |
| `verify-url-to-staging-pipeline.mjs` | G-9g2 assertions |

---

## 12. Gates

```txt
stagingShellScheduleTitleNonDryRunPocImplementationComplete: true
stagingShellScheduleTitlePocSaveUiGated: true
stagingShellScheduleTitlePocEnvArmRequired: true
stagingShellScheduleTitlePocApprovalIdVisible: true
stagingShellScheduleTitlePocUpdateScopedBySiteSlug: true
stagingShellScheduleTitlePocOptimisticLockEnforced: true
stagingShellScheduleTitlePocTitleOnly: true
stagingShellScheduleTitlePocNotExecuted: true
stagingShellScheduleTitlePocRestoreDeferred: true
stagingShellNoAdminRouteTouched: true
readyForG9g2Preflight: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 13. Next

**G-9g2-preflight** — beforeSnapshot / afterVerification / rollback SQL; operator manual Save once in execution phase.
