# G-20u36e — Gosaki Discography controlled Save permission change post-apply result

**Phase:** `G-20u36e-controlled-save-permission-change-post-apply-result-record`  
**Status:** **complete** — Apply + Post-apply v2 result recorded · **PASS** · Save / Rollback **not executed**  
**Date:** 2026-07-14  
**Base commit:** `c1994ce`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-change-preflight-select-result.md](./gosaki-discography-g20u36e-controlled-save-permission-change-preflight-select-result.md) · [sql-prep](./gosaki-discography-g20u36e-controlled-save-permission-change-sql-prep.md)

| Check | Status |
| --- | --- |
| Apply SQL | **executed manually** (staging SQL Editor) |
| Apply result | **Success. No rows returned** |
| Initial Post-apply (exact name) | false negative — policy name truncation |
| Post-apply v2 SELECT-only | **PASS** |
| DB permission / RLS change | **yes** (GRANT + CREATE POLICY) |
| DB data UPDATE / INSERT / DELETE | **none** |
| operation=save | **not sent** · 未送信 |
| Save executed | **no** · 未実行 |
| Rollback executed | **no** · 未実行 |
| REVOKE / DROP POLICY | **no** |
| Edge implementation | **no** |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not executed** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionChangePostApplyResultRecorded: true
phase: G-20u36e-controlled-save-permission-change-post-apply-result-record
applySqlExecutedManuallyInStaging: true
applyResultSuccessNoRowsReturned: true
postApplyV2SelectPass: true
initialExactNameVerificationFalseNegativeDueTruncation: true
permissionChangeApplied: true
dbDataMutation: false
operationSaveSent: false
saveExecuted: false
rollbackExecuted: false
serviceRoleUsed: false
productionChanged: false
firstControlledSaveStillNotExecuted: true
readyForFirstControlledSaveExecution: false
actualObservedPolicyName: discography_tracks_g20u36e_controlled_save_title_update_restric
policynameLength: 63
recommendedNextPhasePendingChatgpt: G-20u36e-controlled-save-handler-permission-aware-planning OR G-20u36e-controlled-save-rollback-name-adjustment-prep
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Apply execution summary

| Item | Value |
| --- | --- |
| Executor | **operator** — staging Supabase SQL Editor |
| Result | **Success. No rows returned** |
| Changed | DB permission / RLS only |
| Data mutation | **none** |
| Cursor SQL execution this phase | **no** (record only) |

### Apply contents

| Statement | Status |
| --- | --- |
| `GRANT UPDATE (title) ON TABLE public.discography_tracks TO authenticated` | **applied** |
| `CREATE POLICY` (RESTRICTIVE UPDATE TO authenticated) | **applied** |

| Policy name | Value |
| --- | --- |
| Intended full name | `discography_tracks_g20u36e_controlled_save_title_update_restrictive` |
| **Actual observed** (PostgreSQL truncation) | **`discography_tracks_g20u36e_controlled_save_title_update_restric`** |
| `policyname_length` / `actual_restrictive_policy_name_length` | **63** |
| Scope | `ON public.discography_tracks` · `AS RESTRICTIVE` · `FOR UPDATE` · `TO authenticated` |

**PostgreSQL note:** Unquoted identifiers truncate to **63 bytes**. Future rollback/review should use the **observed truncated policy name** explicitly where possible.

---

## 2. Initial Post-apply vs v2

| Step | Outcome |
| --- | --- |
| Initial exact-name verification | `restrictive_policy_exists_count=0` — **false negative** due policy name truncation |
| Post-apply v2 SELECT-only | **PASS** |
| v2 `captured_at` | `2026-07-14T14:01:27.966199+00:00` |

---

## 3. Post-apply v2 checks (recorded) — PASS

| check_key | Value | Verdict |
| --- | --- | --- |
| `track_count` | **8** | **PASS** |
| `target_title` | **`On a Clear Day`** | **PASS** (unchanged — Save not run) |
| `data_mutation` | **false** | **PASS** |
| `track_7_title` | **`Like a Lover`** | **PASS** |
| `target_row_count` | **1** | **PASS** |
| `admin_all_policy_count` | **2** | **PASS** |
| `anon_write_grants_count` | **0** | **PASS** |
| `operation_save_involved` | **false** | **PASS** |
| `rls_enabled_discography_tracks` | **true** | **PASS** |
| `authenticated_table_update_grants_count` | **0** | **PASS** (column-level only) |
| `authenticated_title_update_column_grants_count` | **1** | **PASS** |
| `restrictive_policy_candidate_count` | **1** | **PASS** |
| `observed_truncated_policy_name_count` | **1** | **PASS** |
| `intended_full_policy_name_count` | **0** | expected after truncation |
| `actual_restrictive_policy_name` | `discography_tracks_g20u36e_controlled_save_title_update_restric` | **PASS** |
| `actual_restrictive_policy_name_length` | **63** | **PASS** |

### USING / WITH CHECK (recorded)

**`restrictive_policy_using`:**

```txt
((site_slug = 'gosaki-piano'::text) AND (discography_legacy_id = 'discography-002'::text) AND (track_number = 1) AND (title = 'On a Clear Day'::text))
```

**`restrictive_policy_with_check`:**

```txt
((site_slug = 'gosaki-piano'::text) AND (discography_legacy_id = 'discography-002'::text) AND (track_number = 1) AND (title = 'On a Clear Day [CMS Kit staging G-20u36e]'::text))
```

Match expected target slice.

---

## 4. Important interpretation

| Judgment | Status |
| --- | --- |
| Permission change applied | **yes** |
| Initial exact-name check | false negative (truncation) |
| Post-apply v2 | **PASS** |
| Target row data | **unchanged** (`On a Clear Day`) |
| authenticated title UPDATE grant | **1** only |
| authenticated table-wide UPDATE | **0** |
| anon write | **0** |
| Restrictive UPDATE policy | exists under **truncated** observed name |
| First controlled Save | **still not executed** |
| Save allowed | **no** until next phase explicitly enables/tests controlled Save path |

---

## 5. Rollback note (docs review only — **not executed**)

- Existing rollback SQL should be **reviewed/updated in docs** to account for actual observed truncated policy name.
- Do **not** execute rollback in this phase.
- Prefer explicit observed name for rollback/review:

```txt
discography_tracks_g20u36e_controlled_save_title_update_restric
```

- PostgreSQL truncates long unquoted identifiers to **63 bytes**.

---

## 6. What was not done (this phase)

- Save / `operation=save`
- Rollback / REVOKE / DROP POLICY
- Additional GRANT
- CREATE / ALTER POLICY (beyond already-applied Apply)
- SQL re-execution by Cursor
- DB data UPDATE / INSERT / DELETE
- Edge implementation / deploy
- Save enablement
- FTP / upload
- production change
- service_role
- JWT / token / user_id / email display

---

## 7. Next phase (ChatGPT 判断待ち)

Either:

1. **`G-20u36e-controlled-save-handler-permission-aware-planning`** — plan Save handler against applied permissions  
2. **`G-20u36e-controlled-save-rollback-name-adjustment-prep`** — prep rollback docs/SQL for truncated policy name  

**Do not** execute Save or Rollback until an explicit follow-on phase.

---

## Gate summary

```txt
gosakiDiscographyControlledSavePermissionChangePostApplyResultRecorded: true
postApplyV2SelectPass: true
permissionChangeApplied: true
actualObservedPolicyName: discography_tracks_g20u36e_controlled_save_title_update_restric
policynameLength: 63
saveExecuted: false
rollbackExecuted: false
firstControlledSaveStillNotExecuted: true
```
