# G-20u36e — Gosaki Discography controlled Save handler permission-aware local implementation

**Phase:** `G-20u36e-controlled-save-handler-permission-aware-local-implementation`  
**Status:** **complete** — local implementation only · **Edge deploy / Save / operation=save / DB write NOT executed**  
**Date:** 2026-07-14  
**Base commit:** `1aa0e61`  
**Prior:** [handler-permission-aware-plan](./gosaki-discography-g20u36e-controlled-save-handler-permission-aware-plan.md)

| Check | Status |
| --- | --- |
| Local implementation only | **yes** |
| Edge deploy | **no** · なし |
| operation=save sent | **no** · 未送信 |
| Save executed | **no** · 未実行 |
| Rollback executed | **no** · 未実行 |
| DB write executed | **no** · 未実行 |
| SQL executed | **no** |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not executed** |

---

## Gates

```txt
gosakiDiscographyControlledSaveHandlerPermissionAwareLocalImplementationPrepared: true
phase: G-20u36e-controlled-save-handler-permission-aware-local-implementation
localImplementationOnly: true
edgeDeployExecuted: false
operationSaveSent: false
saveExecuted: false
rollbackExecuted: false
dbWriteExecuted: false
serviceRoleUsed: false
productionChanged: false
firstControlledSaveStillNotExecuted: true
recommendedNextPhase: G-20u36e-controlled-save-handler-permission-aware-local-verification
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta`  
**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Files changed (local only)

| File | Change |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/index.ts` | Forward `Authorization` into async handler · never log token · always async entry · pass `SUPABASE_URL` / `SUPABASE_ANON_KEY` |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | G-20u36e controlled Save gate · user-JWT client · `rpc('is_admin')` · title-only single-row UPDATE · post-save readBack |

No other `supabase/functions/**` files modified.

---

## 2. Controlled Save gate

All must match or Save is rejected:

| Field | Value |
| --- | --- |
| `operation` | `save` |
| `approvalId` | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| `sliceId` | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| `siteSlug` | `gosaki-piano` |
| legacy | `discography-002` |
| `targetRowId` | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| `trackNumber` | `1` |
| before title | `On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | **8 → 8** |
| track_7 | `Like a Lover` unchanged |
| release scalars | unchanged (if `release` provided) |
| add/delete/reorder | **forbidden** |
| changed field | **title only** |

Broad Save (any album / any track / missing sliceId) remains **forbidden**.

---

## 3. Authorization / user-JWT / is_admin

| Step | Behavior |
| --- | --- |
| Authorization | Required `Bearer` · forwarded from `index.ts` · **never logged** · never in response |
| Client | `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global.headers.Authorization })` |
| service_role | **not used** · env not referenced for write path |
| Admin | `client.rpc('is_admin')` must be `true` · else **403** (`admin_required`) |
| Missing auth | **401** (`missing_authorization`) |
| Invalid JWT | **401** (`invalid_jwt`) when auth error |
| Response PII | **no** user_id / email / JWT |

---

## 4. DB update

| Item | Value |
| --- | --- |
| Table | `public.discography_tracks` |
| Payload | `{ title: 'On a Clear Day [CMS Kit staging G-20u36e]' }` only |
| WHERE | site_slug · discography_legacy_id · track_number · id · title=before |
| Client `updated_at` | **not sent** |
| discography table | **not updated** |
| insert/delete/rebuild | **forbidden** |
| Expect | **exactly 1** row · 0 → conflict STOP · >1 → STOP |

Post-save user-JWT readBack: title after · track_count 8 · track_7 Like a Lover · target row count 1.

---

## 5. Failure cases (reasonCode)

`missing_authorization` · `invalid_jwt` · `admin_required` · `site_mismatch` · `approval_id_mismatch` · `slice_id_mismatch` · `discography_mismatch` · `row_id_mismatch` · `track_number_mismatch` · `current_title_mismatch` · `requested_title_mismatch` · `track_count_mismatch` · `track_7_mismatch` · `release_scalar_change_forbidden` · `add_or_delete_forbidden` · `reorder_forbidden` · `rls_or_permission_denied` · `update_zero_rows` · `update_multiple_rows` · `production_ref_blocked` · `service_role_forbidden`

---

## 6. What was NOT done

- Edge deploy
- HTTP `operation=save` / dryRun / readBack to live Edge
- SQL / DB write / Rollback / GRANT / POLICY
- package generate / FTP
- commit / push

---

## 7. Next phase

```txt
G-20u36e-controlled-save-handler-permission-aware-local-verification
```

Static/unit verification of gates. After that: Edge deploy **prep** (still no Save until explicit phase).

---

## Gate summary

```txt
gosakiDiscographyControlledSaveHandlerPermissionAwareLocalImplementationPrepared: true
edgeDeployExecuted: false
operationSaveSent: false
saveExecuted: false
recommendedNextPhase: G-20u36e-controlled-save-handler-permission-aware-local-verification
```
