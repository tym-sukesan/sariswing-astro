# CMS Core v2 — About Supabase profile.lede Save roundtrip planning

**Phase:** `cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning`
**Status:** **COMPLETE (planning)** · **client adapter implementation COMPLETE** · **execution PASS** — see [roundtrip result](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md)
**Date:** 2026-07-28
**Baseline HEAD (planning):** `eeae89018c3791a14634c1b48a49324ed90ed3a2`
**Prior:** [read/hydrate staging FTP post-QA PASS](./cms-core-v2-about-supabase-admin-read-hydrate-staging-ftp-post-qa-result.md)
**Verifier (planning):** `scripts/verify-cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.mjs`
**Verifier (adapter):** `scripts/verify-cms-core-v2-about-supabase-save-client-adapter.mjs`
**Execution result:** [cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md) · impl `359a04a…` · verifier/package `fe4732b…` · arms restored false · DB baseline

| Check | Status |
| --- | --- |
| Admin `operation:"read"` live on staging | **yes** |
| writeBackend supabase · Save UI disabled | **yes** |
| Remote `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` unset | **yes** |
| Edge Save contract present (local source) | **yes** |
| Browser Save UI ready for supabase path | **yes** (adapter implemented · arms still false) |
| This planning phase: arm / Save / package / FTP | **not executed** |
| production touched | **no** |

---

## Gates

```txt
phase: cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning
ABOUT_SUPABASE_PROFILE_LEDE_SAVE_ROUNDTRIP_PLANNING_COMPLETE: true
readyForAboutSupabaseProfileLedeSaveRoundtripImplementation: true
ABOUT_SUPABASE_PROFILE_LEDE_SAVE_CLIENT_ADAPTER_IMPLEMENTATION_COMPLETE: true
IMPLEMENTATION_EXECUTED: true
readyForAboutSupabaseProfileLedeSaveArmedPackageGenerate: true
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset
REGISTRY_SITE_PAGE_FIELDS: false
PUBLIC_ABOUT_JSON_SOT: true
DB_WRITE_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
EDGE_DEPLOY_EXECUTED: false
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
baselineHead: eeae89018c3791a14634c1b48a49324ed90ed3a2
```

**Do not** set Save arm, flip Save UI, write DB, deploy Edge, generate package, or FTP until a separate operator-approved execution phase.

---

## 1. Roundtrip 実施可否

| Path | Feasible now? | Verdict |
| --- | --- | --- |
| **Edge contract** (`operation:"save"` + arm + approval + optimistic lock) | **YES** — handler already implements Save | Ready after operator arm + approval |
| **Browser Admin UI Save** (staging package) | **YES** — client adapter implemented · arms still false | Ready for armed package generate |
| **Owner Console / functions.invoke** (no UI bake) | **YES as fallback** | Same Edge contract; still needs remote arm + explicit approval |

**Planning decision:** Roundtrip **may proceed** via UI after armed package + temporary dual arm. Console invoke remains STOP-safe fallback.

**Not in planning phase:** arm / Save / package / FTP (adapter implementation landed separately).

---

## 2. Locked scope

| Item | Value |
| --- | --- |
| Staging project | `kmjqppxjdnwwrtaeqjta` **only** |
| Production | `vsbvndwuajjhnzpohghh` **STOP** |
| Function | `gosaki-about-supabase-save-dry-run` |
| siteSlug | `gosaki-piano` |
| pageKey | `about` |
| fieldKey | `profile.lede` |
| Table | `public.site_page_fields` |
| Column write | `value_text` **only** |
| Dry-run approval | `G-cms-v2-about-supabase-profile-lede-dry-run` |
| Save approval | `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice` |
| Client Save UI env | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` |
| Server Save arm env | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |
| Contents About Save env | stay **`false`** (single-arm) |
| Public About | JSON SoT · `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` **unset** |
| service_role | **forbidden** |
| DELETE / migration / RLS / seed re-run | **forbidden** |
| Other About fields / images / Bands | **unchanged** |
| Schedule / Discography / YouTube | **out of scope** |

---

## 3. Required implementation changes — **DONE**

See [client adapter implementation](./cms-core-v2-about-supabase-profile-lede-save-client-adapter-implementation.md).

Browser Save on supabase path now:

1. Uses `sanitizeAboutSupabaseDryRunEndpointDisplay` (fingerprint + `before.updatedAt`; no fileSha)
2. Uses `sanitizeAboutSupabaseSaveEndpointDisplay` (didWrite/dbWrite/after; no commitSha)
3. `evaluateAboutOperationalSaveGate` accepts `ABOUT_SUPABASE_SAVE_APPROVAL_ID`
4. `runSave` does not require Contents `dryRunFileSha` when `writeBackend=supabase`
5. Optimistic lock from dry-run `expectedBeforeUpdatedAt`
6. Contents path sanitizers/contracts **unchanged**

Edge redeploy: **not required**.

---

## 4. Roundtrip values (locked)

| Role | `value_text` |
| --- | --- |
| **Baseline** (seed / restore target) | `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。` |
| **Temporary forward** | `[CMS Kit staging] About profile.lede Save roundtrip PoC` |
| **Restore** | baseline string above |

**Success — forward Save**

- HTTP **200** · `ok:true` · `operation:"save"`
- `approvalId` = Save approval above
- `didWrite:true` · `dbWrite:true` · `networkWrite:false` · `writeBackend:"supabase"`
- `changedFields` includes `value_text` (only)
- `after.valueText` === temporary string
- `after.updatedAt` present and **≠** pre-Save `before.updatedAt`
- SELECT-only mid-check: `value_text` === temporary · `page_key/field_key` unchanged · `published`/`sort_order` unchanged

**Success — restore Save**

- Same response contract with `after.valueText` === baseline
- Final SELECT: `value_text` === baseline · `updated_at` advanced again · no other columns of interest changed
- Public `/about/` still JSON bake (unchanged) because build-read stays off

**Actor / `updated_by`**

- Edge UPDATE currently sets `value_text` only; do **not** fail the roundtrip solely on `updated_by` if null/unchanged.
- Record whether `updated_by` changed (informational). Must still confirm JWT owner + `can_write_site` path (no service_role).

---

## 5. Exact order (arm / package / FTP / Save)

Strict sequence for the **future execution** phase (operator + explicit approval). **None of this runs in planning.**

```txt
0. Implementation + verifier PASS (client supabase Save adapter) · commit on staging-safe HEAD
1. SELECT-only baseline snapshot (staging) · confirm value_text === baseline · note updated_at
2. Bake temporary Save-UI-armed package:
     PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true
     PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=true
     PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED=false
     CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ unset
     GOSAKI_ABOUT_SUPABASE_SAVE_ARMED still unset on remote
   → verify:manual-upload PASS · record sourceCommit + external PACKAGE_RUN
3. Operator FileZilla full public-dist overwrite to /cms-kit-staging/gosaki-piano/
   (no auto FTP · no mirror --delete)
4. Browser QA: login · writeBackend=supabase · read hydrate OK · Save button enabled (UI only)
5. Dry-run forward (temporary text) · capture fingerprint + expectedBeforeUpdatedAt
6. Remote Save arm ON (staging only):
     supabase secrets set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
7. Forward Save **once** (UI or invoke) · success contract above
8. SELECT-only mid confirm (temporary value_text · new updated_at)
9. Dry-run restore (baseline) · capture **new** lock from post-forward state
10. Restore Save **once** · success contract above
11. SELECT-only final confirm (baseline restored)
12. Remote Save arm OFF immediately:
      supabase secrets set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=false --project-ref kmjqppxjdnwwrtaeqjta
      (prefer explicit false; unset also OK if documented)
13. Bake Save-UI-**disarmed** package (SAVE_UI_ARMED=false · Contents Save false · path true · build-read unset)
    → verify:manual-upload · new sourceCommit
14. Operator FTP overwrite disarmed package
15. Browser confirm: saveDisabled=true · probe Save still save_not_armed if remote false
16. Record execution result doc · update AI context
```

**Arm ON window:** steps 6–12 only. Never leave remote arm true overnight. Never arm production.

**Approval form (execution phase only):**

```txt
承認します。この操作を1回だけ実行してください。
```

Separate approvals recommended for: (a) Save-UI armed package+FTP, (b) remote arm ON, (c) forward Save once, (d) restore Save once — or one bundled approval that lists all four with “1回だけ” each.

---

## 6. Save UI temporary enable (staging package)

| Env | Armed package | Disarm package (after) |
| --- | --- | --- |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | `true` | `true` (keep read path) |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | **`true`** | **`false`** |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | `false` | `false` |
| `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` | unset | unset |
| Remote `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | unset until step 6 | **false** after step 12 |

Generate (documented only):

```bash
cd ~/sariswing-astro
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=true   # temporary
export PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED=false
unset CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ
# Do NOT set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED in local bake env
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
cd tools/static-to-astro && npm run verify:manual-upload
```

Confirm bake: `data-gosaki-about-save-armed="true"` · `write-backend=supabase` · `PACKAGE_RUN.sourceCommit` === `git rev-parse HEAD` · stale-backup relocated · marker **outside** FTP tree.

---

## 7. Remote Save arm temporary true

```bash
# ON — staging ONLY (execution phase · after dry-run lock captured)
supabase secrets set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta

# OFF — immediately after restore SELECT PASS
supabase secrets set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=false --project-ref kmjqppxjdnwwrtaeqjta
```

**STOP** if `--project-ref` ≠ `kmjqppxjdnwwrtaeqjta` or equals `vsbvndwuajjhnzpohghh`.

Confirm OFF: unarmed Save probe → **403** · `ok:false` · `error:"save_not_armed"` · write flags false.

---

## 8. Optimistic lock

1. After login, Admin `operation:"read"` stores lede `updatedAt` baseline (already implemented).
2. Before each Save, run **dryRun** with intended `nextValueText`.
3. Capture `before.updatedAt` / response `expectedBeforeUpdatedAt`.
4. Save body:

```json
{
  "siteSlug": "gosaki-piano",
  "pageKey": "about",
  "fieldKey": "profile.lede",
  "operation": "save",
  "approvalId": "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice",
  "nextValueText": "<forward or baseline>",
  "expectedBeforeUpdatedAt": "<exact before.updatedAt from latest dry-run or read>"
}
```

5. Mismatch → **409** `stale_optimistic_lock` · **STOP** · no retry without new dry-run · do not escalate arm.

Restore Save **must** use lock from post-forward state (not the pre-forward timestamp).

---

## 9. SELECT-only checks (between forward and restore)

Staging SQL editor or equivalent — **SELECT only** (no UPDATE/DELETE):

```sql
select value_text, published, sort_order, updated_at, updated_by
from public.site_page_fields
where site_slug = 'gosaki-piano'
  and page_key = 'about'
  and field_key = 'profile.lede';
```

| When | Expect |
| --- | --- |
| Before arm / before forward | baseline text · note `updated_at` |
| After forward Save | temporary text · newer `updated_at` |
| After restore Save | baseline text · newer `updated_at` again |

Do not paste emails / JWT / UUIDs into git.

---

## 10. Failure / STOP / recovery

| Situation | Action |
| --- | --- |
| Wrong project ref / production URL in request | **STOP** · do not arm · do not Save |
| save_not_armed while intending Save | Check remote arm · do not bypass with service_role |
| 409 stale lock | **STOP** · re-read/dry-run · ask human before retry |
| Forward Save OK, restore fails | Prefer restore via one new dry-run+Save after lock refresh; if unclear **STOP** · leave temporary text · ask human (public still JSON) |
| Timeout / non-JSON / indeterminate | **STOP** · no retry · no cleanup · no alternate commands · record incident |
| Arm left true after abort | Set arm **false** immediately · confirm save_not_armed |
| Accidental Contents Save arm | Keep Contents Save **false**; do not dual-arm |
| Ambiguous DB state | SELECT-only snapshot · ask human · no DELETE |

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
record incident
ask human
```

---

## 11. Production ref gate

| Gate | Rule |
| --- | --- |
| Edge / secrets CLI | `--project-ref kmjqppxjdnwwrtaeqjta` only |
| Client assert | endpoint must not contain `vsbvndwuajjhnzpohghh` |
| Package | staging preview host only |
| Handler constants | `PRODUCTION_REF_STOP` retained |
| Auto FTP | `readyForAnyFutureFtpApply: false` |

---

## 12. Stale package / sourceCommit

| Check | Rule |
| --- | --- |
| Before generate | live package relocates to `_stale-backup/gosaki-piano/<ts>-<short-head>/` |
| Success marker | `output/manual-upload/_package-runs/gosaki-piano/PACKAGE_RUN.json` **outside** FTP payload |
| Verify | `sourceCommit` === bake HEAD · `completed:true` · bake env flags match |
| Armed vs disarm packages | **different** `sourceCommit`s · record both in execution result |
| FTP | upload **`public-dist/` contents only** · never `_stale-backup` / `_package-runs` |
| After disarm FTP | confirm Admin `saveDisabled:true` · `data-gosaki-about-save-armed="false"` |

Current staging read/hydrate package for reference: `84929cf0c52c86cc1bc36aef3f3e571d3970d2fb` (pre-roundtrip). Roundtrip packages will use newer HEADs after implementation commit(s).

---

## 13. Arm解除 + Save UI 再無効化の確認

| Step | Confirm |
| --- | --- |
| Remote arm false | Save probe → 403 `save_not_armed` · `ok:false` · write flags false · `saveArmed:false` |
| Disarm package baked | env `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=false` |
| Disarm FTP done | UI `saveDisabled:true` / `data-gosaki-about-save-armed="false"` |
| Path retained | `writeBackend:"supabase"` · read hydrate still works |
| Public About | still JSON · build-read unset |
| DB | final `value_text` === baseline |
| Docs | execution result records arm OFF + disarm `sourceCommit` |

---

## 14. Next phases (ordered)

1. ~~`cms-core-v2-about-supabase-profile-lede-save-client-adapter-implementation`~~ — **COMPLETE**
2. ~~Operator-approved **armed package generate** + FTP~~ — **COMPLETE** (execution result)
3. ~~Operator-approved Save roundtrip execution~~ — **COMPLETE / PASS** — [result](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md)
4. **Next:** public About build-read planning (`cms-core-v2-about-supabase-public-build-read-planning`)

Historical planning gates above remain as planning-time snapshot (`DB_WRITE_EXECUTED: false` etc.). Final post-execution state is recorded only in the result doc.
---

## 15. This phase verification

```bash
cd ~/sariswing-astro
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.mjs
git diff --check
```

**Not run:** Secret CLI · Save · package · FTP · Edge deploy · SQL mutation · commit / push.
