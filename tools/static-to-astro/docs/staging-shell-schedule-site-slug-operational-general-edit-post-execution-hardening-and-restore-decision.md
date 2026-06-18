# Staging shell schedule site_slug operational general edit post-execution hardening and restore decision (G-9g3g5)

**Phase:** `G-9g3g5-post-execution-hardening-and-restore-decision`  
**Status:** **decision / hardening planning complete**  
**Date:** 2026-06-18  
**Prior:** G-9g3g4 execution success — commit `a58f5f9`  
**Type:** planning only — **no Save, no Preview by Cursor, no DB write, no SQL mutation, no restore execution**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md)
- [staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md)
- [staging-shell-schedule-site-slug-operational-general-edit-implementation.md](./staging-shell-schedule-site-slug-operational-general-edit-implementation.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditPostExecutionHardeningPlanningComplete: true
readyForG9g3g5bOperationalRestorePreflight: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

---

## 1. G-9g3g4 execution summary

| Item | Value |
| --- | --- |
| commit | `a58f5f9` |
| actualWrite | `true` |
| rowsAffected | `1` |
| changedFields | `description` only |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| target id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| before updated_at | `2026-06-16T16:03:41.551792+00:00` |
| after updated_at | `2026-06-18T16:35:45.060011+00:00` |
| serviceRoleUsed | `false` |
| production | untouched |
| rollback executed | **no** |

Operator manual Save once via `#site-slug-edit-g9g3g-operational-save-btn`. Cursor did not click Save.

---

## 2. Current marker state (staging DB — as of G-9g3g4)

Target row description **currently includes** the G-9g3g4 temporary marker.

### Original description (pre-G-9g3g4)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

### Current description (post-G-9g3g4 — marker remains)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

### Row identity (unchanged)

```txt
id: 888c58f2-f152-4563-a3cf-a20d7c2456c1
legacy_id: schedule-2026-03-001
site_slug: gosaki-piano
updated_at (post-Save): 2026-06-18T16:35:45.060011+00:00
```

**Note:** Row picker `[CMS Kit staging]` filter may exclude or complicate selection until restore. Plan restore before future operational smokes on this row.

---

## 3. Restore decision options

### Option A — Keep marker temporarily

| | |
| --- | --- |
| **Pros** | Visible proof of successful operational Save; easy hardening audit in G-9g3g5+ |
| **Cons** | Staging seed data stays “dirty”; `[CMS Kit staging]` filter / PoC exclusion may confuse future smokes; unnatural for real editor QA data |

### Option B — Restore via operational Save path (UI)

| | |
| --- | --- |
| **Pros** | Returns staging to real Gosaki content; validates update → restore round-trip on the **same** operational path; no SQL mutation |
| **Cons** | Requires one more DB write; non-dry-run env + operator manual Save; must use dedicated restore approval / env arm (see §7) |

### Option C — SQL rollback

| | |
| --- | --- |
| **Pros** | Direct revert |
| **Cons** | **Discouraged** by project safety policy; SQL mutation risk; operator error risk even when manual; bypasses UI guards and audit trail |

### Recommended decision (G-9g3g5)

**Option B** in a **separate phased restore** — not executed in G-9g3g5 planning.

- **Do not** leave marker indefinitely (Option A is acceptable only short-term between G-9g3g4 and restore phases).
- **Do not** use SQL rollback (Option C) unless operator explicitly overrides with full preflight + approval — default path is UI restore.

---

## 4. Proposed next phases

G-9g3g5 planning completes in this doc. Restore is split into dedicated phases:

| Phase | Scope | DB write |
| --- | --- | --- |
| **G-9g3g5** (this) | Hardening + restore decision planning | **none** |
| **G-9g3g5b-operational-restore-preflight** | beforeSnapshot, restore payload, approval ID, env arm, operator checklist | **none** |
| **G-9g3g5c-operational-restore-execution** | Operator Preview once → Save once (`description` only → original) | operator manual once |
| **G-9g3g5d-post-restore-hardening** | Verify clean state, routine dev gates, doc close-out | **none** |
| **G-9g3h-operational-editor-hardening** (future) | Broader operational editor UX / executed-state UI (optional) | TBD |

### Restore target (G-9g3g5b/c)

```txt
id:         888c58f2-f152-4563-a3cf-a20d7c2456c1
legacy_id:  schedule-2026-03-001
site_slug:  gosaki-piano
changedFields: description only
lock baseline (post-G-9g3g4): 2026-06-18T16:35:45.060011+00:00
```

### Restore candidate (description only)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

**Next recommended phase:** `G-9g3g5b-operational-restore-preflight`

---

## 5. Re-click prevention / hardening

| Rule | Action |
| --- | --- |
| G-9g3g4 Save | **Frozen** — do not re-click `#site-slug-edit-g9g3g-operational-save-btn` for append test |
| Routine dev | `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `ENABLE_ADMIN_STAGING_WRITE=false` |
| Operational arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` **off** or unset |
| Non-dry-run stack | Stop dev server armed for G-9g3g4; do not leave non-dry-run env running |
| Execution result doc | Retain `Do not re-click G-9g3g operational Save` in G-9g3g4 result |
| UI executed marker | **Optional G-9g3h** — show “G-9g3g4 executed” read-only banner; not required for G-9g3g5b |
| PoC arms | G-9g2 / G-9g3b / G-9g3c / G-9g3d remain off |
| Row picker | Until restore, expect `[CMS Kit staging]` in description — document in restore preflight |

### Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

---

## 6. Restore approval / env design

### Option 1 — Reuse G-9g3g operational approval ID / env arm

```txt
G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
```

**Risk:** Same arm as G-9g3g4 append test — operator may confuse “second general edit” with “restore”; single-arm docs harder to audit.

### Option 2 — Restore-dedicated approval ID / env arm (recommended)

```txt
approval ID: G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
env arm:     PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true
```

**Benefits:**

- Explicit operator intent (“restore” vs “general edit test”)
- Separate approval text and preflight checklist
- Mutual exclusion: G-9g3g operational arm **off** when G-9g3g5 restore arm on
- Guard can assert payload removes G-9g3g4 marker only (`description` → original)

### Recommendation (G-9g3g5)

**Option 2** — restore-dedicated approval ID and env arm for G-9g3g5b/c implementation.

Implementation (guards, types, UI gate) deferred to **G-9g3g5b** — planning only here.

---

## 7. SQL rollback policy (retained — not executed)

Preflight doc contains guarded SQL template. **Default: do not run.**

If operator ever considers SQL restore:

1. Staging project only
2. Full SELECT preflight
3. Explicit approval separate from UI restore
4. Prefer UI restore (Option B) instead

**G-9g3g5:** SQL rollback **not executed**.

---

## 8. Safety checklist (G-9g3g5)

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| Restore executed | **no** |
| Rollback SQL executed | **no** |
| FTP / deploy | **no** |
| service_role | **no** |
| `/admin` / production | untouched |

---

## 9. Git

```txt
G-9g3g4 execution success committed at: a58f5f9
G-9g3g5 planning: complete (uncommitted)
```
