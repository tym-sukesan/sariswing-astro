# G-20u36e — Gosaki Discography controlled Save Edge deploy prep

**Phase:** `G-20u36e-controlled-save-edge-deploy-prep`  
**Status:** **complete** — deploy prep only · **Edge deploy NOT executed**  
**Date:** 2026-07-14  
**Base commit:** `f6b371e`  
**Prior:** [local-verification](./gosaki-discography-g20u36e-controlled-save-handler-permission-aware-local-verification.md)

| Check | Status |
| --- | --- |
| Deploy prep only | **yes** |
| Edge deploy | **no** · 未実行 |
| `supabase functions deploy` | **not run** |
| operation=save | **not sent** · 未送信 |
| Save executed | **no** · 未実行 |
| DB write | **no** |
| Rollback executed | **no** · 未実行 |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not executed** |

---

## Gates

```txt
gosakiDiscographyControlledSaveEdgeDeployPrepared: true
phase: G-20u36e-controlled-save-edge-deploy-prep
deployPrepOnly: true
edgeDeployExecuted: false
operationSaveSent: false
saveExecuted: false
dbWriteExecuted: false
rollbackExecuted: false
serviceRoleUsed: false
productionChanged: false
firstControlledSaveStillNotExecuted: true
targetFunction: gosaki-discography-save-dry-run
stagingProjectRef: kmjqppxjdnwwrtaeqjta
productionProjectRefStop: vsbvndwuajjhnzpohghh
recommendedNextPhase: G-20u36e-controlled-save-edge-deploy-execution
```

---

## 1. Deploy target

| Item | Value |
| --- | --- |
| Function | `gosaki-discography-save-dry-run` |
| Staging project ref | `kmjqppxjdnwwrtaeqjta` |
| Production STOP | `vsbvndwuajjhnzpohghh` — **never deploy here** |
| Source files | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |
| | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |

---

## 2. Pre-deploy checklist

| Check | Expected before operator deploy |
| --- | --- |
| git status | **clean** |
| HEAD = origin/main | **yes** |
| local verification | **PASS** (`verify:…-local-verification`) |
| local implementation verifier | **PASS** |
| current-active-regression | **PASS** |
| service_role | **not used** |
| Auth model | `SUPABASE_ANON_KEY` + incoming Authorization user-JWT |
| `operation=save` | controlled gate only |
| Save | **not executed** yet |
| DB permission / RLS | **applied** (post-apply v2 PASS) |
| rollback actual policy name | **prepared** (`…_restric`) |

---

## 3. Deploy command (prepared · **未実行**)

```bash
cd ~/sariswing-astro
supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Detail |
| --- | --- |
| Cursor / this phase | **do not run** |
| Operator | run **only after ChatGPT review** · staging ref only |
| Production | **never** use `vsbvndwuajjhnzpohghh` |

---

## 4. Post-deploy verification (do **not** Save immediately)

After deploy succeeds:

1. Deployed function **smoke check**
2. Safe check with **non-save** operation (`dryRun` / health) if needed
3. Admin probe / read-only check
4. **Pre-save SELECT-only** verification (grants / restrictive policy / target title still old)
5. Only then judge whether controlled Save execution is allowed

**Do not** send `operation=save` as the first post-deploy action.

---

## 5. STOP conditions

Do **not** deploy if any of:

| # | Condition |
| --- | --- |
| 1 | Project ref ≠ `kmjqppxjdnwwrtaeqjta` |
| 2 | Production ref `vsbvndwuajjhnzpohghh` is targeted |
| 3 | git status not clean |
| 4 | HEAD ≠ origin/main |
| 5 | Required verifiers not PASS |
| 6 | service_role reference required for deploy path |
| 7 | Target function name ≠ `gosaki-discography-save-dry-run` |
| 8 | Deploy command mixes production ref |
| 9 | Plan to send `operation=save` before deploy/smoke/pre-save SELECT |
| 10 | Plan DB write / SQL / rollback before deploy |

---

## 6. Next phase

```txt
G-20u36e-controlled-save-edge-deploy-execution
```

Operator-manual deploy once (explicit approval). Still no Save until post-deploy smoke + pre-save SELECT PASS.

---

## Gate summary

```txt
gosakiDiscographyControlledSaveEdgeDeployPrepared: true
edgeDeployExecuted: false
deployCommandPrepared: true
recommendedNextPhase: G-20u36e-controlled-save-edge-deploy-execution
```
