# CMS Core v2 — About Supabase Admin read/hydrate local implementation

- **Phase:** `cms-core-v2-about-supabase-admin-read-hydrate-local-implementation`
- **Status:** **COMPLETE (local only)** — Edge `operation=read` + Admin client hydrate · **no Edge deploy / FTP / package / DB write / Save arm**
- **Date:** 2026-07-28
- **Baseline HEAD:** `3e7daae5a33d48cf56bc7ad4db645a596665b9be`
- **Planning:** [admin-read-hydrate-planning](./cms-core-v2-about-supabase-admin-read-hydrate-planning.md)
- **Verifier:** `scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs`
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **Production:** `vsbvndwuajjhnzpohghh` **STOP**

---

## Gates

```txt
phase: cms-core-v2-about-supabase-admin-read-hydrate-local-implementation
ABOUT_SUPABASE_ADMIN_READ_HYDRATE_LOCAL_IMPLEMENTATION_COMPLETE: true
IMPLEMENTATION_EXECUTED: true
EDGE_DEPLOY_EXECUTED: false
readyForAboutSupabaseAdminReadHydrateEdgeDeployPreflight: true
DB_WRITE_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: false
REGISTRY_SITE_PAGE_FIELDS: false
PUBLIC_ABOUT_JSON_SOT: true
CONTENTS_ABOUT_PATH_RETAINED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Read contract (Edge)

Function: `gosaki-about-supabase-save-dry-run` (root + tools mirror **byte-identical**)

| Item | Value |
| --- | --- |
| `operation` | `"read"` |
| Auth | Bearer JWT + anon · `can_write_site(site_id)` |
| Allowlist | `siteSlug=gosaki-piano` · `pageKey=about` · `fieldKey=profile.lede` |
| Mutates | **none** (SELECT only) |
| Requires | **no** `nextValueText` · **no** Save approval · Save arm irrelevant |
| Success | `200` · `ok:true` · `operation:"read"` · `pageKey` · `fieldKey` · `valueText` · `updatedAt` · `didWrite:false` · `dbWrite:false` · `networkWrite:false` |
| No JWT | `401` |
| Allowlist miss | `400` |

---

## 2. Admin client hydrate

| Step | Behavior |
| --- | --- |
| Gate | `writeBackend === "supabase"` only |
| When | live-read after owner auth (same session as Contents hydrate) |
| Call | POST `buildAboutSupabaseReadEndpointRequest()` |
| Success | `overlayAboutProfileLedeInBody` on profile body only · store `updatedAt` baseline internally |
| Failure | keep baked JSON · live-read still ready · no raw error codes |
| Unchanged | heading · bands · images · Save UI armed **false** · public About JSON |

---

## 3. Not executed

- Edge deploy / remote invoke
- package generate / FTP
- DB write / Secret / Save arm
- commit / push

---

## 4. Next

`cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight` — **COMPLETE**
See [edge re-deploy preflight](./cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.md).

```txt
Next: operator approval → one-shot staging re-deploy of gosaki-about-supabase-save-dry-run
Mode: Edge deploy execution separate · Save arm unset · then post-deploy read QA
```
