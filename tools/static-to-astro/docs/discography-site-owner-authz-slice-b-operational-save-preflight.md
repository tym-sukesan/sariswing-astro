# Discography site-owner authz Slice B — operational Save preflight

- **Phase:** `discography-site-owner-authz-slice-b-operational-save-preflight`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (packet locked · read-only · Save not executed)**
- **HEAD:** `b025eac964a34b660d7894dbfff32f7990c53d6e`
- **Prior:** `discography-site-owner-authz-slice-b-planning` (COMPLETE)
- **This phase:** lock one existing-release owner operational Save packet · **no** Save · **no** Secret mutate · **no** DB write · **no** RLS/GRANT/RPC change · **no** Edge deploy · **no** production · **no** commit/push by Cursor

Cursor must **not** run Secret ON/OFF, owner POST, UI Save, or restoration. Operator execution is a **later** phase with a separate explicit approval.

**Operator execution SoT (2026-08-16):** `discography-site-owner-authz-slice-b-operational-save-execution-final-hardening.md` after `discography-site-owner-authz-slice-b-operational-save-version-guard-update`. This preflight’s `VERSION_47_REQUIRED: true` is a **historical** lock (Slice A deploy VERSION 47). Do **not** execute this preflight packet as-is against live VERSION 50.

**Forbidden:** production `vsbvndwuajjhnzpohghh` · `service_role` · owner → `admin_users` · direct PostgREST UPDATE · table GRANT · UPDATE RLS · RPC rewrite · Edge deploy · automatic retry · UI Save · mix in `discography-musician-basic-live-read-wiring-fix`.

Staging only: `kmjqppxjdnwwrtaeqjta`.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-b-operational-save-preflight
TARGET_RELEASE: discography-003
TARGET_SELECTION_REASON: unused-by-prior-pocs; description-only; tracks-untouched
BEFORE_SNAPSHOT_READY: true
MINIMAL_MUTATION: description_append_only
REAL_DATA_WRITE_REQUIRED: true
OPTIMISTIC_LOCK_READY: true
OWNER_FIXTURE_RECHECK_READY: true
SECRET_ON_OFF_PACKET_READY: true
ONE_SHOT_SAVE_PACKET_READY: true
EXPECTED_WRITE_RESULT: http_200_ok_description_only
POST_WRITE_VERIFICATION_READY: true
RESTORATION_REQUIRED: true
RESTORATION_PACKET_READY: true
DIRECT_TABLE_WRITE_USED: false
DIRECT_TABLE_WRITE_REQUIRED: false
RLS_CHANGE_REQUIRED: false
GRANT_CHANGE_REQUIRED: false
RPC_CHANGE_REQUIRED: false
PRODUCTION_BLOCKED: true
READY_FOR_OPERATOR_SAVE: true
SAVE_EXECUTED: false
SECRETS_CHANGED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
RPC_REACHED: false
DATA_WRITE: false
UI_READ_WIRING_IN_SCOPE: false
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
OWNER_ADDED_TO_ADMIN_USERS: false
NO_RETRY_RULE_FIXED: true
SECRET_OFF_METHOD: unset
STAGING_REF_HARD_FIXED: true
VERSION_47_REQUIRED: true
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
STOP_REASONS: none
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-operational-save-execution
DEFERRED_FINDING: discography-musician-basic-live-read-wiring-fix
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`READY_FOR_OPERATOR_SAVE: true` means the packet is locked. It does **not** authorize Cursor, an unattended run, or Save in this phase.

Restoration is a **second** explicit operator write after proof Save + Secret unset. It is **not** part of the one-shot proof POST.

---

## 1. TARGET_RELEASE

| Item | Value |
| --- | --- |
| `legacy_id` | `discography-003` |
| album `id` | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| title | `About Us!!` |
| site_slug | `gosaki-piano` |
| published | `true` |
| track count | **9** |
| current `updated_at` | `2026-07-10T05:59:35.138671+00:00` |

`TARGET_SELECTION_REASON:`

1. Real existing `discography-00N` (not `discography-999`).
2. Not used by G-20u36e/f track-title PoC (`discography-002`) or G-20u43 label PoC (`discography-004`).
3. Description is non-critical personnel text (no `<>`, no HTML).
4. `purchase_url` is already `null` (no shop-link risk).
5. Tracks can stay byte-identical → RPC skips DELETE/INSERT → track UUIDs preserved.

Rejected:

| `legacy_id` | Why not |
| --- | --- |
| `discography-999` | absent by design · Slice A probe only |
| `discography-002` | prior track-title PoC row |
| `discography-004` | prior label PoC · newer `updated_at` |
| `discography-001` | shop `purchase_url` live · first-listed album |

---

## 2. BEFORE_SNAPSHOT (SELECT-only · 2026-08-16)

Anon REST · staging host `kmjqppxjdnwwrtaeqjta.supabase.co` · no JWT / anon key logged · `service_role` unused.

Global:

| Check | Value |
| --- | --- |
| albums `site_slug=gosaki-piano` | **4** |
| tracks `site_slug=gosaki-piano` | **34** |
| `discography-999` | **0** |

### 2.1 Target album `discography-003`

| Column | Value |
| --- | --- |
| `id` | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| `legacy_id` | `discography-003` |
| `site_slug` | `gosaki-piano` |
| `title` | `About Us!!` |
| `artist` | `ごさきりかこTrio` |
| `release_date` | `2019-01-11` |
| `year` | `2019` (frozen at DB · **not** in Edge payload) |
| `label` | `null` |
| `catalog_number` | `GSRT-0001` |
| `description` | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass` |
| `cover_image_url` | `https://kmjqppxjdnwwrtaeqjta.supabase.co/storage/v1/object/public/site-assets/gosaki/discography/discography-003/cover.jpg` |
| `purchase_url` | `null` |
| `streaming_url` | `https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja` |
| `sort_order` | `3` |
| `published` | `true` |
| `updated_at` | `2026-07-10T05:59:35.138671+00:00` |

### 2.2 Target tracks (order = `track_number` / `sort_order`)

Do **not** “fix” `白玉Bluse`.

| # | id | title |
| --- | --- | --- |
| 1 | `f19cb2e2-8f73-4441-9a4c-463b0e7688d7` | `白玉Bluse` |
| 2 | `bbb53529-0a23-499d-9254-f67e24b72527` | `The Lady Is A Tramp` |
| 3 | `38c4ff25-894c-47c9-9554-293b1529fbe2` | `Honeysuckle Rose` |
| 4 | `9720944b-b6a3-4a44-9f30-ac978a7bb94f` | `Darn That Dream` |
| 5 | `150ceba3-a81b-4014-b061-22aa79116088` | `The Old Country` |
| 6 | `5ed7178e-b3ed-477e-bff6-80bf01ccfb23` | `The Sweetest Sounds` |
| 7 | `138da109-ae17-4325-be65-8dc037bf310c` | `The Look Of Love` |
| 8 | `911f7e0f-7925-452d-bd32-f4d03847b46b` | `Samba De Cafe Terrasse` |
| 9 | `006443c7-a6eb-4294-abf3-f931ab4c0b20` | `I'd Climb The Highest Mountain` |

Exact `tracksText` (LF, 9 lines):

```txt
白玉Bluse
The Lady Is A Tramp
Honeysuckle Rose
Darn That Dream
The Old Country
The Sweetest Sounds
The Look Of Love
Samba De Cafe Terrasse
I'd Climb The Highest Mountain
```

### 2.3 Unrelated releases (must stay unchanged)

| legacy_id | title | updated_at | tracks |
| --- | --- | --- | --- |
| `discography-001` | Continuous | `2026-07-10T05:59:35.138671+00:00` | 9 |
| `discography-002` | SKYLARK | `2026-07-10T05:59:35.138671+00:00` | 8 |
| `discography-004` | Ja-Jaaaaan! | `2026-07-21T15:33:01.569766+00:00` | 8 |

`BEFORE_SNAPSHOT_READY: true`

Operator must **re-SELECT** `discography-003.updated_at` immediately before Secret ON. If it is not exactly `2026-07-10T05:59:35.138671+00:00` → **STOP** (no Secret ON, no POST).

---

## 3. MINIMAL_MUTATION

`no_change` (Edge 422 **before** RPC, and RPC 422) does **not** prove `DATA_WRITE`. Mutation must reach RPC `UPDATE public.discography`.

| Item | Value |
| --- | --- |
| Field | `description` only |
| Before | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass` |
| After | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass [CMS Kit staging] Slice B owner Save PoC` |
| Tracks | **unchanged** (same 9 titles / order) |
| Other editable scalars | **unchanged** |
| Frozen fields in payload | **must match current** (`catalog_number`, `published`, `cover_image_url`, `streaming_url`) |

Why description:

- Allowlisted operational field
- Non-SEO title / non-shop URL
- No `<>` (RPC/Edge reject HTML)
- RPC `changed_fields` expected `["description"]` only
- Track DELETE/INSERT skipped when titles match → atomicity kept without child rewrite

`MINIMAL_MUTATION: description_append_only`

`REAL_DATA_WRITE_REQUIRED: true`

---

## 4. Optimistic lock

| Item | Value |
| --- | --- |
| Preflight lock | `2026-07-10T05:59:35.138671+00:00` |
| Sentinel / stale lock | **forbidden** |
| Slice A `1970-01-01T00:00:00.000Z` | **forbidden** on this packet |

Re-check points:

1. Before Secret ON (browser SELECT).
2. Inside the one-shot POST IIFE immediately before `fetch`.

Mismatch → abort without POST. If Secret already ON → **unset immediately**. No retry with a new lock in the same session.

`OPTIMISTIC_LOCK_READY: true`

---

## 5. Edge / Secret packet

| Item | Value |
| --- | --- |
| Staging ref | `kmjqppxjdnwwrtaeqjta` **hard-fixed** |
| Production ref | `vsbvndwuajjhnzpohghh` **forbidden** |
| Function | `gosaki-discography-save-dry-run` |
| VERSION | **47** required (else Secret ON forbidden) |
| Linked CLI project | production — omit `--project-ref` **forbidden** |
| CLI | process-scoped `SUPABASE_ACCESS_TOKEN` (LEGACY PAT) + `npx supabase@2.114.0` |
| PAT / secret values | **not recorded** |
| UI arm | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` stays unset/false |

Working directory: `~/sariswing-astro`.

```bash
# VERSION reconfirm (read-only)
npx supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta

# ON — once, staging only, only after fixture + lock recheck PASS
npx supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta

# OFF — immediately after the one POST, PASS or FAIL or timeout
npx supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

`SECRET_OFF_METHOD: unset` (not `=false`). Do not run `secrets list`. No Edge redeploy.

Confirm unset/reset path **before** Secret ON (commands above prepared). After ON: do not open/search/copy the doc; paste the already-prepared POST snippet once.

`SECRET_ON_OFF_PACKET_READY: true`

---

## 6. Owner fixture recheck (Secret OFF)

Same working path as Slice A PASS: Vite `getStagingAuthConfig()` + `getStagingSupabaseClient()`. **Not** DOM dataset. **Not** terminal `PUBLIC_SUPABASE_*`. **Not** UI Save.

Page: `http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

Do **not** click Save or Dry-run (live-read wiring is a **different** slice).

Reuse Slice A owner JWT IIFE (Secret still OFF). PASS requires:

- staging host exact
- session present
- `gosaki-piano` sites singleton
- `can_write_site=true`
- `is_admin=false`

Fail → **Secret ON forbidden · owner POST forbidden · no retry · STOP**.

`OWNER_FIXTURE_RECHECK_READY: true`

---

## 7. Exactly one owner POST (not executed now)

Auth: browser session Bearer (owner JWT) + `apikey` anon. Do **not** copy JWT to terminal. Do **not** use UI Save.

Prepare this snippet **before** Secret ON (clipboard / other window). After ON: paste once.

```javascript
(async () => {
  const FLAG = "__SLICE_B_OWNER_SAVE_FIRED";
  if (window[FLAG]) {
    console.log({ abort: "already_fired_no_retry" });
    return;
  }
  window[FLAG] = true;

  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LEGACY = "discography-003";
  const LOCK = "2026-07-10T05:59:35.138671+00:00";
  const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
  const DESC_AFTER = DESC_BEFORE + " [CMS Kit staging] Slice B owner Save PoC";
  const TRACKS =
    "白玉Bluse\nThe Lady Is A Tramp\nHoneysuckle Rose\nDarn That Dream\nThe Old Country\nThe Sweetest Sounds\nThe Look Of Love\nSamba De Cafe Terrasse\nI'd Climb The Highest Mountain";
  const FN =
    "https://" + STG + ".supabase.co/functions/v1/gosaki-discography-save-dry-run";

  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
  const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
  const config = cfgMod.getStagingAuthConfig();
  const url = String(config.supabaseUrl || "").trim();
  const anonKey = String(config.supabaseAnonKey || "").trim();
  if (!url || !anonKey) {
    console.log({ abort: "getStagingAuthConfig missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY" });
    return;
  }
  if (!url.includes(STG) || url.includes(PROD) || FN.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }

  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const { data: sessData, error: sessErr } = await client.auth.getSession();
  const token = sessData?.session?.access_token;
  if (!token || typeof token !== "string" || sessErr) {
    console.log({ abort: "no_owner_session" });
    return;
  }

  const { data: row, error: rowErr } = await client
    .from("discography")
    .select("legacy_id,updated_at,description")
    .eq("site_slug", "gosaki-piano")
    .eq("legacy_id", LEGACY)
    .maybeSingle();
  if (rowErr || !row) {
    console.log({ abort: "lock_reselect_failed" });
    return;
  }
  if (String(row.updated_at) !== LOCK) {
    console.log({ abort: "optimistic_lock_changed", current: row.updated_at });
    return;
  }
  if (String(row.description ?? "") !== DESC_BEFORE) {
    console.log({ abort: "description_baseline_changed" });
    return;
  }

  const body = {
    operation: "save",
    approvalId: "gosaki-discography-operational-save",
    siteSlug: "gosaki-piano",
    legacyId: LEGACY,
    expectedBeforeUpdatedAt: LOCK,
    release: {
      title: "About Us!!",
      artist: "ごさきりかこTrio",
      release_date: "2019-01-11",
      label: null,
      catalog_number: "GSRT-0001",
      published: true,
      cover_image_url:
        "https://" + STG + ".supabase.co/storage/v1/object/public/site-assets/gosaki/discography/discography-003/cover.jpg",
      purchase_url: null,
      streaming_url: "https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja",
      description: DESC_AFTER,
    },
    tracksText: TRACKS,
  };
  if (body.legacyId !== "discography-003") {
    console.log({ abort: "legacy_id_not_003" });
    return;
  }
  if (String(body.release.description).indexOf("[CMS Kit staging] Slice B owner Save PoC") < 0) {
    console.log({ abort: "mutation_missing" });
    return;
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort("timeout"), 30000);
  let status = 0;
  let json = null;
  let kind = "ok";
  try {
    const res = await fetch(FN, {
      method: "POST",
      signal: ac.signal,
      headers: {
        apikey: anonKey,
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    status = res.status;
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      kind = "non_json";
    }
  } catch (e) {
    kind = e === "timeout" || (e && e.name === "AbortError") ? "timeout" : "fetch_failed";
  } finally {
    clearTimeout(timer);
  }

  const keys = json && typeof json === "object" ? Object.keys(json).sort() : [];
  const changed = json && json.changedFields;
  console.log({
    probe: "slice-b-owner-operational-save",
    kind: kind,
    status: status,
    reasonCode: json && json.reasonCode,
    ok: json && json.ok,
    didWrite: json && json.didWrite,
    dbWrite: json && json.dbWrite,
    rpc: json && json.rpc,
    rpcKeyPresent: keys.indexOf("rpc") !== -1,
    changedFields: changed,
    updatedAt: json && (json.updated_at || json.updatedAt),
    keys: keys,
  });
})();
```

`ONE_SHOT_SAVE_PACKET_READY: true`

No retry:

```txt
exactly one owner POST
timeout / non-JSON / 5xx / unexpected reasonCode / 422 no_change / 409 lock
→ stop immediately
→ do not retry
→ do not re-POST
→ still run SECRET unset
→ SELECT-only verify
→ ask human
```

---

## 8. EXPECTED_WRITE_RESULT

Success (proof Save):

| Field | Value |
| --- | --- |
| HTTP | **200** |
| `ok` | `true` |
| `reasonCode` | `ok` or absent |
| `rpc` | `gosaki_discography_operational_save` |
| `rpcKeyPresent` | **true** |
| `didWrite` / `dbWrite` | **true** |
| `changedFields` | `["description"]` only |
| `updatedRows` | `1` |
| `updated_at` | **≠** `2026-07-10T05:59:35.138671+00:00` |

Judgement:

```txt
RPC_REACHED=true  := HTTP 200 AND rpc === gosaki_discography_operational_save
DATA_WRITE=true   := RPC_REACHED AND didWrite/dbWrite true
                     AND SELECT description === after-marker
                     AND SELECT updated_at advanced
                     AND albums=4 AND tracks=34
```

Not success (STOP, no retry): `save_not_armed` · `no_change` · `optimistic_lock_conflict` · `release_read_failed` · `frozen_field_change_forbidden` · 401/403/5xx · timeout · non-JSON.

`EXPECTED_WRITE_RESULT: http_200_ok_description_only`

---

## 9. Post-write verification (SELECT-only)

After Secret unset:

1. Arm-OFF POST (anon Bearer, `discography-003` body **or** dummy) → HTTP **403** `save_not_armed`.
2. SELECT target + counts:

| Check | Expected after proof Save (before restore) |
| --- | --- |
| albums | **4** |
| tracks | **34** |
| `discography-999` | **0** |
| 003 `description` | after-marker string (exact) |
| 003 track count / titles / ids | **unchanged** (9 rows, same UUIDs) |
| 003 `updated_at` | advanced |
| 001 / 002 / 004 `updated_at` + description | **unchanged** |

`POST_WRITE_VERIFICATION_READY: true`

---

## 10. Restoration (separate operator write)

`RESTORATION_REQUIRED: true` — this is authz proof, not a content change. Restore baseline after SELECT confirms the marker.

Restore is **not** the proof POST. Sequence:

1. Proof Save once → Secret **unset** → post-write SELECT.
2. Record `updated_at` after proof (`LOCK_AFTER`).
3. **New explicit approval** for restore.
4. Owner fixture recheck (Secret OFF).
5. Secret ON → **exactly one** restore POST → unset.
6. SELECT: description === before snapshot; track ids unchanged; albums 4 / tracks 34.

Restore uses the **same** Edge → DEFINER RPC path. Payload = before snapshot scalars + original description + same `tracksText`. `expectedBeforeUpdatedAt` = `LOCK_AFTER` (not the preflight lock).

Do **not** use PostgREST `.update()`. Do **not** SQL UPDATE/DELETE/INSERT unless a later incident approval says so.

If restore fails / times out / 5xx:

```txt
stop immediately
do not retry
do not cleanup
do not run SQL
do not re-arm
record incident
ask human
```

Emergency SQL (documentation only · **not** in this packet · needs separate approval):

```sql
-- STAGING ONLY kmjqppxjdnwwrtaeqjta · DO NOT RUN NOW
-- UPDATE public.discography
-- SET description = '後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass',
--     updated_at = now()
-- WHERE site_slug = 'gosaki-piano'
--   AND legacy_id = 'discography-003';
```

Prefer RPC restore so track replace stays in one TX if a future restore accidentally diffs tracks.

`RESTORATION_PACKET_READY: true`

`DIRECT_TABLE_WRITE_USED: false`

---

## 11. Operator sequence (future execution · not now)

1. `npx supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta` → VERSION **47**.
2. SELECT-only: 4 / 34 / 999=0 · 003 lock + description match snapshot.
3. Owner fixture recheck (Secret OFF) → `can_write_site=true` · `is_admin=false`.
4. Prepare §7 snippet (clipboard). Do not paste yet.
5. Secret ON (staging `--project-ref` only).
6. Paste §7 once. No UI Save. No retry.
7. Secret unset immediately (any outcome).
8. Arm-OFF `save_not_armed` + post-write SELECT.
9. Record sanitized result. Never log JWT/PAT/secret values.
10. Restoration = **later** approved step (§10).

Required approval form for execution (not this phase):

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 12. Explicit non-actions (this phase)

- No Secret set/unset · no owner POST · no UI Save
- No GRANT / RLS / RPC / Edge deploy
- No owner → `admin_users`
- No live-read wiring fix
- No commit/push unless operator separately requests

---

## 13. Next

**`discography-site-owner-authz-slice-b-operational-save-execution`**

Operator runs the locked packet once after explicit approval. Cursor must not click Save / set Secret.

Deferred: `discography-musician-basic-live-read-wiring-fix`.
