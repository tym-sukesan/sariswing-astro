# G-20u35 — Gosaki Discography staging DB write test plan & rollback drill

**Phase:** `G-20u35-gosaki-discography-staging-db-write-test-plan-rollback-drill`  
**Status:** **complete** — test plan + rollback drill design only · **no DB write / SQL execution / Edge deploy**  
**Date:** 2026-07-11  
**Base commit:** `648e083`  
**Prior:** G-20u34 UI arm · G-20u33 dry-run endpoint draft · G-20u32 schema · G-20u31 Save design · G-20u30b STG (`00c8888`)

| Check | Status |
| --- | --- |
| Test plan doc | **yes** (this file) |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| Edge Function deployed | **no** |
| Save UI enabled | **no** |
| Executable `.sql` files added | **no** |
| Production upload / DB | **STOP** |

---

## A. Phase / Gate

```txt
gosakiDiscographyStagingDbWriteTestPlanComplete: true
phase: G-20u35-gosaki-discography-staging-db-write-test-plan-rollback-drill
planOnly: true
dbWriteExecuted: false
sqlMutationExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
productionDbWriteStop: true
serviceRoleBrowserExposure: false
anonKeyDirectWriteAllowed: false
```

**G-20u35 scope:** plan + rollback drill design only. No execution.

---

## B. Target scope

| Item | Value |
| --- | --- |
| Supabase project | **staging only** — `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` |
| `site_slug` | **`gosaki-piano` required** on all reads/writes |
| Unit of write | **1 album** per controlled Save |
| First controlled Save **candidate** | **`discography-002`** (Continuous · ~8 tracks) — **candidate only, not confirmed for execution** |
| Other albums | **unchanged** during first pilot |

### First write scope recommendation

| Scope | G-20u36 first pilot | Later |
| --- | --- | --- |
| **Track list textarea** | **Primary** — one minor line change (add suffix / reorder test) | Full edit |
| **Release metadata** | **Defer** — keep unchanged on first Save | title/description etc. |
| **Personnel / description** | **Defer** | G-20u3x+ |
| **Cover upload** | **Out of scope** | Separate phase |

**Rationale:** `discography-002` has moderate track count (8), clear Wix alignment, and isolates track DELETE+INSERT risk to one album.

### Baseline (staging read — G-20u25)

- 4 releases · 34 tracks · all `site_slug=gosaki-piano`
- Album keys: `discography-001` … `discography-004`

---

## C. Pre-execution checklist

All items must PASS before any future DB write phase (G-20u36+).

| # | Check | Block if fail |
| --- | --- | --- |
| 1 | `git HEAD` = `origin/main` (documented commit) | yes |
| 2 | `npm run verify:current-active-regression` PASS | yes |
| 3 | G-20u31–u35 verifiers PASS | yes |
| 4 | Staging target album **SELECT-only** read confirms row + tracks | yes |
| 5 | **Backup JSON** captured (see §D) | yes |
| 6 | Browser dry-run UI PASS on target album (G-20u30) | yes |
| 7 | Edge Function `gosaki-discography-save-dry-run` **deployed + verified** | yes — **not deployed today → DB write blocked** |
| 8 | Server dry-run PASS · operator reviewed `wouldWrite` | yes |
| 9 | Valid `approvalId` (registry) | yes |
| 10 | Operator confirmed diff manually | yes |
| 11 | Target is **staging** — not production project ref | yes |
| 12 | No `service_role` in browser / static admin package | yes |
| 13 | Anon direct write still **forbidden** | yes |
| 14 | Rollback drill reviewed (§F) | yes |
| 15 | Explicit operator approval form for one-time Save | yes |

---

## D. Backup / snapshot policy

### Required before any non-dry-run Save

Capture and store **before** write:

```json
{
  "capturedAt": "ISO-8601",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "projectRef": "kmjqppxjdnwwrtaeqjta",
  "release": { },
  "tracks": [
    { "id": "uuid", "title": "…", "track_number": 1, "sort_order": 1, "site_slug": "gosaki-piano" }
  ],
  "trackCount": 8,
  "checksum": "sha256:normalized-tracksText+release-fields"
}
```

| Field | Notes |
| --- | --- |
| `discography` row | Full row for `legacy_id` + `site_slug` |
| `discography_tracks` rows | All tracks for album |
| `trackCount` | Must match backup array length |
| `checksum` | SHA-256 of normalized track lines + release fields |

### Storage options (priority order)

| Option | Phase | Notes |
| --- | --- | --- |
| Edge Function `backupToken` + audit log | Future deploy | Preferred |
| Operator local JSON file | G-20u36 pilot | Acceptable · **not** browser localStorage |
| Future `discography_save_audit` table | Post-MVP | Deferred |

**Forbidden:** browser `localStorage` · committing backup JSON to git · production storage.

---

## E. Write transaction policy (future execution — not G-20u35)

Single Postgres **transaction** per album Save:

```txt
BEGIN;
  UPDATE public.discography
    SET … -- release fields (if in scope)
    WHERE legacy_id = $legacyId AND site_slug = 'gosaki-piano';

  DELETE FROM public.discography_tracks
    WHERE discography_legacy_id = $legacyId AND site_slug = 'gosaki-piano';

  INSERT INTO public.discography_tracks (…)
    VALUES … -- one row per line, track_number 1..N, sort_order = track_number;
COMMIT;
-- On ANY error: ROLLBACK entire transaction
```

| Rule | Value |
| --- | --- |
| Scope filter | `site_slug = 'gosaki-piano'` **AND** `legacy_id = $target` |
| Track numbering | `track_number = lineIndex + 1`, `sort_order = track_number` (MVP) |
| Partial write | **Forbidden** — release without tracks or vice versa |
| Path | Edge Function + internal privileged key only — **not** anon browser write |

**G-20u35:** pseudo-procedure only — **not executed**.

---

## F. Rollback drill policy

### Drill before first live write

1. Operator captures backup JSON (§D) from staging SELECT
2. Document expected restore state (track titles, order, count)
3. Review rollback procedure (below) — **do not execute in G-20u35**
4. Confirm rollback approval ID will differ from Save approval ID
5. After any future Save: read-back verify → if fail, execute rollback drill

### Rollback targets

| Target | Restore from |
| --- | --- |
| Release metadata | backup `release` object |
| Tracks | backup `tracks[]` — re-INSERT with same titles/order |

### Rollback constraints

- **Staging only** — same `site_slug` filter
- **Separate approval gate** — e.g. `G-20u36g-gosaki-discography-rollback-drill`
- **Read-back verify mandatory** after rollback
- Rollback SQL / rollback Edge Function: **not implemented in G-20u35**

### Pseudo rollback procedure (documentation template — not executable file)

```txt
1. STOP — do not retry Save
2. Load backup JSON for legacyId
3. Edge Function restore OR operator-approved transaction:
   UPDATE discography FROM backup.release
   DELETE tracks scoped (site_slug + legacy_id)
   INSERT tracks FROM backup.tracks
4. SELECT read-back — compare track count, titles, order
5. Record result in execution-result doc
```

---

## G. Success criteria (future execution phase)

| Criterion | Verification |
| --- | --- |
| Dry-run diff matches write intent | Server dry-run `diff` = operator expectation |
| `didWrite: true` | **Only in G-20u36e execution phase** — not G-20u35 |
| Target album only changed | SELECT other `legacy_id` rows unchanged |
| Track count | Matches expected after normalization |
| Track order | `track_number` 1..N sequential |
| `site_slug` | All rows remain `gosaki-piano` |
| `published` | Unchanged on first pilot (track-only) |
| Other albums | 0 rows changed |
| Read-back | SELECT matches post-Save snapshot |
| Public build / STG package | **Separate phase** — not part of Save success |

---

## H. Failure / STOP conditions

| Condition | Action |
| --- | --- |
| `siteSlug` ≠ `gosaki-piano` | **STOP** |
| Target `legacyId` mismatch | **STOP** |
| Missing / invalid `approvalId` | **STOP** |
| Backup capture failed | **STOP** |
| Server dry-run not run | **STOP** |
| Operator has not reviewed diff | **STOP** |
| `expectedBeforeUpdatedAt` stale (when enabled) | **STOP** |
| Changed row count unexpected | **STOP** — investigate partial write |
| Track count 0 (unexpected) | **STOP** |
| Production project ref detected | **STOP** |
| `service_role` exposed to browser | **STOP** |
| Anon write attempted | **STOP** |
| Partial write suspected | **STOP** — rollback drill |
| Operator not present | **STOP** — no Cursor auto-click Save |
| Edge dry-run endpoint not deployed | **STOP** — cannot proceed to write |

---

## I. Execution phase split (recommended)

| Phase | Scope | DB write |
| --- | --- | --- |
| **G-20u35** | Test plan + rollback drill design | **no** |
| **G-20u36a** | SELECT-only before verification | **no** |
| **G-20u36b** | Edge dry-run endpoint deploy plan | **no** (deploy = operator) |
| **G-20u36c** | Server dry-run live test | **no** |
| **G-20u36d** | First controlled Save approval package | **no** |
| **G-20u36e** | First controlled Save non-dry-run | **yes** — one album · operator manual |
| **G-20u36f** | Read-back verification | SELECT only |
| **G-20u36g** | Rollback drill if needed | operator only |

---

## J. Human / operator procedure

| Actor | Allowed | Forbidden |
| --- | --- | --- |
| **Cursor / AI** | Code · docs · plans · risk analysis · success/fail criteria | DB write · SQL mutation · Edge deploy · Save click · FTP |
| **Operator** | Supabase SQL Editor (when approved) · Edge deploy · Save click · backup JSON save | Vague approval only |
| **Approval form** | Required for destructive ops — see AGENTS.md G-7f1 | Reuse G-6 PoC approval IDs |

Cursor presents: exact scope · backup plan · rollback plan · STOP conditions · then waits for explicit operator approval before any execution phase.

---

## K. SELECT-only before verification SQL (documentation — not an executable file)

**SELECT-only.** Do not run INSERT / UPDATE / DELETE / UPSERT / ALTER / CREATE / DROP / GRANT / REVOKE in G-20u35.

Run in Supabase SQL Editor (**staging** `kmjqppxjdnwwrtaeqjta`) during G-20u36a only, with operator approval:

```sql
-- SELECT-only — Gosaki Discography first Save candidate baseline (discography-002)
-- Project: static-to-astro-cms-staging · site_slug = gosaki-piano

SELECT
  d.legacy_id,
  d.title,
  d.artist,
  d.published,
  d.site_slug,
  COUNT(t.id) AS track_count
FROM public.discography d
LEFT JOIN public.discography_tracks t
  ON t.discography_legacy_id = d.legacy_id
 AND t.site_slug = d.site_slug
WHERE d.site_slug = 'gosaki-piano'
  AND d.legacy_id = 'discography-002'
GROUP BY d.legacy_id, d.title, d.artist, d.published, d.site_slug;

SELECT
  t.id,
  t.discography_legacy_id,
  t.track_number,
  t.sort_order,
  t.title,
  t.site_slug
FROM public.discography_tracks t
WHERE t.site_slug = 'gosaki-piano'
  AND t.discography_legacy_id = 'discography-002'
ORDER BY t.track_number, t.sort_order;

-- Sanity: other albums unchanged baseline (counts only)
SELECT
  d.legacy_id,
  COUNT(t.id) AS track_count
FROM public.discography d
LEFT JOIN public.discography_tracks t
  ON t.discography_legacy_id = d.legacy_id
 AND t.site_slug = d.site_slug
WHERE d.site_slug = 'gosaki-piano'
GROUP BY d.legacy_id
ORDER BY d.legacy_id;
```

---

## L. Not executed in G-20u35

- DB write / SQL mutation execution
- Executable `.sql` migration or rollback files
- Edge Function deploy / implementation under `supabase/functions/**`
- Save button enablement
- Discography fetch POST
- Approval state persistence / localStorage
- FTP / deploy / production changes
- `service_role` usage

---

## M. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u35-gosaki-discography-staging-db-write-test-plan-rollback-drill
npm run verify:current-active-regression
```
