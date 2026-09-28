# Gosaki Schedule Storage upload policy review

- **Phase:** `gosaki-schedule-storage-upload-policy-review`
- **Date:** 2026-09-28
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **Status:** **READ-ONLY REVIEW COMPLETE · SQL NOT APPLIED**
- **Target project (apply later):** `kmjqppxjdnwwrtaeqjta` only
- **STOP:** production `vsbvndwuajjhnzpohghh` · Sariswing `images` bucket · `service_role`

**This phase did not:** SQL execute · Storage write · DB write · Edge deploy · Secrets · FTP · production build · commit · push.

---

## 0. Gates

```txt
STORAGE_UPLOAD_POLICY_REVIEW_RESULT: PASS
SAFE_TO_APPLY: true
APPLY_EXECUTED: false
LIVE_POLICY_DUMP: not executed (operator PRECHECK required before apply)
TARGET: kmjqppxjdnwwrtaeqjta
STOP_PRODUCTION: vsbvndwuajjhnzpohghh
POLICY: site_assets_gosaki_piano_schedule_insert
CMD: INSERT
ROLES: authenticated
BUCKET: site-assets
PATH_SCOPE: gosaki-piano/schedule/
AUTHZ: sites.site_slug = 'gosaki-piano' → can_write_site(sites.id)
INSERT: required
UPDATE: not required (upsert=false + unique object names)
DELETE: not required
GRANT_REVOKE_IN_APPLY: none
DROP_IN_FORWARD: none
```

`SAFE_TO_APPLY: true` means the **template** is the minimum additive INSERT policy **if** operator PRECHECK on kmjq matches §4. This review is **not** apply approval. Vague “OK” is not sufficient; later apply needs:

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 1. Current policies (known vs live)

### 1.1 Documented kit SQL (`docs/sql/staging-site-assets-bucket.sql`)

| Policy | Table | Cmd | Roles | Check |
| --- | --- | --- | --- | --- |
| `"site-assets public read"` | `storage.objects` | SELECT | `public` | `bucket_id = 'site-assets'` |

Documented writes: **none** for authenticated/anon. Comment: service_role bypasses RLS (CLI G-4 uploads). This review does **not** add service_role usage.

Bucket (documented): `public=true`, `file_size_limit=5242880`, MIME jpeg/png/webp/**gif/avif**.

Existing public objects (G-4, not this policy): `gosaki/discography/...` and schedule **home** under `gosaki/…` — **outside** `gosaki-piano/schedule/`.

### 1.2 Live kmjq dump

**Not executed** (no Dashboard query, no `service_role`, linked CLI is vsbvnd). Operator must run §4 PRECHECK on **kmjq** SQL Editor before any apply.

**STOP PRECHECK if** any of:

- project is not `kmjqppxjdnwwrtaeqjta`
- INSERT/UPDATE/DELETE policy already exists on `storage.objects` for `site-assets` (except we expect **zero** INSERT today)
- proposed name already exists
- `can_write_site(uuid)` missing
- `gosaki-piano` sites row count ≠ 1
- `authenticated` lacks `INSERT` on `storage.objects` (do **not** GRANT in this template — ask human)
- `storage.foldername` missing
- anon already has an INSERT policy on this bucket

### 1.3 GRANT / policy on `storage.objects`

Kit SQL does **not** GRANT/REVOKE `storage.objects`. Default Supabase usually grants table privileges to `authenticated` / `anon`; **RLS** is the real gate.

PRECHECK lists `information_schema.role_table_grants` for `storage.objects`. APPLY does **not** GRANT. If INSERT grant is missing → `SAFE_TO_APPLY` for this template becomes **false** until a separate GRANT review.

Sariswing `scripts/supabase/storage-images-bucket.sql` (`images` + **anon INSERT**) is **out of scope** and must **not** be copied to kmjq.

---

## 2. `can_write_site` — exact signature and Storage use

From `cms-core-v2-tenancy-and-site-embeds-migration.template.sql` (live on kmjq as Core v2; this SQL does **not** redefine it):

```sql
public.can_write_site(p_site_id uuid) returns boolean
-- language sql stable SECURITY DEFINER set search_path = public
-- = is_platform_admin() OR is_site_member(p_site_id)
-- is_site_member = site_members.role IN ('owner','editor') AND user_id = auth.uid()
```

| Item | Value |
| --- | --- |
| Signature | `can_write_site(uuid)` only (2-arg overload dropped in that migration) |
| `auth.uid()` | inside DEFINER helpers — Storage policy does not pass uid |
| EXECUTE | `authenticated` yes · `anon` / `public` revoked |
| Usable in `storage.objects` WITH CHECK | **yes** — RLS of the inserting role can call it |
| `sites.status=suspended` | **not** checked (Phase 2 Core) |

`storage.objects` has no `site_id`. Resolve tenant the same way Schedule writer policies do, but **hardcode path + slug** for this slice:

```txt
public.sites.site_slug = 'gosaki-piano'  -- unique via sites_id_site_slug_key
→ site_row.id
→ public.can_write_site(site_row.id)
```

`sites` SELECT for `authenticated` exists (`sites_select_member_or_platform` + `GRANT SELECT`). Nested EXISTS is visible to gosaki-piano owner/editor/platform_admin and **not** to unrelated members (they cannot see the gosaki-piano row **and** `can_write_site` is false for that id).

---

## 3. Proposed contract

| Field | Value |
| --- | --- |
| Proposed policy name | `site_assets_gosaki_piano_schedule_insert` |
| Exact path scope | `name like 'gosaki-piano/schedule/%'` **and** `foldername[1]=gosaki-piano` **and** `foldername[2]=schedule` |
| Allowed example | `gosaki-piano/schedule/schedule-2026-07-010/flyer.webp` |
| Collision-avoidance example | `gosaki-piano/schedule/schedule-2026-07-010/{random}.webp` |
| Denied examples | `gosaki/discography/...`, `gosaki-piano/discography/...`, `gosaki-piano/about/...`, `other-site/schedule/...`, `gosaki-piano/schedule-evil/...`, paths with `../` or `//` |
| Authz | `TO authenticated` + `can_write_site` on gosaki-piano **only** |
| Anon INSERT | **no policy** → deny |
| Whole-bucket authenticated write | **no** |
| INSERT | **yes** (this policy) |
| UPDATE | **no** — `upsert=false`; second upload to the **same** name fails; uploader must use unique names |
| DELETE | **no** — orphans OK (Sariswing same) |

MIME/size: client (JPEG/PNG/WebP, ~2MB, long edge 1600). Bucket still allows gif/avif and 5MB; **do not ALTER bucket** here (would affect existing G-4 objects). Policy does **not** inspect `metadata` (unreliable on INSERT).

Public URL after upload (for `schedules.image_url`):

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/storage/v1/object/public/site-assets/gosaki-piano/schedule/{legacyId}/{file}
```

Existing public SELECT policy already allows GET.

---

## 4. Exact PRECHECK SQL (SELECT-only · kmjq SQL Editor · before apply)

Expect: insert policy count **0** · public read policy present · `can_write_site(uuid)` present · gosaki-piano **1** row · `foldername` works · authenticated **INSERT** grant present · **no** anon INSERT policy on this bucket.

```sql
-- 0. confirm dashboard project is kmjqppxjdnwwrtaeqjta (human)

-- A. proposed policy must not exist
select count(*) as insert_policy_exists
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'site_assets_gosaki_piano_schedule_insert';

-- B. all storage.objects policies (fingerprint)
select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- C. site-assets policies only (qual/with_check mention site-assets)
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    coalesce(qual, '') like '%site-assets%'
    or coalesce(with_check, '') like '%site-assets%'
    or policyname like '%site-assets%'
    or policyname like '%site_assets%'
  )
order by policyname;

-- D. bucket
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'site-assets';

-- E. GRANT on storage.objects
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'storage'
  and table_name = 'objects'
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
order by grantee, privilege_type;

-- F. helpers
select p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('can_write_site', 'is_site_member', 'is_platform_admin')
order by p.proname, 2;

-- G. gosaki-piano singleton
select id, site_slug, status
from public.sites
where site_slug = 'gosaki-piano';

select count(*) as gosaki_piano_site_count
from public.sites
where site_slug = 'gosaki-piano';

-- H. foldername helper
select storage.foldername('gosaki-piano/schedule/schedule-2026-07-010/flyer.webp') as folder_parts;

-- I. existing objects under proposed prefix (read-only inventory)
select count(*) as existing_gosaki_piano_schedule_objects
from storage.objects
where bucket_id = 'site-assets'
  and name like 'gosaki-piano/schedule/%';
```

**STOP if:**

- A ≠ 0
- D missing / `public` is not true
- F missing `can_write_site` with argument `uuid` / `p_site_id uuid`
- G count ≠ 1
- H errors (no `storage.foldername`)
- E: `authenticated` has no `INSERT`
- B/C: any `cmd = INSERT` for `anon`, or any authenticated INSERT that is **whole-bucket** `site-assets` without a path prefix
- SQL Editor is vsbvnd / production

Do **not** INSERT/UPDATE/DELETE objects in PRECHECK.

---

## 5. Exact APPLY SQL (later only · one CREATE POLICY)

Dashboard: **kmjqppxjdnwwrtaeqjta**. File: `scripts/supabase/cms-core-v2-site-assets-gosaki-piano-schedule-insert.template.sql`

```sql
begin;

create policy site_assets_gosaki_piano_schedule_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-assets'
    and name like 'gosaki-piano/schedule/%'
    and (storage.foldername(name))[1] = 'gosaki-piano'
    and (storage.foldername(name))[2] = 'schedule'
    and position('../' in name) = 0
    and name not like '%//%'
    and exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = 'gosaki-piano'
        and public.can_write_site(site_row.id)
    )
  );

commit;
```

If `CREATE POLICY` fails because the name exists → **stop immediately**. Do not retry with DROP. Do not cleanup. Ask human.

---

## 6. Exact POSTCHECK SQL (SELECT-only · after apply)

Expect: A = 1 · `cmd = INSERT` · roles include `authenticated` · `with_check` contains `gosaki-piano/schedule` and `can_write_site` · `"site-assets public read"` still present · no extra unexpected INSERT policies.

```sql
select count(*) as insert_policy_exists
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'site_assets_gosaki_piano_schedule_insert';

select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname = 'site-assets public read'
    or policyname = 'site_assets_gosaki_piano_schedule_insert'
  )
order by policyname;
```

Do **not** upload a test file in POSTCHECK (that is a Storage write). Uploader probe is a later phase.

---

## 7. Exact ROLLBACK SQL

File: `scripts/supabase/cms-core-v2-site-assets-gosaki-piano-schedule-insert-rollback.template.sql`

```sql
begin;

drop policy if exists site_assets_gosaki_piano_schedule_insert on storage.objects;

commit;
```

Rollback does **not** delete objects already uploaded. If an uploader phase wrote files, those objects remain until a **separate** approved cleanup.

---

## 8. Conditions to start uploader implementation

Proceed to Gosaki admin file-select → `storage.upload` → write public URL into `image_url` **only when all** are true:

1. Operator PRECHECK on kmjq **PASS**
2. Separate explicit apply approval + APPLY executed **once**
3. POSTCHECK **PASS**
4. Uploader reuses Sariswing `processImageForUpload` / `upload` (`upsert: false`), bucket `site-assets`, path under `gosaki-piano/schedule/{legacyId}/` with a **unique** filename (fixed `flyer.ext` cannot be replaced without UPDATE)
5. No `service_role`, no production `images` bucket, no Edge for bytes
6. `schedules.image_url` Save remains the existing Edge allowlist (URL string only)
7. `home_image_url` still out of scope

Until apply: admin stays **画像URL hand-entry** only.

---

## 9. Safety recap

| Gate | This phase |
| --- | --- |
| SQL applied | **false** |
| Storage / DB write | **false** |
| Edge / Secret / FTP / production build / commit | **false** |
| `public.schedules` RLS | unchanged |
| Table GRANT/REVOKE | none |
| Anon write | not added |
| Whole-bucket authenticated write | not added |
