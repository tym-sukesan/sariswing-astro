# Gosaki YouTube delete rollout final review

- **Phase:** `gosaki-youtube-delete-rollout-final-review`
- **Date:** 2026-09-23
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `1f701ed9`
- **Status:** **READ-ONLY REVIEW COMPLETE**
- **Target:** `kmjqppxjdnwwrtaeqjta` only
- **STOP:** production `vsbvndwuajjhnzpohghh`

**This phase did not:** SQL execute · Edge deploy · Secret mutate · build · FTP · DB write · commit · push.

**Operator premises (not re-verified live):** YouTube Supabase Save PASS · leftover `yt-ce00cf60` `published=false` · `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` **unset**.

---

## 0. Gates

```txt
YOUTUBE_DELETE_ROLLOUT_FINAL_REVIEW_RESULT: PASS
SAFE_TO_APPLY_RLS: true
SAFE_TO_DEPLOY_EDGE: true
APPLY_EXECUTED: false
DEPLOY_EXECUTED: false
BUILD_EXECUTED: false
LIVE_DELETE_EXECUTED: false
TARGET: kmjqppxjdnwwrtaeqjta
STOP_PRODUCTION: vsbvndwuajjhnzpohghh
LINKED_CLI: vsbvndwuajjhnzpohghh
REQUIRED_FLAG: --project-ref kmjqppxjdnwwrtaeqjta
POLICY: site_embeds_admin_delete_youtube
FUNCTION: gosaki-youtube-supabase-save-dry-run
CLIENT_ARM: PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED
SECRET: GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED (must stay unset until live delete)
MUTEX: youtube-supabase only (armedCount=1)
FIRST_LIVE_TARGET: yt-ce00cf60
```

`SAFE_TO_APPLY_RLS` / `SAFE_TO_DEPLOY_EDGE` = later **separate** explicit approvals. This review is **not** those approvals. Do **not** combine RLS + deploy + Secret + build in one click.

Order after later approvals:

1. RLS apply (this SQL only)
2. Edge deploy (Secret **unset**)
3. Confirm Save/delete still `403 save_not_armed`
4. Production package (YouTube UI arm only) + FileZilla
5. Secret set → UI delete `yt-ce00cf60` **once** → Secret unset

---

## 1. Exact PRECHECK (SELECT-only · kmjq SQL Editor)

Dashboard project **must** be `kmjqppxjdnwwrtaeqjta`. If vsbvnd → **STOP**.

Expect: `delete_policy_exists = 0` · `authenticated_delete_grant = 0` · four existing `site_embeds` policies present · SELECT/INSERT/UPDATE grants present · `can_write_site` exists · `yt-ce00cf60` one youtube row `published=false`.

```sql
-- A. new DELETE policy must not exist yet
select count(*) as delete_policy_exists
from pg_policies
where schemaname = 'public'
  and tablename = 'site_embeds'
  and policyname = 'site_embeds_admin_delete_youtube';

-- B. current site_embeds policies (fingerprint)
select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'site_embeds'
order by policyname;

-- C. required existing names (must remain after apply)
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'site_embeds'
  and policyname in (
    'site_embeds_public_select_published',
    'site_embeds_admin_select_site',
    'site_embeds_admin_insert',
    'site_embeds_admin_update'
  )
order by policyname;

-- D. table grants (DELETE must be 0 for authenticated before apply)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'site_embeds'
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
order by grantee, privilege_type;

-- E. helpers
select p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('can_write_site', 'is_site_member', 'is_platform_admin')
order by p.proname;

-- F. leftover test row (no UUID dump required)
select legacy_item_id, provider, site_slug, published, sort_order
from public.site_embeds
where site_slug = 'gosaki-piano'
  and provider = 'youtube'
  and legacy_item_id = 'yt-ce00cf60';

-- G. youtube row counts (baseline for after-delete)
select published, count(*) as n
from public.site_embeds
where site_slug = 'gosaki-piano'
  and provider = 'youtube'
group by published
order by published;
```

**STOP PRECHECK if:**

- SQL Editor is not kmjq
- `delete_policy_exists <> 0`
- any of the four required policies missing
- `can_write_site` missing
- `yt-ce00cf60` missing or `published=true` (do not use a published row for first delete)
- authenticated already has table `DELETE` (unexpected — ask human)

Do **not** run `cms-core-v2-site-embeds-rls.template.sql` (it `REVOKE ALL`).

---

## 2. Exact APPLY (later approval only)

**First apply:** CREATE + GRANT only. No `DROP POLICY` in the forward path (template file has `DROP POLICY IF EXISTS` for later idempotency — **do not use DROP on first apply**).

```sql
begin;

create policy site_embeds_admin_delete_youtube
  on public.site_embeds
  for delete
  to authenticated
  using (
    public.can_write_site(site_id)
    and provider = 'youtube'
    and site_slug = 'gosaki-piano'
  );

grant delete on table public.site_embeds to authenticated;

commit;
```

If `CREATE POLICY` fails because the name exists → **STOP**. Do not DROP. Ask human.

This SQL does **not**: DROP TABLE · TRUNCATE · DELETE rows · ALTER TABLE · REVOKE SELECT/INSERT/UPDATE · touch `schedules` / `discography` / `site_page_fields`.

---

## 3. Exact POSTCHECK (SELECT-only)

Expect: `delete_policy_exists = 1` · `cmd = DELETE` · `qual` contains `can_write_site` and `provider = 'youtube'` and `site_slug = 'gosaki-piano'` · four original policies still present · authenticated has SELECT+INSERT+UPDATE **and** DELETE · anon still SELECT only (no DELETE).

```sql
select count(*) as delete_policy_exists
from pg_policies
where schemaname = 'public'
  and tablename = 'site_embeds'
  and policyname = 'site_embeds_admin_delete_youtube';

select policyname, cmd, roles, permissive, qual
from pg_policies
where schemaname = 'public'
  and tablename = 'site_embeds'
order by policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'site_embeds'
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
order by grantee, privilege_type;
```

Do **not** DELETE/UPDATE/INSERT rows in POSTCHECK.

---

## 4. Exact rollback

Only if apply must be undone. Separate approval. Does **not** restore a deleted row.

```sql
begin;

drop policy if exists site_embeds_admin_delete_youtube on public.site_embeds;
revoke delete on table public.site_embeds from authenticated;

commit;
```

Then re-run POSTCHECK: `delete_policy_exists = 0` · authenticated `DELETE` grant gone · SELECT/INSERT/UPDATE grants still present.

---

## 5. kmjq only · existing SELECT/INSERT/UPDATE preserved

| Check | Result |
| --- | --- |
| Target | kmjq `kmjqppxjdnwwrtaeqjta` only |
| vsbvnd | **STOP** · linked CLI is this ref · never omit `--project-ref` |
| SELECT policies | untouched |
| INSERT / UPDATE policies | untouched |
| Column INSERT/UPDATE GRANTs | untouched |
| New privilege | table `DELETE` to `authenticated` **only** |
| Anon DELETE | **no** |
| Other tables | **no** |

RLS `USING` requires **all** of: `can_write_site(site_id)` · `provider = 'youtube'` · `site_slug = 'gosaki-piano'`. Non-member / other site / non-youtube embed cannot DELETE.

Residual: after GRANT, an owner JWT **could** PostgREST-DELETE a gosaki-piano youtube row without Edge arm. Product UI/Edge stay dual-gated (`save_not_armed`). Do not give anyone a SQL DELETE of `yt-ce00cf60` in this rollout.

---

## 6. Exact Edge deploy

| Item | Value |
| --- | --- |
| Function | `gosaki-youtube-supabase-save-dry-run` |
| CWD | `/Users/toyamayusuke/sariswing-astro-gosaki-prestage` (repo root) |
| Source | `supabase/functions/gosaki-youtube-supabase-save-dry-run/` |
| root↔tools | handler.ts / index.ts **byte-eq** |
| `config.toml` | **no** stanza for this function (Contents YouTube / Schedule have entries). Handler still `requireUser` → 401 without Bearer. Do not add a stanza in this review. |
| Secret this deploy | **do not set** `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` |

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage

python3 - <<'PY'
import json
from pathlib import Path
linked = json.loads(Path("supabase/.temp/linked-project.json").read_text())
assert linked.get("ref") == "vsbvndwuajjhnzpohghh", linked
cmd = "npx supabase@2.114.0 functions deploy gosaki-youtube-supabase-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta"
assert "kmjqppxjdnwwrtaeqjta" in cmd
assert "vsbvndwuajjhnzpohghh" not in cmd
assert "--project-ref" in cmd
print("linked=", linked["ref"], "(NOT the deploy target)")
print("cmd_ok")
PY

npx supabase@2.114.0 functions deploy gosaki-youtube-supabase-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

**Do not:** omit `--project-ref` · deploy vsbvnd · `cd tools/static-to-astro` · `secrets set` with deploy · deploy Contents `gosaki-youtube-url-save`.

Hang / non-JSON / unclear target → **stop · do not retry · ask human**.

After deploy (Secret still unset):

| Request | Expected |
| --- | --- |
| owner `operation=dryRun` | **200** · `didWrite=false` |
| owner `operation=save` | **403** `save_not_armed` |
| owner `operation=delete` `id=yt-ce00cf60` | **403** `save_not_armed` · **no row delete** |
| no JWT | **401** |

`isYoutubeSupabaseSaveArmed` gates **both** Save and delete (`=== "true"` only). Unset / `false` / `TRUE` → 403.

---

## 7. Exact production build (YouTube UI only)

Official generate requires **git-clean**. If this review is uncommitted, **commit docs first**. Mutex: exactly one operational client arm.

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro

while IFS= read -r line; do
  case "$line" in
    PUBLIC_SUPABASE_URL=*|PUBLIC_SUPABASE_ANON_KEY=*) export "$line" ;;
  esac
done < .env.local

PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true npm run build:gosaki:production
```

Do **not** `source .env.local` (would inject `SUPABASE_SERVICE_ROLE_KEY`). Do **not** set:

- `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED`
- `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED`
- `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` (GitHub `main`)
- About Contents / About Supabase arms

Authoritative log:

```txt
[save-arm-mutex] PASS · armedCount=1 · armedFeatureIds=gosaki-youtube-supabase
```

Ignore production log `Save arms: not set (must remain false)` (hardcoded).

After bake, HTML must show:

- `data-gosaki-youtube-save-armed="true"`
- `data-gosaki-youtube-write-backend="supabase"`
- Schedule / Discography / About save-armed **`false`**

FileZilla: `output/manual-upload/gosaki-piano-production/public-dist/` **contents** → production `/`. No FTP `--apply`.

---

## 8. Final test procedure (`yt-ce00cf60`)

Each numbered step needs its own `承認します。この操作を1回だけ実行してください。` when it is destructive (SQL / deploy / Secret / live delete). Build+FileZilla is high-risk overwrite — same approval bar.

1. PRECHECK PASS on kmjq.
2. APPLY SQL once · POSTCHECK PASS.
3. Edge deploy once · Secret **unset**.
4. Owner dryRun 200 · Save 403 · delete 403 · SELECT `yt-ce00cf60` still present.
5. Git-clean production generate with YouTube client arm only · mutex `gosaki-youtube-supabase` · FileZilla.
6. Owner login `/admin/youtube/` · confirm id `yt-ce00cf60` · **削除** → 確認文 → **削除する once**.
7. List: that card gone immediately. SELECT: 0 rows for `legacy_item_id='yt-ce00cf60'`. Other youtube rows unchanged.
8. Immediately:

```bash
npx supabase secrets unset GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

9. Retry delete/save → 403. Do not republish leftover test videos. Public HTML does not auto-reflect.

If timeout / non-JSON / 2 rows / wrong id → **stop · do not retry · do not SQL DELETE · ask human**.

---

## 9. Schedule / Discography / About

| Module | This rollout |
| --- | --- |
| Schedule | no RLS · no Edge deploy · client arm **false** in new package |
| Discography | same |
| About | same · production PATH_ENABLED stays supabase read path, Save UI false |
| Contents YouTube | not deployed · client arm **false** |

Delete UI exists only in YouTube multi-edit (`data-yt-delete`). Other editors have no `data-yt-delete-confirm`.

---

## Risk

| Risk | Mitigation |
| --- | --- |
| Omit `--project-ref` → vsbvnd | command invalid without kmjq flag |
| Re-apply original site_embeds RLS | **forbidden** (`REVOKE ALL`) |
| Contents YouTube arm | GitHub `main` · never set |
| Delete a published/real video | first test **only** `yt-ce00cf60` unpublished |
| GRANT DELETE + owner PostgREST | keep Secret unset until the one UI click; unset after |
| Dirty git vs official generate | commit docs first |
| Discography Secret leftover | confirm **unset** before YouTube Secret set |

---

## Explicit non-actions (this phase)

SQL · deploy · secrets · build · FTP · live delete · commit · push.
