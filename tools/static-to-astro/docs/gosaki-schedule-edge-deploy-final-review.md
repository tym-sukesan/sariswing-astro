# Gosaki Schedule Edge deploy final review

- **Phase:** `gosaki-schedule-edge-deploy-final-review`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `b3ad1ebd97ebc85b5893a46ad301372021415788`
- **Status:** **READ-ONLY REVIEW COMPLETE**
- **Target:** `kmjqppxjdnwwrtaeqjta` only
- **STOP:** production `vsbvndwuajjhnzpohghh` (`supabase/.temp/linked-project.json` currently points here)

**This phase did not:** deploy · Secrets mutate · DB write · FTP · commit · push · owner dry-run POST.

**Operator premise (this review does not re-run SQL):** `schedules_site_writer_update` applied on kmjq · POSTCHECK PASS.

---

## 0. Gates

```txt
EDGE_DEPLOY_FINAL_REVIEW_RESULT: PASS
SAFE_TO_DEPLOY: true
DEPLOY_EXECUTED: false
FUNCTION: gosaki-schedule-save-dry-run
DEPLOY_FROM: supabase/functions/gosaki-schedule-save-dry-run/ (repo root)
ROOT_TOOLS_MIRROR_BYTE_EQ: true
AUTHZ: can_write_site (source) · live still is_admin until deploy
SITE_SLUG: gosaki-piano
SAVE_ARM: false (do not set GOSAKI_SCHEDULE_SAVE_ARMED)
LINKED_CLI: vsbvndwuajjhnzpohghh
REQUIRED_FLAG: --project-ref kmjqppxjdnwwrtaeqjta
```

`SAFE_TO_DEPLOY: true` means the **one** command below is safe **after** a separate explicit deploy approval. This review is **not** that approval.

---

## 1. Function / path

| Item | Value |
| --- | --- |
| Function name | **`gosaki-schedule-save-dry-run`** |
| Deploy source (CLI) | `/Users/toyamayusuke/sariswing-astro-gosaki-prestage/supabase/functions/gosaki-schedule-save-dry-run/` |
| Files | `index.ts` (HTTP) · `handler.ts` (authz + dry-run/Save) |
| `config.toml` | `[functions.gosaki-schedule-save-dry-run]` · `verify_jwt = true` |
| Tools mirror (not CLI cwd) | `tools/static-to-astro/scripts/edge-functions/gosaki-schedule-save-dry-run/` |
| Byte-eq | **handler.ts and index.ts identical** root ↔ tools (`cmp` PASS) |

Do **not** `cd tools/static-to-astro`. Supabase CLI reads `supabase/` from **repo root**.

---

## 2. Live old vs HEAD (source)

Live kmjq was last deployed from the **`is_admin` lineage** (G-20u45 / commit `350feeab` handler). This phase did **not** download live source.

HEAD `b3ad1ebd` vs that lineage (`handler.ts` +52/−10):

| | Live (old) | HEAD (to deploy) |
| --- | --- | --- |
| Authz helper | `assertOperatorIsAdmin` | `assertCanWriteSiteForSiteSlug` |
| RPC | `rpc("is_admin")` | `sites` resolve `site_slug=gosaki-piano` then `rpc("can_write_site", { p_site_id })` |
| Owner JWT | 403 `is_admin() must be true` | 200 dry-run if `can_write_site` |
| Platform `is_admin` | allowed | still allowed via `can_write_site` (`is_platform_admin` **or** owner/editor) |
| `SITE_SLUG` | `gosaki-piano` | **unchanged** |
| UPDATE/SELECT `.eq("site_slug")` | yes | **unchanged** |
| Save arm env | `GOSAKI_SCHEDULE_SAVE_ARMED` exact `"true"` | **unchanged** |
| Production URL guard | `vsbvnd` blocked in `assertStagingSupabaseUrl` | **unchanged** |
| `service_role` | not used | **unchanged** |

No `rpc("is_admin")` / `assertOperatorIsAdmin` remain in HEAD handler.

---

## 3. Save arm false (expected live after deploy)

| Request | Expected |
| --- | --- |
| `operation=dryRun` + owner JWT + `siteSlug=gosaki-piano` | **200** · `dryRun: true` · `didWrite: false` · `dbWrite: false` · `saveEnabled: false` |
| `operation=save` (arm unset/≠`true`) | **403** · `saveReadiness: save_not_armed` · **no DB write** |
| Non-member / other site | **403** `can_write_site…` |
| `siteSlug` ≠ `gosaki-piano` | **400/422** |
| No Bearer | **401** (`verify_jwt` + handler) |
| Accidental deploy to vsbvnd | runtime throws `production Supabase ref is blocked` — **still do not deploy there** |

Do **not** `secrets set GOSAKI_SCHEDULE_SAVE_ARMED` in the deploy phase.

---

## 4. Required secrets

| Secret | This deploy |
| --- | --- |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Platform-injected on the function. **Do not set.** |
| `GOSAKI_SCHEDULE_SAVE_ARMED` | Must stay **unset or not** `true`. **Do not set.** |
| `service_role` | **not used / not required** |
| Other module arms | **do not touch** |

No new secret is required for this deploy.

---

## 5. Exact deploy command (kmjq only)

**CWD:** `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
**Never omit `--project-ref`.** Linked CLI is `vsbvndwuajjhnzpohghh`.

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage

# read-only preflight (linked must be vsbvnd; command must still target kmjq)
python3 - <<'PY'
import json
from pathlib import Path
linked = json.loads(Path("supabase/.temp/linked-project.json").read_text())
assert linked.get("ref") == "vsbvndwuajjhnzpohghh", linked
cmd = "npx supabase@2.114.0 functions deploy gosaki-schedule-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta"
assert "kmjqppxjdnwwrtaeqjta" in cmd
assert "vsbvndwuajjhnzpohghh" not in cmd
assert "--project-ref" in cmd
print("linked=", linked["ref"], "(NOT the deploy target)")
print("cmd_ok")
PY

npx supabase@2.114.0 functions deploy gosaki-schedule-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

**Do not:**

- run without `--project-ref`
- pass `--project-ref vsbvndwuajjhnzpohghh`
- `supabase link` to change default
- deploy from `tools/static-to-astro`
- combine with `secrets set` / `secrets unset`

If the command hangs, returns non-JSON, or target project is unclear: **stop · do not retry · ask human**.

---

## 6. Post-deploy read-only checks (after a later approved deploy · not now)

1. kmjq Dashboard → Edge Functions → `gosaki-schedule-save-dry-run` **VERSION increased**.
2. vsbvnd Dashboard: that function VERSION **unchanged** (do not deploy/list-write).
3. Optional: `npx supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta` (read-only).
4. `OPTIONS` to `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-schedule-save-dry-run` → 200.
5. POST without JWT → 401.
6. Confirm **no** `GOSAKI_SCHEDULE_SAVE_ARMED=true` was set (Save still 403). Do not print secret values.

---

## 7. Owner JWT dry-run (document only · **do not run this phase**)

`POST https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-schedule-save-dry-run`  
Headers: `Authorization: Bearer <owner JWT>` · `apikey: <anon>` · `Content-Type: application/json`

```json
{
  "operation": "dryRun",
  "mode": "edit",
  "siteSlug": "gosaki-piano",
  "payload": {
    "id": "<existing gosaki-piano schedule uuid>",
    "expectedBeforeUpdatedAt": "<row updated_at>",
    "published": true
  }
}
```

Expect **200** · `operation: "dryRun"` · `didWrite: false` · `dbWrite: false`.  
Then one `operation: "save"` with same payload → **403** `save_not_armed`.  
Wrong slug / non-owner → 4xx as §3. **No retry loop. No Save arm.**

---

## 8. Risk

| Risk | Mitigation |
| --- | --- |
| Omit `--project-ref` → deploy to **vsbvnd** | Command above is invalid without kmjq flag · linked is production |
| Deploy from tools cwd | Use repo root only |
| Set Save arm with deploy | Forbidden · 403 save remains the success signal |
| Owner dry-run becomes 200 (was 403 is_admin) | Intended |
| Live download not done this phase | Diff is vs last known `is_admin` source `350feeab` |

---

## 9. SAFE_TO_DEPLOY

**true** for the exact kmjq command, after explicit `承認します。この操作を1回だけ実行してください。`

**false** for execution in this review. Deploy was **not** run.
