# CMS Core v2 — About Supabase Admin read/hydrate planning

- **Phase:** `cms-core-v2-about-supabase-admin-read-hydrate-planning`
- **Status:** **COMPLETE (docs / planning only — local implementation followed)**
- **Date:** 2026-07-28
- **Depends on:** Admin-path staging FTP post-QA **PASS** ([result](./cms-core-v2-about-supabase-admin-path-staging-ftp-post-qa-result.md))
- **Implementation:** [local implementation](./cms-core-v2-about-supabase-admin-read-hydrate-local-implementation.md)
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` **STOP**
- **Cursor this phase:** planning only · no code · no Edge · no DB · no FTP · no package · no commit

---

## Gates

```txt
phase: cms-core-v2-about-supabase-admin-read-hydrate-planning
ABOUT_SUPABASE_ADMIN_READ_HYDRATE_PLANNING_COMPLETE: true
readyForAboutSupabaseAdminReadHydrateImplementation: true
IMPLEMENTATION_EXECUTED: false
EDGE_DEPLOY_EXECUTED: false
DB_WRITE_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: must stay unset/false
REGISTRY_SITE_PAGE_FIELDS: false
PUBLIC_ABOUT_JSON_SOT: true
CONTENTS_ABOUT_PATH_RETAINED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Purpose

Today (Admin path live, FTP QA PASS):

- `writeBackend: "supabase"` · Save **disabled**
- Live-read **skips** Contents hydrate against Supabase Edge (avoids false `value_text_required`)
- Admin About **initial form values** still come from **bake-time JSON** (`gosaki-piano-about-content.json` → package HTML)
- Public `/about/` remains **JSON SoT** (`build-read=false`)

**Problem:** After a future Save to `site_page_fields.profile.lede`, Admin would still show baked JSON until a new package bake — misleading for operators.

**Goal of next implementation (not this phase):** add a **dedicated Admin read/hydrate path** that loads the latest `site_page_fields` `profile.lede` into the About form (first profile paragraph only), **read-only**, with fail-closed fallback to baked JSON — without changing public About or enabling Save.

---

## 2. Non-goals (explicit)

| Item | Status |
| --- | --- |
| Public About build-read / `registry.sitePageFields` | **out of scope** (stay false/unset) |
| Save UI arm / remote `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | **stay false / unset** |
| Contents G-12a deletion | **no** — keep fallback |
| Schedule / Discography / YouTube Admin | **no changes** |
| Expanding field allowlist beyond `about` / `profile.lede` | **no** |
| `service_role` | **forbidden** |
| production | **STOP** |

---

## 3. Recommended architecture

### 3.1 Why not reuse `operation=dryRun` alone

Current Edge dry-run requires `nextValueText` (empty → `value_text_required`). That is a **write-plan** contract, not a pure read. Using dry-run with a dummy `nextValueText` risks:

- confusing validation errors in UI
- accidental coupling to “would-write” plan semantics
- operators mistaking dry-run for hydrate

**Recommend:** dedicated **`operation=read`** (alias `hydrate` optional) on the **same** staging function `gosaki-about-supabase-save-dry-run` (or a clearly named sibling only if needed later).

### 3.2 Edge contract (read-only)

| Item | Value |
| --- | --- |
| Function | `gosaki-about-supabase-save-dry-run` (staging only) |
| New operation | `read` (preferred name) |
| Auth | Bearer user JWT + anon · `can_write_site` (owner / site membership — same as dry-run) |
| Allowlist | `siteSlug=gosaki-piano` · `pageKey=about` · `fieldKey=profile.lede` only |
| Body | **no** `nextValueText` required · reject other page/field keys with 400 |
| Behavior | SELECT current row · return `before` / `valueText` / `updatedAt` / `published` · **no UPDATE** |
| Write flags | always `didWrite:false` · `dbWrite:false` · `networkWrite:false` |
| Missing row | 404 `row_not_found` (client falls back to JSON) |
| Save arm | **irrelevant** for read (must work with server arm unset) |
| Production ref | STOP if URL contains production project |

Response sketch (no secrets):

```json
{
  "ok": true,
  "operation": "read",
  "pageKey": "about",
  "fieldKey": "profile.lede",
  "before": {
    "valueText": "…",
    "published": true,
    "sortOrder": 10,
    "updatedAt": "…",
    "rowId": "…"
  },
  "didWrite": false,
  "dbWrite": false,
  "networkWrite": false
}
```

### 3.3 Client Admin hydrate

| Step | Behavior |
| --- | --- |
| Gate | Only when `data-gosaki-about-write-backend=supabase` |
| Trigger | Existing live-read session after auth (same place Contents hydrate used to run) |
| Call | POST `operation=read` + allowlisted keys + approval id reserved for read (new id — do not reuse Save approval) |
| Apply | Surgical: overlay **first profile paragraph / lede** in the form with `before.valueText` · **do not** replace heading, bands, image alts, or full HTML from JSON |
| Success | live-read **ready** · baseline fingerprint from post-overlay form |
| Failure / 401 / 404 / network | **keep baked JSON** · live-read ready or soft-warn with Japanese message · **never** show raw codes (`userFacingAboutErrorMessage`) |
| Dirty form | Do not overwrite user edits (same defer rule as other Admin live-reads) |

### 3.4 Fallback layers (fail-closed)

1. Read Edge fails → baked JSON form (current behavior)
2. Path flag off package → Contents G-12a hydrate (unchanged)
3. Public site → JSON SoT until a **separate** build-read phase
4. Save remains disarmed regardless of read success

### 3.5 What stays unchanged

- Public convert / About JSON / `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ`
- Contents dry-run / Save Edges (G-12a)
- External `PACKAGE_RUN` / stale-backup rules
- Other Admin routes

---

## 4. Approval / env (implementation phase — not now)

| Item | Plan |
| --- | --- |
| Read approval id | New reserved id e.g. `G-cms-v2-about-supabase-profile-lede-read` (exact string locked in implementation preflight) |
| Client Save arm | stay `false` |
| Server Save arm | stay **unset** |
| Path env | already `true` on staging Admin package |
| New PUBLIC env for read | prefer **none** (path flag implies read); if needed, default-on under path flag only |

---

## 5. Implementation slices (future — do not start here)

1. **Docs lock** (this phase) — **done**
2. **Local Edge handler + mirror:** `operation=read` SELECT-only · verifiers · no deploy
3. **Client:** supabase live-read calls `read` · surgical lede overlay · Japanese errors
4. **Edge deploy preflight** (staging only) + operator deploy
5. **Package regenerate + manual FTP** + browser QA (lede matches DB · Save still disabled · public JSON unchanged)
6. **Only later:** public build-read planning (separate phase)

---

## 6. STOP conditions

Stop and ask human if:

- production Supabase / hosting might be involved
- `service_role` seems required
- Save arm enablement is requested “to make hydrate work”
- public About / `registry.sitePageFields` / build-read flip is bundled into this work
- allowlist expands beyond `about` / `profile.lede`
- Schedule / Discography / YouTube changes appear necessary
- read path would UPDATE / UPSERT / INSERT
- Edge deploy without signed preflight + operator approval
- outcome of read vs bake is ambiguous (which SoT wins) without explicit fallback rule
- Contents path would be deleted instead of retained

---

## 7. Success criteria (for later implementation QA)

| Check | Expect |
| --- | --- |
| Authed owner on `/admin/about/` | Form lede matches latest staging `site_page_fields.profile.lede` |
| Read failure | Baked JSON visible · no raw codes |
| `writeBackend` | `supabase` |
| Save | disabled · remote arm unset |
| Public `/about/` | still JSON (seed may match by coincidence; path not switched) |
| Unauthed | no privileged read leak |
| Other Admin routes | unchanged |

---

## 8. Next action

```txt
Next: cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight
Mode: docs preflight only first · Edge deploy requires separate operator approval
Local implementation: COMPLETE · EDGE_DEPLOY_EXECUTED: false
```
