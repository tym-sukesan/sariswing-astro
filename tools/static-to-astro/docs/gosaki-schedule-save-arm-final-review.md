# Gosaki Schedule Save arm final review

- **Phase:** `gosaki-schedule-save-arm-final-review`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `b3ad1ebd`
- **Backend:** `kmjqppxjdnwwrtaeqjta`
- **Owner:** 後藤沙紀さん (`can_write_site` on `gosaki-piano`)
- **Status:** **READ-ONLY REVIEW COMPLETE**

**This phase did not:** Secrets mutate · DB write · Edge deploy · FTP · commit · push · Save POST.

**Operator premises (not re-verified here):** owner dryRun **200** · Save **403 `save_not_armed`** · `schedules_site_writer_update` applied · Edge deployed.

---

## 0. Gates

```txt
SCHEDULE_SAVE_ARM_FINAL_REVIEW_RESULT: PASS
SAFE_TO_ARM: true
ARM_EXECUTED: false
CLIENT_FLAG: PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true
EDGE_SECRET: GOSAKI_SCHEDULE_SAVE_ARMED=true
DUAL_GATE: required for customer UI
MUTEX: schedule only (armedCount must be 1)
OTHER_MODULES: remain unarmed
PACKAGE_REBUILD_FOR_UI: true
FILEZILLA_FOR_UI: true
PUBLIC_AUTO_REFLECT: false
```

`SAFE_TO_ARM: true` = dual-gate Schedule-only path after a **separate** explicit approval. This review is **not** that approval.

---

## 1–4. Dual gate

| Gate | Name | Exact value | Where |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | **`true`** only (`raw === "true"`) | Astro bake → `data-gosaki-schedule-save-armed` |
| Edge Secret | `GOSAKI_SCHEDULE_SAVE_ARMED` | **`true`** only | kmjq Function secrets |

**Customer UI Save needs both.**

| Client | Edge | UI Save button | Direct `operation=save` POST (owner JWT) |
| --- | --- | --- | --- |
| false (current package) | unset | disabled | **403 `save_not_armed`** · no DB write |
| **true** | unset | can enable | **403 `save_not_armed`** · no DB write |
| false | **true** | still disabled | **can UPDATE** (curl / crafted POST) |
| **true** | **true** | enabled after dry-run gates | **can UPDATE** |

Do **not** turn Edge secret on while production HTML still has `data-gosaki-schedule-save-armed="false"` unless the test is a **controlled curl** you immediately roll back.

---

## 5–6. Schedule only

Package generate mutex: **exactly one** operational client arm, or zero.

Arm **only**:

- `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true`
- `GOSAKI_SCHEDULE_SAVE_ARMED=true`

Leave **unset / not true**:

| Module | Client | Secret |
| --- | --- | --- |
| Discography | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` |
| YouTube Contents | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | `GOSAKI_YOUTUBE_URL_SAVE_ARMED` |
| YouTube Supabase | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` |
| About Contents | `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` |
| About Supabase | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |

PATH_ENABLED (YouTube/About supabase route) is **not** a Save arm. Do not confuse with mutex.

Save POST `approvalId` must be exactly `gosaki-schedule-operational-save`.

---

## 11–13. Package / upload / public site

Current official production HTML bakes `data-gosaki-schedule-save-armed="false"`. Secret cannot change that.

| Goal | Rebuild `build:gosaki:production` | FileZilla |
| --- | --- | --- |
| Curl-only proof Save | **no** | **no** |
| 後藤さん Admin UI Save | **yes** (git-clean + mutex 1) | **yes** (`public-dist/` contents, at least all `/admin/` HTML) |

**Public pages do not auto-update.** Convert/bake reads schedules at package generate. CMS Save writes `public.schedules` only. Banner remains: `保存内容は公開ページへ自動反映されません`. Live `/schedule/` HTML stays until a **later** production rebuild+upload.

---

## 7–8. Exact test plan (after a later arm approval)

**Minimal DB-safe first Save:** one **existing** `gosaki-piano` row · **description only** · then restore.

Prefer an already-unpublished test row if still unpublished (`schedule-2026-09-001` historically). Do **not** invent a new event. Do **not** change `date` / `published` on a live public event for the first test.

1. SELECT `id, legacy_id, description, published, updated_at` (record before).
2. `operation=dryRun` `mode=edit` with **current** `published` + new description marker + matching `expectedBeforeUpdatedAt` → 200 · `wouldWrite: true` · `didWrite: false`.
3. Same body `operation=save` + `approvalId=gosaki-schedule-operational-save` **once** → 200 · `didWrite: true` · `changedFields: ["description"]`.
4. SELECT confirm description + new `updated_at`.
5. Restore original description (second Save **or** stop and ask human — do not loop).
6. Public `https://www.gosaki-piano.com/schedule/` still shows **old** HTML (expected).

Empty `changedFields` Save is **422** (`no changed fields`). dryRun with identical values is 200 `wouldWrite: false` and does **not** prove Save.

---

## 9–10. Rollback

Edge (kmjq only — never omit `--project-ref`):

```bash
npx supabase@2.114.0 secrets unset GOSAKI_SCHEDULE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Prefer **unset**, not `=false`. Handler treats only exact `"true"` as armed, so `false` also blocks Save, but project convention is unset.

After unset: `operation=save` → **403 `save_not_armed`** again. dryRun stays 200. Row data is **not** rolled back by unset (restore the description separately if the test write remains).

Client UI rollback: rebuild **without** `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true` and re-upload `/admin/`.

Do **not** DROP `schedules_site_writer_update` or redeploy Edge as arm rollback.

---

## Exact operator steps (customer UI · later approval)

CWD repo root. Linked CLI is vsbvnd — **always** `--project-ref kmjqppxjdnwwrtaeqjta`.

1. Confirm git-clean at intended HEAD.
2. Generate with **only** Schedule client arm (inline env, do not persist in `.env`):

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro
PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true npm run build:gosaki:production
```

Expect mutex `[save-arm-mutex] PASS · … armedCount=1 · armedFeatureIds=gosaki-schedule`.  
If `armedCount>=2` → **STOP**. Do not upload.

3. Verify admin HTML: Schedule `data-gosaki-schedule-save-armed="true"`; discography/youtube/about remain `"false"`.
4. FileZilla `public-dist/` **contents** (no FTP `--apply`).
5. Then:

```bash
npx supabase@2.114.0 secrets set GOSAKI_SCHEDULE_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

6. One description-only Save (§7–8). Stop on hang / non-JSON / unexpected 200 count.
7. Keep both armed only if 後藤さん should keep saving; otherwise unset Secret immediately.

Hang / unclear outcome: **stop · do not retry · do not unset-as-cleanup-loop · ask human**.

---

## Risk

| Risk | Note |
| --- | --- |
| Secret ON without UI bake | UI still off; **curl Save can write** |
| Omit `--project-ref` | secrets hit **vsbvnd** — STOP |
| Mutex 2+ client arms | package generate fails (good) or wrong module UI |
| First Save on a public event | avoid; use unpublished / description-only + restore |
| Leave Secret ON | owner can keep writing DB; public HTML still stale until rebuild |
| `=false` vs unset | both disarm; prefer unset |

---

## SAFE_TO_ARM

**true** for Schedule-only dual-gate on kmjq, after explicit:

```txt
承認します。この操作を1回だけ実行してください。
```

**false** for execution in this review. Nothing was armed.
