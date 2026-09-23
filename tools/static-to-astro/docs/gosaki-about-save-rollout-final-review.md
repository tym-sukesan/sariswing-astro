# Gosaki About/Profile Save rollout final review

- **Phase:** `gosaki-about-save-rollout-final-review`
- **Date:** 2026-09-24
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `7927a834` (`hotfix/gosaki-disable-test-youtube`, clean at review start)
- **Backend:** `kmjqppxjdnwwrtaeqjta`
- **Owner:** 後藤沙紀さん (`can_write_site` on `gosaki-piano`)
- **Status:** **READ-ONLY REVIEW COMPLETE**

**This phase did not:** Secrets mutate · DB write · Edge deploy · build · FTP · commit · push · Save POST.

**Operator premises (not re-verified here):** Schedule / Discography / YouTube real Save **PASS** · YouTube Secret **unset** · production Admin About Supabase **path** already baked `enabled=true` · public site is static (CMS Save does not auto-reflect).

---

## 0. Gates

```txt
ABOUT_SAVE_ROLLOUT_FINAL_REVIEW_RESULT: PASS
SAFE_TO_ARM: true
ARM_EXECUTED: false
CLIENT_FLAG: PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=true
EDGE_SECRET: GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true
DUAL_GATE: required for customer UI
MUTEX: gosaki-about-supabase only (armedCount must be 1)
CONTENTS_ARM: MUST REMAIN FALSE (GitHub main write)
SCHEDULE_DISCOGRAPHY_YOUTUBE_UI: false in new package
EDGE_REDEPLOY: false
RLS_REAPPLY: false
PACKAGE_REBUILD_FOR_UI: true
FILEZILLA_FOR_UI: true
PUBLIC_AUTO_REFLECT: false
FIRST_TEST: profile.lede append then restore exact PRECHECK value_text
```

`SAFE_TO_ARM: true` = About **Supabase** dual-gate after a **separate** explicit approval. This review is **not** that approval.

**STOP — wrong arm:** do **not** set `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` or Secret `GOSAKI_ABOUT_CONTENT_SAVE_ARMED`. That is the GitHub Contents path (commits `main`). Production Admin already bakes `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` → `data-gosaki-about-write-backend="supabase"`.

Path env is **not** a Save arm and is **not** in the mutex.

---

## 1. Exact client env (UI bake)

| Item | Value |
| --- | --- |
| Name | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` |
| Exact value | **`true`** only (`isSaveArmExactTrue` / `raw === "true"`) |
| Constant | `ABOUT_SUPABASE_SAVE_UI_ARMED_ENV` |
| Inventory `featureId` | `gosaki-about-supabase` |
| HTML | `data-gosaki-about-save-armed` |

Not a Save arm (production bake **forces** this — do **not** treat as mutex):

| Name | Role |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | route switch Contents → Supabase (`createGosakiResolveBuildEnv` sets `"true"` on production profile) |

Do **not** arm:

| Name | Why |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | Contents / GitHub `main` |
| `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | mutex |
| `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | mutex |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | mutex |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | mutex + GitHub `main` |

Production preflight still logs `Save arms: not set (must remain false)` even when the operator flag is set. Trust mutex `armedCount=1` / `gosaki-about-supabase`.

---

## 2. Exact Edge Secret

| Item | Value |
| --- | --- |
| Name | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |
| Exact value | **`true`** only (`isAboutSupabaseSaveArmed` → `getEnv(...) === "true"`) |
| Handler | `supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts` (`SAVE_ARMED_ENV`) |
| Project | `--project-ref kmjqppxjdnwwrtaeqjta` only |

Set (execution phase only, after armed HTML is live):

```bash
npx supabase secrets set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

Unset after restore (prefer **unset**, not `=false`; both disarm because only exact `"true"` arms):

```bash
npx supabase secrets unset GOSAKI_ABOUT_SUPABASE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Linked CLI defaults to Sariswing production `vsbvndwuajjhnzpohghh` — **never omit `--project-ref`**.

Do **not** set `GOSAKI_ABOUT_CONTENT_SAVE_ARMED`. Confirm Schedule / Discography / YouTube Secrets remain **unset**.

Last recorded About Secret after the 2026-07-28 staging roundtrip: restored **false**. This review did **not** list live secrets.

---

## 3. Dual gate (both required for customer UI)

| Client | Edge | UI Save | Direct `operation=save` (owner JWT) |
| --- | --- | --- | --- |
| false (current HTML unless rebuilt) | unset | disabled | **403 `save_not_armed`** |
| **true** | unset | can enable | **403** · no DB write |
| false | **true** | still disabled | **can write via curl** |
| **true** | **true** | enabled after dry-run gates | **can write** |

Customer UI needs **both**. Do not set the Secret while production HTML still has `data-gosaki-about-save-armed="false"` unless the test is a controlled curl you immediately unset.

---

## 4. Owner authz (`can_write_site`)

Proven on this function (post-deploy QA + lede roundtrip):

1. Edge JWT → `sites.site_slug=gosaki-piano` → `rpc("can_write_site")` (**not** `is_admin`).
2. Table write: authenticated `UPDATE` on `public.site_page_fields` · RLS `site_page_fields_admin_update` (`can_write_site(site_id)`).
3. GRANT UPDATE columns: `value_text`, `published`, `sort_order` — Edge Save body writes **`value_text` only**.
4. No DELETE policy.
5. Owner already proven on Schedule / Discography / YouTube Saves; About Edge uses the same `can_write_site` helper.

**No new SQL** for this arm. Staging migration + RLS + seed already applied (`rlsAppliedStaging: true` · **do not re-run**).

---

## 5. Live Edge deploy

**Not required** to arm.

| Item | Value |
| --- | --- |
| Function | `gosaki-about-supabase-save-dry-run` |
| URL | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run` |
| Source | repo-root `supabase/functions/gosaki-about-supabase-save-dry-run/{handler,index}.ts` |
| root↔tools | **byte-eq** |
| Last handler commit | `c93f9e86` (2026-07-28) `feat: add About admin read hydrate` |
| Live evidence | post-deploy QA PASS (2026-07-27) · `operation=read` redeploy QA PASS (2026-07-28) · profile.lede Save roundtrip PASS (2026-07-28) |

Comment “LOCAL IMPLEMENTATION — Edge deploy later” on `index.ts` / `handler.ts` is **stale** — do not redeploy from that comment.

Optional pre-arm check (operator): owner `dryRun` **200** · `save` **403 `save_not_armed`**. If the function is missing (404), **STOP** — separate deploy phase, not this arm.

---

## 6. Write target / optimistic lock

| Item | Value |
| --- | --- |
| Table | `public.site_page_fields` |
| Keys | `site_slug=gosaki-piano` · `page_key=about` · `field_key=profile.lede` |
| Write | authenticated UPDATE · column **`value_text` only** |
| Authz RPC | `can_write_site(p_site_id)` (not a save RPC) |
| Optimistic lock | **yes** — `expectedBeforeUpdatedAt` must equal row `updated_at`; UPDATE also `.eq("updated_at", before)` → **409** `stale_optimistic_lock` |
| Frozen this slice | `published`, `sort_order`, identity columns, bands/images, other About fields |
| dryRun `approvalId` | `G-cms-v2-about-supabase-profile-lede-dry-run` |
| Save `approvalId` | `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice` |
| Read | `operation=read` · SELECT-only hydrate |
| Empty change | **200** `noChange: true` · `didWrite: false` (not a test) |

UI extracts **first `<p>`** via `extractAboutProfileLedeFromBody`. Do **not** edit heading / later paragraphs / Bands / images for this test — Edge will not persist them.

---

## 7. Safe test field and restoration value

**Field:** `profile.lede` → `site_page_fields.value_text` (first profile paragraph only).

Last known restored / JSON first `<p>` (2026-07-28 roundtrip + `config/sites/gosaki-piano-about-content.json`):

```txt
後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。
```

Seed/QA also had `published=true` · `sort_order=10`.

**This review did not SELECT live.** Restoration value is **exact PRECHECK `value_text`**, not a guessed string.

If PRECHECK matches the last-known baseline, forward append (not replace):

```txt
後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。 [CMS Kit] About Save PoC
```

Restore Save: exact PRECHECK string (baseline above). Keep `published` / `sort_order` unchanged.

**STOP** if PRECHECK is 0 rows, `published<>true`, or `value_text` is not the last-known baseline — do not invent a new lede.

---

## 8. PRECHECK SQL (SELECT-only · kmjq)

```sql
select
  site_slug,
  page_key,
  field_key,
  value_text,
  published,
  sort_order,
  updated_at
from public.site_page_fields
where site_slug = 'gosaki-piano'
  and page_key = 'about'
  and field_key = 'profile.lede';
```

Record `value_text` and `updated_at`. Do not paste emails / row UUIDs / JWTs into chat or git.

---

## 9. POSTCHECK SQL (same SELECT)

After **forward** Save:

- `value_text` = PRECHECK + ` [CMS Kit] About Save PoC`
- `published` / `sort_order` unchanged
- `updated_at` advanced

After **restore** Save:

- `value_text` = exact PRECHECK
- `published` / `sort_order` unchanged
- `updated_at` advanced again

---

## 10. dryRun / no-auth / Secret unset

Measured on live kmjq (2026-07-27/28 QA + roundtrip) · handler unchanged since `c93f9e86`:

| Case | Expected |
| --- | --- |
| OPTIONS | **200** `ok` (index CORS) |
| POST no JWT | **401** · no DB write |
| owner `operation=read` | **200** · `didWrite=false` |
| owner `operation=dryRun` | **200** · `didWrite=false` · `dbWrite=false` |
| owner `operation=save` while Secret unset / not `"true"` | **403** `save_not_armed` · `ok:false` · `didWrite=false` |
| wrong `pageKey` / `fieldKey` | **400** |
| stale `expectedBeforeUpdatedAt` | **409** `stale_optimistic_lock` |

---

## 11. Exact production build (About UI only)

Official generate requires **git-clean**. Commit this review first if the tree is dirty. Mutex: exactly one operational client arm.

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro

while IFS= read -r line; do
  case "$line" in
    PUBLIC_SUPABASE_URL=*|PUBLIC_SUPABASE_ANON_KEY=*) export "$line" ;;
  esac
done < .env.local

PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=true npm run build:gosaki:production
```

Do **not** `source .env.local` (would inject `SUPABASE_SERVICE_ROLE_KEY`). Do **not** set:

- `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED`
- `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED`
- `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED`
- `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED`
- `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` (keep **unset** during the Save test so public `/about/` stays JSON)

Production bake already forces About **path** `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true`.

Authoritative log:

```txt
[save-arm-mutex] PASS · armedCount=1 · armedFeatureIds=gosaki-about-supabase
```

Ignore production log `Save arms: not set (must remain false)` (hardcoded).

After bake, HTML must show:

- `data-gosaki-about-save-armed="true"`
- `data-gosaki-about-write-backend="supabase"`
- Schedule / Discography / YouTube save-armed **`false`**

FileZilla: `output/manual-upload/gosaki-piano-production/public-dist/` **contents** → production `/`. No FTP `--apply`.

---

## 12. Public `/about/` reflection (separate later generate)

CMS Save updates DB only. Public HTML is static.

| Gate | Role |
| --- | --- |
| `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` | convert/build overlays first `<p>` from published `site_page_fields` |
| `registry.supabaseFeatures.sitePageFields` | stays **`false`** (env-only cutover) |
| Loader | anon SELECT · no service_role · no Edge |

After restore + Secret unset, a **later** production generate:

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro
# same PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY export as above
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true npm run build:gosaki:production
```

Leave **all** Save UI arms unset. Then FileZilla `public-dist/` (especially `about/index.html`). Overlay is first `<p>` only; Bands stay JSON.

Do **not** combine this env with the Save-test arm package (would bake the temporary PoC string into public HTML if FileZilla ran while DB still had the suffix).

---

## 13. Final test procedure (execution phase only)

Each destructive step needs `承認します。この操作を1回だけ実行してください。`

1. PRECHECK SELECT PASS (baseline lede · `published=true`).
2. Git-clean production generate with About client arm **only** · mutex `gosaki-about-supabase` · FileZilla (build-read **unset**).
3. Confirm HTML: About save-armed `true` · write-backend `supabase` · other modules `false`.
4. Owner login `/admin/about/` · live-read hydrate shows PRECHECK lede.
5. Append ` [CMS Kit] About Save PoC` to the **first paragraph only** · Preview/dry-run · capture fingerprint + `expectedBeforeUpdatedAt`.
6. Secret set `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true` on kmjq.
7. Save **once** · POSTCHECK forward.
8. Dry-run restore (PRECHECK text) · **new** lock from post-forward `updated_at` · Restore Save **once**.
9. POSTCHECK restore.
10. Immediately:

```bash
npx supabase secrets unset GOSAKI_ABOUT_SUPABASE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

11. Retry Save → **403** `save_not_armed`. Public `/about/` unchanged until a later build-read generate.

---

## Risk

| Risk | Mitigation |
| --- | --- |
| Contents About arm | never set; GitHub `main` commit |
| Dual About arms (Contents+Supabase) | mutex `armedCount=2` FAIL |
| Secret on while old YouTube/Discography HTML still armed | mutex rebuild turns those UI flags off; confirm those Secrets **unset** |
| Edit bands / later paragraphs | Edge ignores them; test first `<p>` only |
| FileZilla with `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` during PoC | public `/about/` would show suffix — keep env unset until restore |
| Linked CLI default `vsbvnd` | always `--project-ref kmjqppxjdnwwrtaeqjta` |
| Empty / noChange Save | not a test |
| Re-apply RLS/seed | forbidden — already applied |

---

## Explicit non-actions (this phase)

SQL / Secret / deploy / build / FTP / commit / push / Save POST: **not executed**.
