# G-11c6d — Gosaki YouTube URL save endpoint smoke and admin wiring check

**Phase:** `G-11c6d-gosaki-youtube-url-save-endpoint-smoke-and-admin-wiring-check`  
**Status:** **complete** — live unauth smoke PASS; admin wiring static PASS; JWT admin smoke **deferred** (no staging admin creds locally)  
**Date:** 2026-06-25  
**Prior:** G-11c6c deploy execution (commit `5b80ef5`)

| Check | Status |
| --- | --- |
| Function reachable (staging) | **yes** |
| Unauthenticated POST | **401** |
| Save UI / wiring (static) | **PASS** |
| `saveEnabled:true` live request | **not sent** |
| Deploy / secrets / Save / dispatch | **no** |

---

## Gates

```txt
gosakiYoutubeUrlSaveEndpointSmokeAndAdminWiringCheckComplete: true
phase: G-11c6d
liveUnauthSmokePass: true
liveJwtAdminSmokeExecuted: false
saveEnabledTrueRequestExecuted: false
adminWiringStaticCheckPass: true
supabaseFunctionsDeployExecuted: false
supabaseSecretsSetExecuted: false
workflowDispatchExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
readyForG11c7WorkflowJsonPatchPlanning: true
```

---

## 1. Git state at check

| Item | Value |
| --- | --- |
| `HEAD` | `5b80ef5` |
| `origin/main` | `5b80ef5` |
| `git status --short` | clean |

---

## 2. Target

| Item | Value |
| --- | --- |
| Function | `gosaki-youtube-url-save` |
| URL | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-save` |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Production ref | **not used** (`vsbvndwuajjhnzpohghh` blocked in code only) |

---

## 3. Smoke — unauthenticated POST (live)

```bash
curl -i -X POST \
  https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-save \
  -H "Content-Type: application/json" \
  -d '{}'
```

| Item | Value |
| --- | --- |
| HTTP status | **401** |
| error code | `UNAUTHORIZED_NO_AUTH_HEADER` |
| message | `Missing authorization header` |
| `sb-project-ref` | `kmjqppxjdnwwrtaeqjta` |

Matches G-11c6c post-deploy smoke. **No JSON write / dispatch.**

---

## 4. Smoke — JWT bearer without `saveEnabled` (live, non-admin)

**Method:** anon key as `Authorization: Bearer` + `apikey` (staging anon from local `.env` — value not recorded).  
**Payload:** save-shaped fields but **`saveEnabled` omitted** (not `true`).

| Item | Value |
| --- | --- |
| HTTP status | **401** |
| error | `Unauthorized` |
| `saveEnabled` sent | **false** (field absent) |
| `saveReadiness` | n/a (rejected before save handler) |

**Interpretation:** non-admin / invalid session JWT does not reach save arm logic. **Not** a Save success path.

### JWT admin smoke (deferred)

Staging admin email/password not available in local env (`G9J5_STAGING_ADMIN_EMAIL` / `SUPABASE_ADMIN_EMAIL` UNSET).  
**Not executed:** authenticated admin POST without `saveEnabled:true`.

**Static expectation** (from `gosaki-youtube-url-save.ts`):

| Case | Expected |
| --- | --- |
| `saveEnabled` missing / not `true` | **400** `save_disabled` |
| `saveEnabled:true`, server arm off | **403** `save_not_armed` |
| `saveEnabled:true`, armed, changed | **200** `dispatch_deferred_g11c6a` — `workflowDispatchExecuted: false` |

Operator browser JWT admin smoke optional in future phase; **not required for G-11c6d closeout.**

---

## 5. Admin wiring (static / template)

**Scope:** Gosaki staging template only — **not** `src/pages/admin`.

| Check | Result |
| --- | --- |
| Save endpoint URL | `.../functions/v1/gosaki-youtube-url-save` (`G11C6A_STAGING_SAVE_ENDPOINT`) |
| `data-gosaki-youtube-save-endpoint` | present on body |
| Dry-run endpoint | unchanged — `.../functions/v1/gosaki-youtube-url-dry-run` |
| `data-gosaki-youtube-dry-run-endpoint` | present |
| Save section | visible (`#gra-youtube-save`) |
| Save button | `#gra-youtube-save-btn` **disabled** |
| Save click listener | **none** (dry-run listener only on `#gra-youtube-dry-run-btn`) |
| `data-g11c6-save-enabled` | default **false** |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | default off (`isG11c6aSaveEnabled`) |

---

## 6. Safety — G-11c6d phase

| Item | Status |
| --- | --- |
| `supabase functions deploy` | **not executed** |
| `supabase secrets set` | **not executed** |
| `saveEnabled:true` request | **not executed** |
| Save / JSON write / DB | **not executed** |
| `workflow_dispatch` | **not executed** |
| FTP / upload | **not executed** |
| `src/pages/admin` | **unchanged** |
| `.env` / `.env.local` | **unchanged** |

---

## 7. Local verification

```bash
node tools/static-to-astro/scripts/verify-g11c6d-gosaki-youtube-url-save-endpoint-smoke-and-admin-wiring-check.mjs
```

---

## 8. Next phase

`G-11c7-gosaki-youtube-url-save-workflow-json-patch-planning` — implement workflow JSON patch path (still no `workflow_dispatch` execution until later approval).

---

## References

- G-11c6c: `gosaki-youtube-url-save-edge-function-deploy-execution-result.md`
- G-11c6a: `gosaki-youtube-url-web-save-non-dry-run-slice-implementation.md`
- `gosaki-staging-read-only-admin.ts`
- `GosakiStagingReadOnlyAdminPage.astro`
