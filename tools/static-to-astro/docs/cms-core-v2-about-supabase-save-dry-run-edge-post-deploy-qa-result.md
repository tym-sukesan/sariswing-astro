# CMS Core v2 — About Supabase Edge post-deploy QA result

**Phase:** `cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-result`
**Status:** **COMPLETE / PASS** — operator manual remote QA recorded; Cursor did not invoke Edge / SQL / Secrets / FTP
**Date:** 2026-07-27
**Staging:** `kmjqppxjdnwwrtaeqjta`
**Production:** `vsbvndwuajjhnzpohghh` **STOP / untouched**
**Function:** `gosaki-about-supabase-save-dry-run`
**Runbook:** [edge-post-deploy-qa-runbook](./cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-runbook.md)
**Prior:** Edge deploy · `save_not_armed` ok contract fix (local) · remote Save arm unset

```txt
ABOUT_SUPABASE_EDGE_POST_DEPLOY_QA_COMPLETE: true
POST_DEPLOY_QA_EXECUTED: true
POST_DEPLOY_QA_PASSED: true
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
DB_WRITE_EXECUTED: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
readyForAboutSupabaseAdminPathPackagePreflight: true
```

---

## Measured results (safe fields only)

| Step | Result |
| --- | --- |
| 1 OPTIONS | **200** · CORS PASS |
| 2 JWT なし POST | **401** |
| 3 owner dryRun | **200** · `ok:true` · `didWrite:false` · `dbWrite:false` |
| 4 didWrite false | **PASS** (from Step 3) |
| 5 Save 未 arm | **403** · `ok:false` · `error:save_not_armed` · `didWrite:false` · `dbWrite:false` · `saveArmed:false` |
| 6 不正 pageKey / fieldKey | both **400** · `ok:false` · write flags false |
| 7 seed unchanged | `valueTextMatch:true` · `published:true` · `sortOrder:10` · `updatedAtPresent:true` · `updatedAtUnchanged:true` |
| 8 side effects | production 未操作 · Save arm 未設定 · DB write なし |

**Do not record:** email · UUID · JWT · token · full Authorization headers.

---

## Notes

- Step 5 body `ok:false` confirms the `save_not_armed` contract (plan.ok overwrite fix) is live on staging for this QA.
- Server `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` remains **unset** — do not set.
- Contents About Edges / G-12a path **unchanged** by this Edge-only QA.

---

## Next

**Admin-path staging package preflight** — [admin-path-package-preflight](./cms-core-v2-about-supabase-admin-path-package-preflight.md)
Package generate / FTP: **not** in this result phase.
