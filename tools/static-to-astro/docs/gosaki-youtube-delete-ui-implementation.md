# Gosaki YouTube delete UI implementation

- **Phase:** `gosaki-youtube-delete-ui-fix`
- **Date:** 2026-09-23
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **Status:** **LOCAL IMPLEMENTATION COMPLETE** · live delete **not** executed
- **Backend:** `kmjqppxjdnwwrtaeqjta` (target only — no live write this phase)

**This phase did not:** DB write · Secret mutate · Edge deploy · FTP · commit · push · RLS apply.

**Operator premises:** YouTube Supabase Save PASS · `yt-ce00cf60` unpublished leftover · `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` **unset**.

---

## 0. Gates

```txt
YOUTUBE_DELETE_UI_IMPLEMENTATION_RESULT: PASS
SAFE_TO_TEST_DELETE: true
LIVE_DELETE_EXECUTED: false
DELETE_ENDPOINT: gosaki-youtube-supabase-save-dry-run
DELETE_OPERATION: delete
DELETE_APPROVAL_ID: G-cms-v2-youtube-supabase-item-delete
AUTHZ: can_write_site (unchanged)
MUTEX: unchanged (6 arms · no new env)
CONTENTS_PATH: untouched
EDGE_DEPLOY: required before live delete
RLS_APPLY: required before live delete (additive SQL · not applied)
PACKAGE_REBUILD_FOR_UI: true
FILEZILLA_FOR_UI: true
FIRST_LIVE_TARGET: yt-ce00cf60
```

`SAFE_TO_TEST_DELETE: true` = local UI/handler/SQL templates are ready for a **later** explicit live test of `yt-ce00cf60`. This phase is **not** that approval.

Live delete still needs, in order:

1. Apply additive RLS (`cms-core-v2-site-embeds-youtube-delete-rls.template.sql`) — kmjq only
2. Deploy Edge `gosaki-youtube-supabase-save-dry-run` from repo-root
3. Production package rebuild (YouTube Save UI arm as already used) + FileZilla
4. Dual-gate `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true` (same Secret as Save · **unset after**)
5. Explicit: `承認します。この操作を1回だけ実行してください。`

---

## 1. What changed

Empty URL Save still does **not** delete (Save path unchanged). Each existing item now has **削除** → inline confirm → Edge `operation=delete`.

| Layer | Behavior |
| --- | --- |
| UI | Per-item 削除 · confirm 「削除する」 / キャンセル |
| Persisted row | POST same Supabase function · then drop from list using `currentItems` |
| Local-only add | Confirm then splice locally (no Edge) |
| Contents path | Persisted delete refused (`この経路では削除できません`) |
| published | true/false both allowed (no published filter) |
| Scope | exact `legacy_item_id` + `site_slug=gosaki-piano` + `provider=youtube` + `site_id` |
| Arm | Reuses `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` + `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` |

---

## 2. Endpoint / operation

| Item | Value |
| --- | --- |
| Function | `gosaki-youtube-supabase-save-dry-run` (same as Save) |
| `operation` | `delete` |
| `approvalId` | `G-cms-v2-youtube-supabase-item-delete` |
| Body | `{ siteSlug, provider, id, expectedBeforeUpdatedAt? }` — **no `items[]`** |
| Authz | JWT → `sites` → `rpc("can_write_site")` |
| Server arm | same `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true` |
| 403 unarmed | `save_not_armed` |

---

## 3. Confirmation

1. 削除
2. Panel: 「この動画を削除しますか？ 公開・非公開どちらでもデータベースから消えます。この操作は取り消せません。」
3. キャンセル restores the button · 削除する POSTs once (`deleteInFlight` blocks retry)

No `window.confirm`. No auto-retry on timeout.

---

## 4. RLS (not applied)

Additive only — **do not** re-apply the original RLS template (`REVOKE ALL`).

- Apply: `scripts/supabase/cms-core-v2-site-embeds-youtube-delete-rls.template.sql`
- Rollback: `scripts/supabase/cms-core-v2-site-embeds-youtube-delete-rls-rollback.template.sql`

Policy `site_embeds_admin_delete_youtube`: `can_write_site` + `provider=youtube` + `site_slug=gosaki-piano`.

---

## 5. Verifier

```txt
node scripts/verify-gosaki-youtube-delete-ui.mjs
→ 53 passed, 0 failed · YOUTUBE_DELETE_UI_ASSERTS_PASS

node scripts/verify-gosaki-youtube-multi-dirty-state.mjs
→ YOUTUBE_MULTI_DIRTY_STATE_ASSERTS_PASS

node scripts/verify-cms-core-v2-global-save-arm-mutex-inventory.mjs
→ exactly 6 operational client arms

node scripts/verify-cms-core-v2-youtube-supabase-vertical-slice.mjs
→ 256 passed, 0 failed
```

---

## 6. Mutex / other modules

No new `PUBLIC_*SAVE_ARMED`. Inventory still 6. Schedule / Discography / About edit files have no `data-yt-delete-confirm`. Contents `gosaki-youtube-url-save` untouched.

---

## 7. Explicit non-actions (this phase)

SQL apply · Edge deploy · Secret set · live DELETE of `yt-ce00cf60` · package generate · FileZilla · commit · push.
