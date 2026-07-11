# G-20u36a-result — Gosaki Discography SELECT-only before verification (execution record)

**Phase:** `G-20u36a-result-record-gosaki-discography-select-only-before-verification`  
**Status:** **complete** — operator SQL execution recorded · **do not proceed to Save**  
**Date:** 2026-07-11  
**Base commit:** `074583c`  
**Prior:** G-20u36a SELECT-only SQL prepared (`d750708`)

| Check | Status |
| --- | --- |
| SQL executed | **yes** — human operator · Supabase SQL Editor |
| Executed by Cursor | **no** |
| Target project | **staging** `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| Production project | **not used** — `vsbvndwuajjhnzpohghh` **not executed** |
| SQL type | **SELECT-only** |
| DB write / SQL mutation | **not executed** |
| REVOKE / GRANT / RLS change | **not executed** |
| Edge deploy / Save / FTP | **not executed** |

---

## Gates

```txt
gosakiDiscographySelectOnlyBeforeVerificationResultRecorded: true
phase: G-20u36a-result-record-gosaki-discography-select-only-before-verification
hStopSummaryAnyStop: STOP
proceedToSave: false
proceedToDbWrite: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
revokeGrantPolicyChangeExecuted: false
productionUploadStop: true
productionDbWriteStop: true
```

---

## Execution context

| Item | Value |
| --- | --- |
| SQL file | `scripts/supabase/gosaki-discography-g20u36a-select-only-before-verification.sql` |
| Executor | **Human operator** (not Cursor) |
| Environment | **staging only** |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Forbidden production ref | `vsbvndwuajjhnzpohghh` — **confirmed not used** |
| Target `site_slug` | `gosaki-piano` |
| Target `legacy_id` | `discography-002` |

---

## Result summary

| Outcome | Value |
| --- | --- |
| **Data state** | Mostly **ready** (schema · target row · tracks · global counts) |
| **Permissions state** | **Not ready** — authenticated UPDATE grants detected |
| **`H.stop_summary.any_stop`** | **STOP** (1 STOP flag) |
| **Proceed to Save / DB write** | **No** |

---

## Check results (recorded)

| check_key | status | expected | actual | Notes |
| --- | --- | --- | --- | --- |
| `A.target_identity.expected_project_ref` | INFO | `kmjqppxjdnwwrtaeqjta` | `kmjqppxjdnwwrtaeqjta` | Staging ref displayed |
| `B.schema.discography.site_slug_column` | PASS | 1 | 1 | |
| `B.schema.discography_tracks.site_slug_column` | PASS | 1 | 1 | |
| `B.schema.key_columns_present` | PASS | ≥11 | 11 | |
| `C.rls.both_tables_enabled` | PASS | true | true | RLS enabled on both tables |
| `C.permissions.anon_auth_write_grants` | **STOP** | 0 | **2** | See §STOP below |
| `D.target_release.row_count` | PASS | 1 | 1 | |
| `D.target_release.site_slug` | PASS | `gosaki-piano` | `gosaki-piano` | |
| `E.target_tracks.count` | PASS | >0 (candidate 8) | **8** | Matches candidate |
| `E.target_tracks.site_slug_and_orphans` | PASS | 0 null / 0 orphan / 0 mismatch | PASS | |
| `F.global.duplicate_release_keys` | PASS | 0 | 0 | |
| `F.global.total_releases_gosaki` | PASS | 4 | 4 | |
| `F.global.total_tracks_gosaki` | PASS | 34 | 34 | |
| `H.stop_summary.any_stop` | **STOP** | 0 STOP flags | **1** | Blocked by permissions check |

---

## STOP reason (primary)

### `C.permissions.anon_auth_write_grants` — STOP

| Table | Grantee | Privilege |
| --- | --- | --- |
| `public.discography` | **authenticated** | **UPDATE** |
| `public.discography_tracks` | **authenticated** | **UPDATE** |

- **Expected:** 0 anon/authenticated/public INSERT/UPDATE/DELETE grants (per G-20u36a check design)
- **Actual:** 2 authenticated **UPDATE** grants
- **Impact:** Write path via direct authenticated client may be possible unless RLS policies fully block — **Save readiness not confirmed**
- **Action taken in this phase:** **None** — no REVOKE / GRANT / policy change

### `H.stop_summary.any_stop` — STOP

- Aggregated **1** STOP flag from permissions check above
- **Decision:** **Do not proceed** to Save · DB write · Edge Save endpoint · G-20u36e

---

## Target snapshot (backup baseline — operator run)

| Field | Value |
| --- | --- |
| `legacy_id` | `discography-002` |
| `title` | **SKYLARK** |
| `artist` | **後藤沙紀** |
| `site_slug` | `gosaki-piano` |
| Track count | **8** |
| Release checksum (MD5) | `d2af1424ac95c9e47e75e79d26cb7881` |
| Tracks checksum (MD5) | `19faeb86e38ba3f958724257c2b78ab4` |
| Backup timestamp (UTC) | `2026-07-11T12:11:18.619Z` |

Store this baseline with operator backup JSON before any future Save attempt.

---

## PASS highlights (data ready)

- Schema: `site_slug` on both tables · 11 key columns present
- RLS: enabled on `discography` and `discography_tracks`
- Target release: exactly **1** row · correct `site_slug`
- Target tracks: **8** rows · no null slug · no orphans · no parent mismatch
- Global: **4** releases · **34** tracks · no duplicate keys

---

## Decision (G-20u36a-result)

| Question | Answer |
| --- | --- |
| Is discography **data** baseline ready for first Save candidate? | **Mostly yes** |
| Are **write permissions** ready for controlled Save? | **No** |
| Proceed to Save / DB write? | **No** |
| Proceed to Edge Save deploy? | **No** |
| Change GRANT/REVOKE/RLS now? | **No** — separate approved phase |

**Rationale:** G-20u31+ design assumes Edge Function internal write path with strict gates. Direct `authenticated` UPDATE grants on discography tables are unexpected for Save MVP readiness and require **SELECT-only permissions/RLS deep-dive** before any write phase.

---

## Not executed in G-20u36a-result

- DB write / SQL mutation
- REVOKE / GRANT / RLS policy changes
- Edge Function deploy
- Save enablement
- Cursor SQL execution
- FTP / production changes

---

## Next phases (recommended)

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-rls-deep-dive** | SELECT-only investigation of authenticated UPDATE grants · RLS policies · `is_admin()` · Edge-only write path alignment |
| **G-20u36b** | Edge dry-run endpoint deploy plan (after permissions gate cleared) |
| **G-20u36c** | Server dry-run live test |
| **G-20u36e** | First controlled Save — **blocked until permissions STOP resolved** |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-result-gosaki-discography-select-only-before-verification-result
npm run verify:current-active-regression
```
