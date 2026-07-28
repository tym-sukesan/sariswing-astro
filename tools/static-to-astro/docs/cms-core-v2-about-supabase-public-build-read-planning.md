# CMS Core v2 — About Supabase public build-read planning

**Phase:** `cms-core-v2-about-supabase-public-build-read-planning`
**Status:** **COMPLETE (planning)** · **local implementation COMPLETE** — see [local implementation](./cms-core-v2-about-supabase-public-build-read-local-implementation.md)
**Date:** 2026-07-28
**Prior:** [profile.lede Save roundtrip result PASS](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md)
**YouTube template:** [YouTube public build-read package prep](./cms-core-v2-youtube-supabase-public-build-read-package-prep.md)
**FTP QA checklist §C:** [about-supabase-ftp-post-qa.md](./cms-core-v2-about-supabase-ftp-post-qa.md)
**Verifier (planning):** `scripts/verify-cms-core-v2-about-supabase-public-build-read-planning.mjs`
**Verifier (impl):** `scripts/verify-cms-core-v2-about-supabase-public-build-read-local-implementation.mjs`
**Local implementation:** COMPLETE · package/FTP **not** executed

| Check | Status |
| --- | --- |
| Admin read/hydrate + Save roundtrip | **PASS** (DB baseline · arms false) |
| Public About today | **JSON SoT** · `publicAboutBuildRead=false` |
| Build-read loader / overlay code | **already present** (gated off) |
| Anon SELECT published `site_page_fields` | **yes** (RLS applied · do not re-run) |
| This planning: impl / package / FTP / arm | **not executed** |
| production touched | **no** |
| Blocking issue for local impl | **none** |

---

## Gates

```txt
phase: cms-core-v2-about-supabase-public-build-read-planning
ABOUT_SUPABASE_PUBLIC_BUILD_READ_PLANNING_COMPLETE: true
readyForAboutSupabasePublicBuildReadLocalImplementation: true
BLOCKING_ISSUE: false
IMPLEMENTATION_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
REGISTRY_SITE_PAGE_FIELDS: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset
PUBLIC_ABOUT_JSON_SOT: true
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED: false
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
STAGING_REF: kmjqppxjdnwwrtaeqjta
PRODUCTION_REF_STOP: vsbvndwuajjhnzpohghh
```

**Do not** flip build-read env, registry, Save arms, generate package, FTP, write DB, deploy Edge, or touch production in this planning phase.

---

## 1. 実施可否

| Path | Feasible? | Notes |
| --- | --- | --- |
| Prefer DB lede at convert/build | **YES** | `loadSitePageFieldsDataForBuild` + `applySitePageFieldsLedeToAboutConfig` already wired |
| Anon-only read (no service_role) | **YES** | RLS `site_page_fields_public_select_published` + `resolveSupabaseAnonReadEnv` |
| Keep JSON fallback | **YES** | empty/error/blocked → keep JSON (never blank About) |
| Staging package + verifier mode | **YES after local impl** | default verify must stay `publicAboutBuildRead=false`; armed-style explicit flag needed |
| production cutover | **NO in this phase** | staging QA first · separate production gate later |

**Verdict:** Proceed to **one** local implementation phase (harden + verifier + evidence), then operator-approved env-only package → FTP → browser QA. Registry persistence is a **follow-on ops step** after staging QA PASS (not a separate planning doc).

---

## 2. Recommended architecture

### 2.1 Read model (build time only)

```txt
convert / package bake
  → loadSiteSupabaseDataForBuild
  → loadSitePageFieldsDataForBuild (opt-in)
  → applyGosakiAboutContent(pageFieldsBundle)
  → overlay first <p> in about-profile-html
  → write src/data/gosaki-about-content.json + about/index.astro
  → Astro build → public-dist/about/
```

| Item | Locked value |
| --- | --- |
| Staging project | `kmjqppxjdnwwrtaeqjta` **only** |
| Production ref | `vsbvndwuajjhnzpohghh` **STOP** (loader returns `blocked`) |
| Table | `public.site_page_fields` |
| Filters | `site_slug=gosaki-piano` · `page_key=about` · `field_key=profile.lede` · `published=true` |
| Auth | **anon** via `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (or existing aliases in `resolveSupabaseAnonReadEnv`) |
| authenticated JWT | **not used** at build |
| service_role | **forbidden** |
| Edge Function | **not required** for public bake (Admin Edge remains for Save/read) |
| Overlay scope | **first `<p>` only** in profile block `about-profile-html` |
| Bands / images / other fields | stay JSON SoT (`about-bands-html` etc.) |

### 2.2 Dual gate (YouTube-compatible)

| Gate | Role |
| --- | --- |
| `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` | Temporary prefer-DB for package bake (registry stays false) |
| `registry.supabaseFeatures.sitePageFields=true` | Lasting prefer-DB (after staging QA; unset env) |

**First cutover:** env-only (mirror YouTube stage 2). Registry flip is later, after public QA PASS.

### 2.3 What gets baked into static HTML

1. Loader returns `pageFieldDataSource:"supabase"` + non-empty `profileLede.valueText`.
2. `overlayProfileLedeInHtml` replaces first `<p>…</p>` text (HTML-escaped).
3. Effective config written to `src/data/gosaki-about-content.json` in the Astro out dir (evidence artifact).
4. About page HTML updated → build → `public-dist/about/index.html` contains the DB lede string.

**Lag note (same as YouTube):** Admin Save updates DB immediately; public HTML updates only after rebuild + FTP. Document in operator QA.

### 2.4 PACKAGE_RUN / sourceCommit

| Field | Expected for build-read package |
| --- | --- |
| `publicAboutBuildRead` | `true` when env `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` |
| `aboutWriteBackend` | `supabase` (Admin path retained) |
| `aboutSaveUiArmed` | `false` |
| `completed` | `true` |
| `sourceCommit` | === bake HEAD |
| stale relocate | `_stale-backup/…` before generate · external `_package-runs/…/PACKAGE_RUN.json` |

**Known gap (fix in impl):** marker records **env only**. Registry-only enable would bake DB lede while `publicAboutBuildRead` stays false. Implementation must either (a) also set marker when registry OR overlay succeeded, or (b) forbid registry-only bake until marker sync lands. **Planning choice:** first cutover is **env-only**; registry flip only after marker sync in the same local impl or immediately after.

---

## 3. Fallback design

| Condition | `pageFieldDataSource` | Public About |
| --- | --- | --- |
| Both gates off | `null` (loader skipped) | JSON SoT unchanged |
| Anon env missing | `not-configured` | JSON keep |
| Production ref in URL | `blocked` | JSON keep |
| Network / PostgREST error | `error` | JSON keep |
| 0 published rows | `supabase-empty` | JSON keep |
| Empty `value_text` | `supabase-empty` | JSON keep |
| **>1 row** (should be impossible under unique) | **harden to `error`** (impl) | JSON keep — do **not** silently take `fields[0]` |
| Overlay no `<p>` / noop | overlay reason `overlay_noop` | JSON HTML unchanged (still applied as JSON) |
| Success | `supabase` | first `<p>` = DB lede |

**Never blank About.** Never invent lede text. Never delete `config/sites/gosaki-piano-about-content.json`.

### JSON fallback retention

| Period | Rule |
| --- | --- |
| Until staging build-read FTP QA PASS | JSON is SoT; build-read packages are temporary |
| After staging QA PASS | JSON retained as fallback forever for this slice (YouTube pattern) |
| Contents G-12a About Edges | **retained** (Admin dual-path / rollback) |
| Cutover condition for lasting prefer-DB | staging public HTML matches DB · fallback simulation documented · Save arms stay false · then optional `registry.sitePageFields=true` |

---

## 4. Required implementation + verifier changes (single local phase)

**No DB migration / RLS / seed / Edge deploy / Save arm in implementation.**

### 4.1 Code (minimal)

| Change | Why |
| --- | --- |
| `loadSitePageFieldsDataForBuild`: if `fields.length > 1` → `pageFieldDataSource:"error"` + reason `multiple_profile_lede_rows` | fail-closed multi-row |
| Convert / About apply: log `pageFieldDataSource`, `ledeOverlaid`, `rowCount`, truncated lede fingerprint (no secrets) | bake evidence |
| Optional: when overlay succeeds, ensure package bake marker can reflect build-read even if registry later — prefer sync `publicAboutBuildRead` with **effective** prefer-DB for this generate | marker honesty |
| Do **not** change Admin Save path / arms / Contents path | blast-radius control |

### 4.2 Package verifier

| Change | Why |
| --- | --- |
| Keep default `npm run verify:manual-upload` → expect `publicAboutBuildRead=false` | safe default |
| Add explicit `--expect-public-about-build-read` (and npm script) | mirror Save-UI-armed pattern |
| Expected bake: `{ aboutWriteBackend:"supabase", aboutSaveUiArmed:false, publicAboutBuildRead:true }` | fail-closed |
| HTML cross-check: `public-dist/about/index.html` contains escaped baseline lede (or documented DB text) | do not trust PACKAGE_RUN alone |
| Reject production ref in about HTML | STOP |
| Confirm Admin about: Save UI still `false` · supabase path retained | no Save bleed |
| Confirm other Save arms false | YouTube / Schedule / Discography |

### 4.3 Planning / fixture verifiers

- Extend `verify-package-stale-backup-and-run-marker.mjs` fixtures for build-read expected bake PASS + default reject.
- New planning verifier (this phase): docs + loader/overlay/RLS contracts still present · gates · no impl executed.

### 4.4 Out of scope for local impl

- Registry `sitePageFields=true` commit (ops after QA)
- Public build-read for fields other than `profile.lede`
- Runtime client fetch on public About (static bake only)
- production package / hosting

---

## 5. Staging QA procedure (after impl · operator)

### 5.1 Preflight (operator)

1. Confirm DB `value_text` === baseline: `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。`
2. Confirm remote `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=false` · Save UI false
3. Confirm staging anon env available for convert (no service_role)
4. Confirm HEAD committed for intended bake

### 5.2 Package bake (env-only)

```bash
# Conceptual — exact script wiring in implementation phase
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=false
export PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED=false
export CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true
# registry.sitePageFields stays false
# then package generate (manual-upload:package / site package builder)
```

Verify:

```bash
npm run verify:manual-upload:public-about-build-read
# or: node scripts/verify-manual-upload-package.mjs --expect-public-about-build-read
```

Record: `sourceCommit` · `PACKAGE_RUN.publicAboutBuildRead=true` · `pageFieldDataSource` log · baked data file lede.

Default `verify:manual-upload` **must FAIL** on this package (regression of disarmed/JSON default).

### 5.3 Operator FileZilla

- Upload **contents** of `public-dist/` → `/cms-kit-staging/gosaki-piano/`
- No auto FTP · no `mirror --delete` · not production

### 5.4 Browser QA (ftp-post-qa §C)

Base: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

1. Public `/about/` — first profile paragraph matches DB baseline lede
2. Spot-check Home / Schedule / Discography / Contact — no regression
3. `/admin/about/` — `writeBackend=supabase` · `saveDisabled=true` · read hydrate still works
4. Confirm production / Wix untouched
5. Optional offline: convert with build-read ON but empty/error mock → JSON fallback still shows About (local fixture; no staging DB delete)

### 5.5 After QA PASS

1. Record result doc
2. Optional follow-on: `registry.sitePageFields=true` + unset env (separate generate) — **only** after marker sync
3. Keep JSON + Contents retained
4. Save arms remain false

---

## 6. STOP conditions

Stop and ask human if:

- production ref appears in anon URL / HTML / package
- service_role seems required for build-read
- 0-row or multi-row on staging unexpectedly (do not invent lede; do not DELETE)
- overlay would blank About or wipe bands HTML
- default `verify:manual-upload` would be weakened to accept build-read without explicit flag
- Save UI / remote Save arm would need to turn on for public bake
- package generate hangs / outcome ambiguous → stop · do not retry FTP
- FTP path unclear · root `/` · production host
- migration / RLS / seed re-apply seems necessary

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
record incident
ask human
```

---

## 7. Impact isolation

| Surface | Expected |
| --- | --- |
| Public `/about/` profile first `<p>` | changes only when build-read ON and supabase success |
| Public About bands | unchanged (JSON) |
| Public home YouTube | unchanged (`siteEmbeds` already separate) |
| Schedule / Discography | unchanged |
| Admin About Save | unchanged · arms false |
| Contents G-12a | retained |
| package default verify | still expects `publicAboutBuildRead=false` |

---

## 8. Next phases (ordered · single plan)

1. ~~`cms-core-v2-about-supabase-public-build-read-local-implementation`~~ — **COMPLETE**
2. ~~Operator-approved **env-only** build-read package generate + verify~~ — **COMPLETE** (`sourceCommit` `95ada81…`)
3. ~~Operator FileZilla + browser QA (§C) + result doc~~ — **COMPLETE / PASS** — [result](./cms-core-v2-about-supabase-public-build-read-staging-ftp-post-qa-result.md)
4. Optional later: registry `sitePageFields=true` persistence (not required for vertical-slice close)
5. **Primary next (ops):** Gosaki staging **client-ready audit** (Home / Schedule / Discography / YouTube / About / Contact / mobile / admin routes)

No extra planning subdivision. About vertical slice **CLOSED COMPLETE / PASS**.

**LOCAL_IMPLEMENTATION note:** multi-row harden · bake report · `--expect-public-about-build-read` · noop_equal · clean-tree gate landed.

---

## 9. This phase verification

```bash
cd ~/sariswing-astro
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-public-build-read-planning.mjs
git diff --check
```

**Not run:** package · FTP · Secret · DB write · Edge · Save arm · commit / push · implementation.
