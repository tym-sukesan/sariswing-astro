# G-20u36a — Gosaki Discography SELECT-only before verification

**Phase:** `G-20u36a-gosaki-discography-select-only-before-verification`  
**Status:** **complete** — SELECT-only SQL prepared · **Cursor did not execute SQL**  
**Date:** 2026-07-11  
**Base commit:** `d750708`  
**Prior:** G-20u35 test plan · G-20u31–u34 Save design stack · G-20u30b STG (`00c8888`)

| Check | Status |
| --- | --- |
| SELECT-only SQL file | **yes** |
| SQL executed by Cursor | **no** |
| DB write | **no** |
| SQL mutation | **no** |
| Edge deploy | **no** |
| Save UI enabled | **no** |

---

## Gates

```txt
gosakiDiscographySelectOnlyBeforeVerificationPrepared: true
phase: G-20u36a-gosaki-discography-select-only-before-verification
sqlExecutedByCursor: false
dbWriteExecuted: false
sqlMutationExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
productionUploadStop: true
productionDbWriteStop: true
```

---

## Target

| Item | Value |
| --- | --- |
| Staging project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Database | `static-to-astro-cms-staging` |
| **Forbidden** production ref | **`vsbvndwuajjhnzpohghh`** — do not run |
| `site_slug` | **`gosaki-piano`** |
| `legacy_id` | **`discography-002`** (first Save candidate) |
| First write scope (future) | Track list minor change · release metadata **deferred** |

---

## SQL file

**Path:** `scripts/supabase/gosaki-discography-g20u36a-select-only-before-verification.sql`

**Classification:** **SELECT-only** — one copy-paste block → unified result table:

| Column | Purpose |
| --- | --- |
| `check_key` | Check identifier (A–H) |
| `status` | `PASS` · `STOP` · `INFO` |
| `expected` | Expected value |
| `actual` | Actual value |
| `details_json` | Backup JSON · metadata · previews |

### Verification groups

| Group | Checks |
| --- | --- |
| **A** | Target identity · staging project ref · forbidden production ref (comment) |
| **B** | Schema · `site_slug` columns · key columns · optional timestamp columns via `information_schema` |
| **C** | RLS enabled · anon/authenticated INSERT/UPDATE/DELETE grants |
| **D** | Target release row count = 1 · full backup JSON · metadata fields |
| **E** | Target tracks count · backup JSON · order preview · orphan/mismatch |
| **F** | Global 4/34 counts · duplicate keys · other albums scope |
| **G** | Backup timestamp · release/tracks MD5 checksums |
| **H** | STOP summary row |

---

## Operator execution procedure

1. Open Supabase Dashboard → confirm project ref is **`kmjqppxjdnwwrtaeqjta`**
2. If project is **`vsbvndwuajjhnzpohghh`** → **STOP** — do not run
3. SQL Editor → paste **entire** SQL file → Run once
4. Review result rows — any `status = STOP` → **do not proceed** to Save
5. Save **`G.backup.*`** rows (release/tracks JSON + checksums) locally as backup
6. Record results in **`G-20u36a-result-record`** (future phase)

**Cursor / AI:** must **not** execute this SQL.

---

## Expected PASS conditions

| Check | Expected |
| --- | --- |
| `D.target_release.row_count` | `PASS` · actual = 1 |
| `E.target_tracks.count` | `PASS` · actual > 0 (candidate **8**) |
| `D.target_release.site_slug` | `PASS` · `gosaki-piano` |
| `E.target_tracks.site_slug_and_orphans` | `PASS` |
| `F.global.total_releases_gosaki` | `PASS` · 4 |
| `F.global.total_tracks_gosaki` | `PASS` · 34 |
| `C.rls.both_tables_enabled` | `PASS` |
| `C.permissions.anon_auth_write_grants` | `PASS` · 0 |
| `H.stop_summary.any_stop` | `PASS` |

---

## STOP conditions

| Condition | Action |
| --- | --- |
| Wrong Supabase project (production ref) | **STOP** — do not run / abort |
| `D.target_release.row_count` ≠ 1 | **STOP** |
| `E.target_tracks.count` = 0 | **STOP** |
| `site_slug` mismatch | **STOP** |
| Orphan tracks / parent slug mismatch | **STOP** |
| Unexpected anon/authenticated write grants | **STOP** |
| RLS disabled | **STOP** |
| Global counts ≠ 4/34 | **STOP** |
| Duplicate `(legacy_id, site_slug)` | **STOP** |
| Any row `status = STOP` | **STOP** — no Save |

---

## Results to record (G-20u36a-result-record)

Paste into execution result doc:

- Full result table (or screenshot)
- `H.stop_summary.any_stop` status
- `G.backup.release_checksum_md5` + `G.backup.tracks_checksum_md5`
- `G.backup.timestamp`
- `E.target_tracks.count` actual vs candidate 8
- Operator confirmation of project ref

---

## Not executed in G-20u36a

- SQL execution (Cursor)
- DB write / mutation
- Edge Function deploy
- Save enablement
- FTP / deploy / production changes

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36a-result-record** | Operator SQL execution result documentation |
| **G-20u36b** | Edge dry-run endpoint deploy plan |
| **G-20u36c** | Server dry-run live test |
| **G-20u36e** | First controlled Save (operator manual) |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-gosaki-discography-select-only-before-verification
npm run verify:current-active-regression
```
