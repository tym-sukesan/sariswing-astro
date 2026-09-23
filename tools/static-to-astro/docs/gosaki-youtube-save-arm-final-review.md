# Gosaki YouTube Save arm final review

- **Phase:** `gosaki-youtube-save-arm-final-review`
- **Date:** 2026-09-23
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `83812007`
- **Backend:** `kmjqppxjdnwwrtaeqjta`
- **Owner:** 後藤沙紀さん (`can_write_site` on `gosaki-piano`)
- **Status:** **READ-ONLY REVIEW COMPLETE**

**This phase did not:** Secrets mutate · DB write · Edge deploy · FTP · commit · push · Save POST.

**Operator premises (not re-verified here):** Schedule real Save **PASS** · Schedule Edge arm **unset** · Discography real Save **PASS** · Discography Edge arm **unset** · owner login/read OK · kmjq backend.

---

## 0. Gates

```txt
YOUTUBE_SAVE_ARM_FINAL_REVIEW_RESULT: PASS
SAFE_TO_ARM: true
ARM_EXECUTED: false
CLIENT_FLAG: PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true
EDGE_SECRET: GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true
DUAL_GATE: required for customer UI
MUTEX: gosaki-youtube-supabase only (armedCount must be 1)
CONTENTS_ARM: MUST REMAIN FALSE (GitHub main write)
SCHEDULE_DISCOGRAPHY_ABOUT_UI: false in new package
EDGE_REDEPLOY: false
PACKAGE_REBUILD_FOR_UI: true
FILEZILLA_FOR_UI: true
PUBLIC_AUTO_REFLECT: false
FIRST_TEST: yt-placeholder-01 sortOrder 10→11 then restore 10 · published=false held
```

`SAFE_TO_ARM: true` = YouTube **Supabase** dual-gate after a **separate** explicit approval. This review is **not** that approval.

**STOP — wrong arm:** do **not** set `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` or Secret `GOSAKI_YOUTUBE_URL_SAVE_ARMED`. That is the GitHub Contents path (commits `main`). Production Admin already bakes `data-gosaki-youtube-write-backend="supabase"`.

Current on-disk production package (`generatedAt` `2026-09-23T11:27:52.465Z`, `sourceCommit=83812007`, fileCount 53):

- Discography UI **`true`**
- Schedule / YouTube / About UI **`false`**
- YouTube write backend **`supabase`** · endpoint `gosaki-youtube-supabase-save-dry-run`
- Public home: test video `I-eY9YMq9GI` **absent** (unpublished hide held)

---

## 1. Exact client env (UI bake)

| Item | Value |
| --- | --- |
| Name | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` |
| Exact value | **`true`** only (`isSaveArmExactTrue` / `raw === "true"`) |
| Constant | `YOUTUBE_SUPABASE_SAVE_UI_ARMED_ENV` |
| Inventory `featureId` | `gosaki-youtube-supabase` |
| HTML | `data-gosaki-youtube-save-armed` |

Not a Save arm (already forced on production bake — do **not** treat as mutex):

| Name | Role |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED` | route switch Contents → Supabase (production preflight sets `"true"`) |

Do **not** arm:

| Name | Why |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | Contents / GitHub `main` |
| `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | mutex |
| `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | mutex (current package has this **true**) |
| About Contents / About Supabase client arms | mutex |

Production preflight still logs `Save arms: not set (must remain false)` even when the operator flag is set. Trust mutex `armedCount=1` / `gosaki-youtube-supabase`.

---

## 2. Exact Edge Secret

| Item | Value |
| --- | --- |
| Name | `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` |
| Exact value | **`true`** only (`getEnv(...) === "true"`) |
| Handler | `supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts` (`SAVE_ARMED_ENV`) |
| Project | `--project-ref kmjqppxjdnwwrtaeqjta` only |

Unset (not `=false`) after the test:

```txt
npx supabase secrets unset GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Do **not** set `GOSAKI_YOUTUBE_URL_SAVE_ARMED`. Confirm Schedule / Discography / About Secrets remain **unset**.

---

## 3. Dual gate (both required for customer UI)

| Client | Edge | UI Save | Direct `operation=save` (owner JWT) |
| --- | --- | --- | --- |
| false (current HTML) | unset | disabled | **403 `save_not_armed`** |
| **true** | unset | can enable | **403** · no DB write |
| false | **true** | still disabled | **can write via curl** |
| **true** | **true** | enabled after dry-run gates | **can write** |

Customer UI needs **both**. Do not set the Secret while production HTML still has `data-gosaki-youtube-save-armed="false"` unless the test is a controlled curl you immediately unset.

---

## 4. Owner authz (`can_write_site`)

Aligned path (cross-module audit **ALIGNED** · RLS template live):

1. Edge JWT → `sites.site_slug=gosaki-piano` → `rpc("can_write_site")` (**not** `is_admin`).
2. Table write via column-level GRANT + RLS `site_embeds_admin_update` / `_insert` (`can_write_site(site_id)`).
3. No DELETE policy (soft-hide only).
4. Owner already proven on Schedule / Discography Saves; YouTube Edge uses the same helper.

No new SQL for this arm.

---

## 5. Live Edge deploy

**Not required** to arm.

- Function: `gosaki-youtube-supabase-save-dry-run`
- Staging Admin path QA (2026-07-24) used this live endpoint; production package already points at it (`data-gosaki-youtube-write-backend="supabase"`).
- HEAD handler (2026-07-22 `fe3fa3af`) is `can_write_site` · root↔tools **byte-eq**.
- Comment “LOCAL IMPLEMENTATION — Edge deploy later” is **stale** — do not redeploy from that comment.
- Do **not** redeploy as part of arm.

Optional pre-arm check (operator): owner dryRun **200** · Save **403 `save_not_armed`**. If the function is missing (404), **STOP** — that would be a separate deploy phase, not this arm.

---

## 6. Write target / optimistic lock

| Item | Value |
| --- | --- |
| Table | `public.site_embeds` (`provider=youtube`, `site_slug=gosaki-piano`) |
| Write | authenticated UPDATE (existing `legacy_item_id`) or INSERT (new id) |
| Optimistic lock | **yes** — fingerprint of current rows **and** `expectedBeforeUpdatedAtById[id] === updated_at` · UPDATE `.eq("updated_at", prev.updatedAt)` |
| Changed detection | `embedCode` / `published` / `sortOrder` only (**not** `title`) |
| Edge UPDATE columns | `source_url`, `embed_url`, `published`, `sort_order` |
| Frozen | identity / audit columns; DELETE |
| dryRun `approvalId` | `G-cms-v2-youtube-supabase-items-dry-run` |
| Save `approvalId` | `G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice` |
| Empty change | **200** `noChange: true` · `didWrite: false` (not a test) |

Do **not** INSERT a second item on the first test. Do **not** omit the unpublished item from `items[]` (delete is unsupported).

---

## 7–8. First live Save test (keep unpublished)

JSON SoT `config/sites/gosaki-piano-youtube-embed.json`:

- `id`: `yt-placeholder-01`
- `published`: **false**
- `sortOrder`: **10**
- `embedCode`: `https://youtu.be/I-eY9YMq9GI`

Public production package home currently has **no** that embed. `registry.siteEmbeds=true` means the **next** production bake will include any `published=true` `site_embeds` row. Flipping `published` to true would re-expose the test video on the next FileZilla public overwrite.

**Minimum Save:** `sortOrder` **10 → 11** on `yt-placeholder-01` only. Keep `published=false`. Keep the same `embedCode`. Restore **11 → 10**.

Do **not** copy the vertical-slice console sample that sends `published: true`.

### Pre-Save SELECT (required)

Confirm `legacy_item_id=yt-placeholder-01` · `published=false` · `sort_order=10` · note `updated_at` (no emails/UUIDs in chat/git).

**STOP** if `published=true` or the Admin form shows the item as published. Do not “fix” it in the first Save.

Title-only is **not** a write (fingerprint ignores title; Edge UPDATE omits `title`).

### Procedure (execution phase only · not this review)

1. Dual-gate arm (mutex YouTube Supabase only) after explicit approval.
2. Owner login → YouTube → dry-run baseline (`sortOrder` 10, `published` false) → `noChange` expected · capture fingerprint + lock.
3. Dry-run delta `sortOrder` 11 · same embed / `published=false` · expect `changedItemIds: ["yt-placeholder-01"]`.
4. Save **once** with baseline fingerprint/lock + items `sortOrder` 11.
5. SELECT: `sort_order=11` · `published=false` · URL unchanged.
6. Restore dry-run (`sortOrder` 10) → new fingerprint/lock → Restore Save once.
7. SELECT: `sort_order=10` · `published=false`.
8. `secrets unset GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta`.

Public HTML does **not** auto-reflect. Do not regenerate/upload public pages during the test.

---

## 9. Rollback

| Layer | Action |
| --- | --- |
| Edge arm | `secrets unset GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta` (**not** `=false`) |
| Row | Restore Save `sortOrder=10` `published=false` while still armed; then unset |
| Stuck restore | STOP · do not retry blindly · prefer Edge restore over SQL; scoped SQL only with a later approval |
| Client UI | next package with YouTube client arm **unset** (mutex 0 or another single module) |
| Public | no extra bake unless `published` was flipped (then emergency unpublished + regenerate) |

Do not DELETE `yt-placeholder-01`. Do not touch production `vsbvndwuajjhnzpohghh`.

---

## 10. Other modules stay unarmed

New generate must set **only** `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true`. Mutex turns Discography UI **off** (current package has it on).

Leave **unset / not true**:

| Module | Client | Secret |
| --- | --- | --- |
| Schedule | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | `GOSAKI_SCHEDULE_SAVE_ARMED` |
| Discography | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` |
| YouTube Contents | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | `GOSAKI_YOUTUBE_URL_SAVE_ARMED` |
| About Contents | `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` |
| About Supabase | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |

---

## 11. Package rebuild / FileZilla

| Question | Answer |
| --- | --- |
| Rebuild production package? | **yes** — customer UI cannot Save until bake has YouTube arm `true` |
| FileZilla overwrite? | **yes** — `public-dist/` **contents** to production `/` (no FTP `--apply`) |
| Public home must change? | **no** — Save does not rewrite static HTML; keep unpublished |
| Git-clean | required for official generate; commit this review first if the tree is dirty |

---

## Risk

| Risk | Mitigation |
| --- | --- |
| Contents YouTube arm | never set; GitHub `main` commit |
| `published=true` | first Save sortOrder only; STOP if already published |
| Next production bake | `registry.siteEmbeds=true` will bake published DB rows |
| Dual YouTube arms (Contents+Supabase) | mutex `armedCount=2` FAIL |
| Secret on while old Discography HTML still armed | confirm Discography Secret **unset** first |
| Empty fingerprint Save | noChange / fail-closed — not a test |
| INSERT new item | out of first-test scope |
| Linked CLI default `vsbvnd` | always `--project-ref kmjqppxjdnwwrtaeqjta` |

---

## Explicit non-actions (this phase)

Secrets · DB write · Edge deploy · FTP · commit · push · Save · package generate.
