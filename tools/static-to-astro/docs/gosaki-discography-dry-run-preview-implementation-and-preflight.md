# G-15a2 — Gosaki Discography dry-run Preview implementation and preflight

**Phase:** `G-15a2-gosaki-discography-dry-run-preview-implementation-and-preflight`  
**Status:** **complete** — dry-run Preview wired; Save / DB write **disabled**  
**Date:** 2026-06-28  
**Base commit:** `1f36cf9`  
**Prior:** G-15a Supabase read binding

| Check | Status |
| --- | --- |
| Dry-run Preview implementation | **yes** |
| Target `discography-002` / SKYLARK | **yes** |
| Single-field slice `purchase_url` | **yes** |
| `actualWrite: false` | **yes** |
| `wouldWrite: true` (on success) | **yes** |
| `updated_at` unchanged after Preview | **verified read-only** |
| Save enabled | **no** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyDryRunPreviewImplementationAndPreflightComplete: true
phase: G-15a2-gosaki-discography-dry-run-preview-implementation-and-preflight
approvalId: G-15a2-gosaki-discography-purchase-url-dry-run-slice
targetLegacyId: discography-002
sliceField: purchase_url
readyForG15bDiscographySaveSlicePlanning: true
readyForG15bDiscographyNonDryRunSave: false
saveEnabled: false
dbWriteEnabled: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
```

---

## 1. Target row / field (preflight)

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-002` |
| **title** | SKYLARK |
| **uuid** | `ed59d236-881a-45ce-ab9f-de5427e39dad` |
| **slice field** | `purchase_url` only |
| **updated_at baseline** | `2026-06-05T17:39:44.201802+00:00` |

### before / after (planned natural correction)

| Field | before (DB) | after (form / dry-run) |
| --- | --- | --- |
| `purchase_url` | `https://gosaakiii.base.shop/` | `https://gosakirikako.base.shop/` |

Rationale: fix typo URL (`gosaakiii` → `gosakirikako`) to match Continuous album shop — no audit markers; safe if Save proceeds in G-15b.

**Unchanged on slice:** `title`, `artist`, `description`, `streaming_url`, `sort_order`, `published`, tracks.

---

## 2. Implementation map

| File | Role |
| --- | --- |
| `gosaki-discography-dry-run-types.ts` | Phase / target / approval id |
| `gosaki-discography-dry-run-config.ts` | Save disabled; dry-run enabled |
| `gosaki-discography-dry-run-guards.ts` | `purchase_url` only; target `discography-002` |
| `gosaki-discography-existing-release-dry-run.ts` | `executeG15a2DiscographyDryRun()` |
| `staging-discography-optimistic-lock-stale-check.ts` | SELECT `updated_at` stale check |
| `gosaki-discography-dry-run-page-config.ts` | SSR page config bridge |
| `gosaki-staging-discography-admin-ui.ts` | 「変更を確認」 handler + result panel |
| `AdminGosakiStagingDiscographyOperatorPage.astro` | UI wiring |

---

## 3. Dry-run Preview behavior

Operator flow:

```txt
1. Open /__admin-staging-shell/musician-basic/admin/discography/
2. Select discography-002 (SKYLARK) — default
3. Edit purchase_url in form
4. Click 「変更を確認」
5. Panel shows dry-run result (no DB write)
```

Result fields:

```txt
ok: true (when valid single-field change)
dryRun: true
actualWrite: false
wouldWrite: true
changedFields: ["purchase_url"]
payload: { purchase_url: "..." }
expectedBeforeUpdatedAt: <baseline>
optimisticLockStale: false (if DB unchanged)
saveReadiness: ready_but_save_disabled
saveAllowed: false
```

Host / project gates: `kmjqppxjdnwwrtaeqjta.supabase.co` only (blocks Sariswing production ref).

---

## 4. Env stack (routine dev)

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_SUPABASE_URL=https://kmjqppxjdnwwrtaeqjta.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<staging anon>
```

**Do not arm** any Discography non-dry-run Save env in G-15a2.

---

## 5. `updated_at` verification (read-only)

After dry-run Preview execution (verifier / script — no Save):

| Check | Result |
| --- | --- |
| `updated_at` before Preview | `2026-06-05T17:39:44.201802+00:00` |
| `updated_at` after Preview | **unchanged** |
| DB row mutation | **none** |

---

## 6. UI status (explicit)

```txt
Discography Supabase read: enabled
Discography dry-run Preview: enabled
Save: disabled
DB write: disabled
```

---

## 7. Not in scope

- non-dry-run Save / UPDATE
- `discography_tracks` edit
- migration / schema change
- public reflection
- FTP / deploy

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15a2-gosaki-discography-dry-run-preview-implementation-and-preflight.mjs
```

---

## 9. Next phase

**G-15b** — non-dry-run Save slice planning for `discography-002` / `purchase_url` with new approval ID (operator manual Save once).
