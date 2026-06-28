# G-15b — Gosaki Discography existing release Save slice final preflight

**Phase:** `G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run-final-preflight`  
**Status:** **complete** — live beforeSnapshot confirmed; Save path implemented; dry-run Preview verified; **no Save / DB write in this phase**  
**Date:** 2026-06-28  
**Base commit:** `1190323` (uncommitted implementation)  
**Prior:** G-15a2 (`gosaki-discography-dry-run-preview-implementation-and-preflight.md`)

| Check | Status |
| --- | --- |
| Staging project confirmed | **yes** — `kmjqppxjdnwwrtaeqjta` |
| beforeSnapshot read-only SELECT | **yes** — values match baseline |
| G-15b Save slice implemented | **yes** |
| dry-run Preview verified | **yes** — `actualWrite: false` |
| Save env stack documented | **yes** |
| afterVerification SELECT documented | **yes** (doc-only) |
| Rollback SQL template (doc-only) | **yes** |
| Cursor Preview / Save | **no** |

---

## Gates

```txt
gosakiDiscographySaveSliceFinalPreflightComplete: true
phase: G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run-final-preflight
readyForG15bDiscographySaveExecution: true
readyForG15cPublicReflection: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorPreviewExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Do not execute rollback SQL** without separate explicit approval.

---

## 1. Git state (verified at phase start)

```txt
git status --short: (empty)
HEAD: 1190323
origin/main: 1190323
branch: main...origin/main
```

Implementation leaves **uncommitted** working tree changes (G-15b).

---

## 2. Purpose

Implement G-15b **non-dry-run Save slice** for Gosaki Discography operator UI (`discography-002` / `purchase_url` only) and final preflight before operator manual Save once.

Documents live beforeSnapshot, Save env stack, dry-run Preview expectations, afterVerification SELECT (execution in next phase), rollback template (doc-only).

**Out of scope (this phase):** Save click, DB write, rollback SQL execution, public reflection, FTP.

---

## 3. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/discography/
Save path: G-15b operator UI — purchase_url slice
service_role: not used
discography_tracks: not touched
```

---

## 4. Target row / field / before / after

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-002` |
| **title** | `SKYLARK` |
| **field** | `purchase_url` only |
| **before** | `https://gosaakiii.base.shop/` |
| **after** | `https://gosakirikako.base.shop/` |
| **baseline updated_at** | `2026-06-05T17:39:44.201802+00:00` |

Typo fix only — **no audit markers** (`[CMS Kit staging]`, `PoC`, `test`, `G-15`, `dry-run` forbidden).

---

## 5. Approval ID / env gates

**Save approval ID (G-15b only — do not reuse G-15a2 dry-run or G-9k):**

```txt
G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run
```

**Dry-run Preview approval (unchanged — G-15a2):**

```txt
G-15a2-gosaki-discography-purchase-url-dry-run-slice
```

**Operator Save env stack (all required):**

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=discography
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED=true
G15B_DISCOGRAPHY_SAVE_ENABLED=true
```

**Routine dev (default):** all non-dry-run arms **off**; `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

---

## 6. beforeSnapshot — read-only SELECT (executed)

**Method:** Supabase REST `GET /rest/v1/discography` — anon key only; staging `kmjqppxjdnwwrtaeqjta` only.

**Filters:**

```txt
legacy_id = discography-002
```

**Result:** `rowCount = 1` — **PASS**

| Field | Live value (G-15b preflight) | Expected | Match |
| --- | --- | --- | --- |
| **legacy_id** | `discography-002` | `discography-002` | **yes** |
| **title** | `SKYLARK` | `SKYLARK` | **yes** |
| **purchase_url** | `https://gosaakiii.base.shop/` | `https://gosaakiii.base.shop/` | **yes** |
| **updated_at** | `2026-06-05T17:39:44.201802+00:00` | same | **yes** |

**updated_at unchanged since G-15a2** — confirms no prior Save executed.

---

## 7. dry-run Preview expectations (verified via inline simulation)

When operator sets `purchase_url` form field to after value and clicks「変更を確認」:

```txt
dryRun: true
actualWrite: false
wouldWrite: true
changedFields: ["purchase_url"]
payload: { "purchase_url": "https://gosakirikako.base.shop/" }
expectedBeforeUpdatedAt: 2026-06-05T17:39:44.201802+00:00
stale: false
hostGatePassed: true
saveReadiness: ready_but_save_disabled (default dev — arms off)
```

When G-15b env stack armed:

```txt
saveReadiness: ready_to_save
saveAllowed: true
```

**Cursor did not click Preview** — logic verified by verifier inline simulation + source inspection.

---

## 8. Save implementation summary

| Module | Path |
| --- | --- |
| Write types | `src/lib/admin/staging-write/discography-write-types.ts` |
| Write guards | `src/lib/admin/staging-write/discography-write-guards.ts` |
| Write adapter | `src/lib/admin/staging-write/discography-write-adapter.ts` |
| Optimistic lock config | `src/lib/admin/staging-write/gosaki-discography-optimistic-lock-config.ts` |
| Save enablement | `src/lib/admin/staging-write/gosaki-discography-purchase-url-save-config.ts` |
| Page config bridge | `src/lib/admin/staging-write/gosaki-discography-save-page-config.ts` |
| Save executor | `src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts` |
| Operator UI | `src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts` |

**Guards:**

- target `legacy_id` = `discography-002` only
- field `purchase_url` only
- optimistic lock: `expectedBeforeUpdatedAt` required; stale blocks Save
- host gate: `kmjqppxjdnwwrtaeqjta.supabase.co` only
- `rowsAffected` must be `1`
- `actualWrite` true only on non-dry-run Save

---

## 9. UI operator procedure (execution phase only)

1. Arm G-15b env stack (see §5).
2. Sign in to staging admin.
3. Open `/__admin-staging-shell/musician-basic/admin/discography/`.
4. Select `discography-002` (SKYLARK).
5. Set `purchase_url` to `https://gosakirikako.base.shop/`.
6. Click「変更を確認」— verify dry-run panel (`stale: false`, `saveReadiness: ready_to_save`).
7. Click「更新する」**once** (operator only — not Cursor).
8. Verify afterSnapshot via read-only SELECT (§10).
9. Disarm env stack; restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

---

## 10. afterVerification SELECT (doc-only — run after Save in G-15b-execution)

```sql
-- staging only — kmjqppxjdnwwrtae — read-only verification
SELECT legacy_id, title, purchase_url, updated_at
FROM public.discography
WHERE legacy_id = 'discography-002';
```

**Expected after Save:**

| Field | Expected |
| --- | --- |
| **legacy_id** | `discography-002` |
| **title** | `SKYLARK` (unchanged) |
| **purchase_url** | `https://gosakirikako.base.shop/` |
| **updated_at** | **new** timestamp (trigger / default) |

---

## 11. Rollback SQL template (doc-only — do not execute)

```sql
-- staging only — kmjqppxjdnwwrtae — rollback purchase_url typo fix
-- Execute only with explicit operator approval in a separate rollback phase
UPDATE public.discography
SET purchase_url = 'https://gosaakiii.base.shop/'
WHERE legacy_id = 'discography-002'
  AND purchase_url = 'https://gosakirikako.base.shop/';
```

**Rollback needed after successful Save:** operator decision (typo fix is intentional product change).

---

## 12. Stop conditions

Stop and ask human if:

- host is not `kmjqppxjdnwwrtae`
- `updated_at` baseline mismatch (stale)
- `purchase_url` before value differs from `https://gosaakiii.base.shop/`
- Save affects rows other than `discography-002`
- `discography_tracks` touched
- production / Sariswing host detected

---

## 13. Next phase

**G-15b-execution** — operator manual Save once + read-only afterVerification SELECT.

**Do not:** re-click Save without new approval; enable Save in routine dev without disarm plan.
