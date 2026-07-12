# G-20u36d — Gosaki Discography Edge dry-run readBack root placement

**Phase:** `G-20u36d-readback-root-placement`  
**Status:** **complete** — root source placed · **no Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `d8be0da`  
**Prior:** G-20u36d readBack tools draft · root placement plan

| Check | Status |
| --- | --- |
| Root readBack source placed | **yes** |
| Scope exception files | **2 only** — index.ts + handler.ts |
| Other `supabase/functions/**` changed | **no** |
| Edge Function redeployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| service_role used | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackRootPlaced: true
phase: G-20u36d-readback-root-placement
rootPlacementExecuted: true
scopeExceptionFiles: 2
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
anonSelectPreferred: true
proceedToEdgeDeployPlan: true
proceedToEdgeDeploy: false
proceedToSave: false
```

**G-20u36d readBack root-placement scope:** copy readBack tools draft to root only. No deploy, no SQL, no Save enablement, no admin UI change.

---

## Copy map (executed)

| Copy from (tools draft) | Copy to (repo root) |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |

**Not copied:** `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` (verifier/mock only · logic inlined in handler.ts)

---

## Scope exception

| Rule | Value |
| --- | --- |
| Allowed root edits | **`supabase/functions/gosaki-discography-save-dry-run/index.ts`** · **`handler.ts` only** |
| Other `supabase/functions/**` | **unchanged** |
| Intentional diff from tools draft | **header comments + phase constant name only** |

---

## readBack policy (root source)

| Item | Value |
| --- | --- |
| Auth | **anon SELECT** via PostgREST GET · `SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | **not referenced** |
| Mutations | **none** — GET-only readBack adapter |
| Staging ref | `kmjqppxjdnwwrtaeqjta` only |
| Production STOP | `vsbvndwuajjhnzpohghh` — **forbidden** |
| readBack summary | **sanitized only** — no raw rows · no UUID · no secrets |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` — **always false** |
| `operation=save` | **rejected** |

### `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` env gate

| Env | Behavior |
| --- | --- |
| unset / not `true` | Schema-only fallback · `readBack: null` (backward compatible with pre-readBack deploy) |
| `true` + valid `SUPABASE_URL` + `SUPABASE_ANON_KEY` | anon SELECT readBack · DB-grounded diff |
| `true` + invalid env | Graceful fallback to schema-only (adapter creation fails in index.ts catch) |

**Note:** Deployed staging Edge still runs pre-readBack code until **G-20u36d-readback-edge-deploy** phase with operator approval.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| SQL mutation | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Live Supabase HTTP verify | **not executed** |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` arm on staging | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-edge-deploy-plan** | Pre-deploy checklist · env/secrets plan |
| **G-20u36d-readback-edge-deploy** | Staging Edge redeploy (operator approval) |
| **G-20u36d-readback-live-verify** | Live HTTP · DB-grounded diff accuracy |
| **G-20u36d-readback-admin-sanitizer-update** | Allow sanitized readBack in admin UI display |
| **G-20u36e-controlled-save-planning** | First controlled Save — **only after readBack stable** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-root-placement
npm run verify:g20u36d-readback-root-placement-plan
npm run verify:g20u36d-readback-implementation-in-tools-draft
```
