# CMS Core v2 — About Supabase Admin read/hydrate Edge post-redeploy QA result

**Phase:** `cms-core-v2-about-supabase-admin-read-hydrate-edge-post-deploy-qa-result`
**Status:** **COMPLETE / PASS** — operator manual remote QA recorded · Cursor did not invoke Edge / SQL / Secrets / FTP / package
**Date:** 2026-07-28
**Staging:** `kmjqppxjdnwwrtaeqjta`
**Production:** `vsbvndwuajjhnzpohghh` **STOP / untouched**
**Function:** `gosaki-about-supabase-save-dry-run` (`operation:"read"` **deployed**)
**Prior:** [re-deploy preflight](./cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.md) · [local implementation](./cms-core-v2-about-supabase-admin-read-hydrate-local-implementation.md)

```txt
ABOUT_SUPABASE_ADMIN_READ_HYDRATE_EDGE_POST_DEPLOY_QA_COMPLETE: true
POST_REDEPLOY_QA_EXECUTED: true
POST_REDEPLOY_QA_PASSED: true
EDGE_REDEPLOY_EXECUTED: true
operationReadLive: true
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
DB_WRITE_EXECUTED: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
readyForAboutSupabaseAdminReadHydrateAdminPathPackagePreflight: true
```

---

## Measured results (safe fields only)

| Step | Result |
| --- | --- |
| JWT なし `operation:"read"` | **401** |
| owner `operation:"read"` | **200** · `ok:true` · `operation:"read"` · `pageKey:"about"` · `fieldKey:"profile.lede"` · `valueTextMatch:true` · `updatedAtPresent:true` · `didWrite:false` · `dbWrite:false` · `networkWrite:false` |
| allowlist外 `pageKey` / `fieldKey` | both **400** · `ok:false` · write flags **false** |
| Save 未 arm | **403** · `ok:false` · `error:"save_not_armed"` · `didWrite/dbWrite/networkWrite:false` · `saveArmed:false` |
| QA前後 row | `valueTextMatch:true` · `published:true` · `sortOrder:10` · `updatedAtPresent:true` · **`updatedAtUnchanged:true`** |
| Side effects | DB write **なし** · remote Save arm **未設定** · production **未操作** |

**Do not record:** email · UUID · JWT · token · full Authorization headers.

---

## Notes

- `operation:"read"` is live on staging; Admin client hydrate can rely on this endpoint after the next Admin-path package bake + FTP.
- Server `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` remains **unset** — do not set.
- Prior dry-run / `save_not_armed` contracts remain intact (Save probe still 403 / `ok:false`).

---

## Next

**Admin-path staging package preflight (read/hydrate client bake)** —
[admin-read-hydrate-admin-path-package-preflight](./cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight.md)

Package generate / FTP: **not** in this result phase.
