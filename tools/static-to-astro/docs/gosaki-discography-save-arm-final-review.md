# Gosaki Discography Save arm final review

- **Phase:** `gosaki-discography-save-arm-final-review`
- **Date:** 2026-09-23
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `85fda555`
- **Backend:** `kmjqppxjdnwwrtaeqjta`
- **Owner:** 後藤沙紀さん (`can_write_site` on `gosaki-piano`)
- **Status:** **READ-ONLY REVIEW COMPLETE**

**This phase did not:** Secrets mutate · DB write · Edge deploy · FTP · commit · push · Save POST.

**Operator premises (not re-verified here):** Schedule real Save **PASS** · Schedule Edge arm **unset** · owner login/read OK · kmjq backend.

---

## 0. Gates

```txt
DISCOGRAPHY_SAVE_ARM_FINAL_REVIEW_RESULT: PASS
SAFE_TO_ARM: true
ARM_EXECUTED: false
CLIENT_FLAG: PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED=true
EDGE_SECRET: GOSAKI_DISCOGRAPHY_SAVE_ARMED=true
DUAL_GATE: required for customer UI
MUTEX: discography only (armedCount must be 1)
SCHEDULE_UI_IN_NEW_PACKAGE: false (mutex switch)
OTHER_MODULES: remain unarmed
EDGE_REDEPLOY: false
PACKAGE_REBUILD_FOR_UI: true
FILEZILLA_FOR_UI: true
PUBLIC_AUTO_REFLECT: false
```

`SAFE_TO_ARM: true` = Discography-only dual-gate after a **separate** explicit approval. This review is **not** that approval.

Current on-disk production package (`generatedAt` `2026-09-22T14:41:42.028Z`, `sourceCommit=85fda555`):

- Schedule UI **`true`**
- Discography / YouTube / About UI **`false`**

---

## 1–3. Dual gate

| Gate | Name | Exact value | Where |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | **`true`** only (`raw === "true"`) | Astro → `data-gosaki-discography-save-armed` |
| Edge Secret | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` | **`true`** only | kmjq Function secrets |

Constant: `G20U41_DISCOGRAPHY_SAVE_UI_ARMED_ENV`. Inventory `featureId`: `gosaki-discography`.

**Customer UI Save needs both.**

| Client | Edge | UI Save | Direct `operation=save` (owner JWT) |
| --- | --- | --- | --- |
| false (current HTML) | unset | disabled | **403 `save_not_armed`** |
| **true** | unset | can enable | **403** · no DB write |
| false | **true** | still disabled | **can write via curl** |
| **true** | **true** | enabled after dry-run gates | **can write** |

Do **not** set the Secret while production HTML still has `data-gosaki-discography-save-armed="false"` unless the test is a controlled curl you immediately unset.

Production preflight still logs `Save arms: not set (must remain false)` even when the operator flag is set. Trust mutex `armedCount=1` / `gosaki-discography`.

---

## 4. Owner authz (`can_write_site`)

Proven path (Slice A apply + Slice B Save/restore):

1. Edge JWT → resolve `sites.site_slug=gosaki-piano` → `rpc("can_write_site")` (**not** `is_admin`).
2. DEFINER RPC `gosaki_discography_operational_save` — live kmjq redefined to **`can_write_site`** (Slice A). Repo file `20260721100000_*.sql` still documents historical `is_admin()` — **do not re-apply that migration**.
3. No table UPDATE/INSERT/DELETE GRANT to `authenticated`. Owner does **not** need direct RLS UPDATE on `discography`.

Slice B: owner `can_write_site=true` / `is_admin=false` → HTTP 200 description-only.

No new SQL for this arm.

---

## 5. Live Edge deploy

**Not required** to arm.

- Function: `gosaki-discography-save-dry-run` (already ACTIVE; Slice B VERSION **58** after secret revision).
- HEAD root `handler.ts` still `can_write_site` · byte-eq tools handler.
- tools `index.ts` is a stale draft; **deploy from repo-root** only if a future code change is intended.
- Last Discography function source commit is Slice A (`266f7b00`). Do **not** redeploy as part of arm.

Optional pre-arm check (operator): owner dryRun **200** · Save **403 `save_not_armed`**.

---

## 6. Write target / lock

| Item | Value |
| --- | --- |
| Tables | `public.discography` (+ `public.discography_tracks` only if track list changes) |
| Write | RPC `gosaki_discography_operational_save` (atomic · DEFINER) |
| Optimistic lock | **yes** — `expectedBeforeUpdatedAt` must equal current release `updated_at` |
| Editable | `title`, `artist`, `release_date`, `label`, `purchase_url`, `description` (+ tracks) |
| Frozen | `catalog_number`, `published`, `cover_image_url`, `streaming_url` |
| Save `approvalId` | `gosaki-discography-operational-save` |
| dryRun `approvalId` | `G-20u31-gosaki-discography-save-dry-run-endpoint` |
| Empty change | **422** `no_change` |
| Description-only | track DML skipped (Slice B / RPC) |

Do **not** reuse Slice B lock `2026-08-17T16:33:38.259361+00:00`. SELECT current `updated_at` first.

---

## 7–8. First live Save test

Reuse proven row **`discography-003`** (4 albums / 34 tracks stay). **description only** · then restore.

Baseline text after Slice B restore:

```txt
後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass
```

Do **not** change title / tracks / published / cover. Do **not** use `discography-002` G-20u36e track-title slice.

1. SELECT `legacy_id, description, updated_at` for `discography-003` (record before).
2. dryRun with current description+lock vs marker description → 200 · `wouldWrite: true` · `didWrite: false`.
3. Same values `operation=save` + `approvalId=gosaki-discography-operational-save` **once** → 200 · `changedFields: ["description"]`.
4. SELECT confirm + new lock.
5. Restore original description once.
6. Public `https://www.gosaki-piano.com/discography/` still old HTML (expected).

Hang / non-JSON / unexpected 200: **stop · do not retry · ask human**.

---

## 9. Rollback

```bash
npx supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Prefer **unset**, not `=false`. `--project-ref` mandatory (linked CLI is vsbvnd).

After unset: Save **403 `save_not_armed`**. dryRun stays 200. Row text is **not** reverted by unset.

Client UI rollback: rebuild **without** `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED=true` (optionally restore Schedule UI arm) + FileZilla `/admin/`.

Do **not** DROP RPC / RLS or redeploy Edge as arm rollback.

---

## 10. Other modules

Mutex **armedCount=1**. Arm **only** Discography client flag.

Leave **unset / not true**:

| Module | Client | Secret |
| --- | --- | --- |
| Schedule | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | `GOSAKI_SCHEDULE_SAVE_ARMED` (already unset) |
| YouTube Contents | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | `GOSAKI_YOUTUBE_URL_SAVE_ARMED` |
| YouTube Supabase | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` |
| About Contents | `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` |
| About Supabase | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |

YouTube/About PATH_ENABLED is **not** a Save arm.

**Side effect:** the new package will bake Schedule UI **`false`**. Current live Admin has Schedule UI `true` (Secret unset → Save 403). After Discography upload, Schedule Save button is disabled until a later Schedule-only rebuild.

---

## 11. Package / FileZilla

| Goal | Rebuild | FileZilla |
| --- | --- | --- |
| Curl-only proof Save | **no** | **no** |
| 後藤さん Admin UI | **yes** (git-clean · mutex 1 · discography only) | **yes** (`public-dist/` contents; at least all `/admin/` HTML) |

**Public pages do not auto-update.** Banner remains: `保存内容は公開ページへ自動反映されません`.

---

## Exact operator steps (customer UI · later approval)

Git-clean first (this review dirties docs). Linked CLI vsbvnd — always `--project-ref kmjqppxjdnwwrtaeqjta`.

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro

while IFS= read -r line; do
  case "$line" in
    PUBLIC_SUPABASE_URL=*|PUBLIC_SUPABASE_ANON_KEY=*) export "$line" ;;
  esac
done < .env.local

PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED=true npm run build:gosaki:production
```

Expect `[save-arm-mutex] PASS · … armedCount=1 · armedFeatureIds=gosaki-discography`.  
If `armedCount>=2` or `gosaki-schedule` still armed → **STOP**. Do not upload.

Verify HTML: Discography `"true"`; Schedule/YouTube/About `"false"`.

Then FileZilla `public-dist/` contents (no FTP `--apply`).

Then:

```bash
npx supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

One description-only Save on `discography-003` + restore. Keep Secret ON only if 後藤さん should keep using Discography Save.

---

## Risk

| Risk | Note |
| --- | --- |
| Secret ON before new HTML | UI off; **curl Save can write** |
| Omit `--project-ref` | secrets hit **vsbvnd** — STOP |
| Keep Schedule client arm | mutex FAIL or wrong module |
| Re-apply 20260721 RPC SQL | would restore `is_admin()` — **forbidden** |
| Stale Slice B lock | 409/stale — SELECT current `updated_at` |
| First Save changing tracks/title | avoid; description-only |
| Public discography HTML | stays stale until later bake |

---

## SAFE_TO_ARM

**true** for Discography-only dual-gate on kmjq, after explicit:

```txt
承認します。この操作を1回だけ実行してください。
```

**false** for execution in this review. Nothing was armed.
