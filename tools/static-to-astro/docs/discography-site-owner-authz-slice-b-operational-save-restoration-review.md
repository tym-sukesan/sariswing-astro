# Discography site-owner authz Slice B — operational Save restoration review

- **Phase:** `discography-site-owner-authz-slice-b-operational-save-restoration-review`
- **Date:** 2026-08-18
- **Status:** **STOP (pre-restore lock mismatch · transcription corrected · restore not executed)**
- **HEAD:** `4d4e3548ec95199f900280930917231d0326de64`
- **Prior:** `discography-site-owner-authz-slice-b-operational-save-execution-result`
- **Operator SoT:** this file (supersedes packet-review §4 placeholder lock)
- **VERSION guard:** pre-arm **ACTIVE + VERSION 56 + UPDATED_AT `2026-08-15 14:12:36`**
- **Lock:** `expectedBeforeUpdatedAt` **must** be `2026-08-16T16:47:01.44405+00:00` (`newLock` from Save SUCCESS)
- **This phase:** correct transcribed lock · keep restore **STOP** · **no** Secret · **no** restore POST · **no** DB write · **no** deploy · **no** production · **no** commit/push by Cursor

Cursor must **not** run Secret / POST / restore / `npm run dev` / PAT export.

Staging only: `kmjqppxjdnwwrtaeqjta`. Production `vsbvndwuajjhnzpohghh` **forbidden**.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-b-operational-save-restoration-review
TARGET_RELEASE: discography-003
RESTORE_DESCRIPTION_ONLY: true
EXPECTED_BEFORE_UPDATED_AT: 2026-08-16T16:47:01.44405+00:00
LOCK_TRANSCRIPTION_CORRECTED: true
PRE_RESTORE_LOCK_MISMATCH_STOP: true
OLD_SAVE_LOCK_FORBIDDEN: true
FULL_ALBUM_BASELINE_GATE: true
TRACKS_UNCHANGED_REQUIRED: true
ALBUM_OTHER_FIELDS_UNCHANGED_REQUIRED: true
PRE_ARM_VERSION_GUARD: 56
PRE_ARM_UPDATED_AT_PIN: 2026-08-15 14:12:36
POST_ARM_VERSION_FIXED: false
UPDATED_AT_CODE_IDENTITY_PIN: true
FLAG_RESET_GATE: true
CONSOLE_STAGED_PASTE: true
NO_RETRY_RULE_FIXED: true
SECRET_OFF_METHOD: unset
READY_FOR_OPERATOR_RESTORE: false
RESTORE_EXECUTED: false
SAVE_EXECUTED: true
CURSOR_EXECUTED_PACKET: false
DIRECT_SQL_WRITE: false
UPDATED_AT_NOT_REVERTED_TO_JULY_10: true
ROOT_ENV_LOCAL_EDIT_FORBIDDEN: true
TOOL_ENV_LOCAL_SOURCE_FORBIDDEN: true
SERVICE_ROLE_FORBIDDEN: true
UI_SAVE_FORBIDDEN: true
PRODUCTION_BLOCKED: true
STOP_REASONS: pre-restore lockOk=false; packet lock had extra digit; corrected to 2026-08-16T16:47:01.44405+00:00; Secret OFF; restore not executed
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-operational-save-restoration-execution
DEFERRED_FINDING: discography-musician-basic-live-read-wiring-fix
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`READY_FOR_OPERATOR_RESTORE: false` — restore stays **STOP**. Re-run §3.4 against the corrected lock before any Secret ON. It does **not** authorize Cursor restore.

### 0.1 Pre-restore STOP (operator · recorded)

Live §3.4 SELECT (Secret **OFF** · restore **not** executed):

| Field | Value |
| --- | --- |
| `updated_at` | `2026-08-16T16:47:01.44405+00:00` |
| `descriptionOk` | **true** |
| `othersOk` | **true** |
| `tracksOk` | **true** |
| albums | **4** |
| tracks | **34** |
| `notOldLock` | **true** |
| `lockOk` | **false** |
| `pass` | **false** |

Cause: packet compared `updated_at` to a mistyped lock (extra `4` in fractional seconds). Live row was unchanged. Secret remained OFF.

`PRE_RESTORE_LOCK_MISMATCH_STOP: true`

`LOCK_TRANSCRIPTION_CORRECTED: true`

Required later approval:

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 1. Restore identity

| Item | Value |
| --- | --- |
| Staging | `kmjqppxjdnwwrtaeqjta` |
| Production | `vsbvndwuajjhnzpohghh` **forbidden** |
| Function | `gosaki-discography-save-dry-run` |
| Path | browser session POST → Edge → DEFINER RPC `gosaki_discography_operational_save` |
| `legacyId` | `discography-003` |
| `expectedBeforeUpdatedAt` | `2026-08-16T16:47:01.44405+00:00` |
| Current description | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass [CMS Kit staging] Slice B owner Save PoC` |
| Restore description | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass` |
| Tracks | 9 titles unchanged (`白玉Bluse` spelling preserved) |
| Album other fields | unchanged (title / artist / dates / URLs / published / sort_order) |

Do **not** use Save-before lock `2026-07-10T05:59:35.138671+00:00` as `expectedBeforeUpdatedAt`.

Do **not** expect post-restore `updated_at` to return to that July 10 value. It must **advance** from `newLock`.

`OLD_SAVE_LOCK_FORBIDDEN: true`

`UPDATED_AT_NOT_REVERTED_TO_JULY_10: true`

---

## 2. Execution readiness (before Secret ON)

Do **not** edit root `.env.local`. Do **not** `source tools/static-to-astro/.env.local`. Do **not** print PAT / anon / JWT.

### 2.1 Process-scoped PAT

```bash
cd ~/sariswing-astro
read -s SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN
npx -y supabase@2.114.0 projects list
```

Require staging `kmjqppxjdnwwrtaeqjta` visible. Every secrets/functions command needs `--project-ref kmjqppxjdnwwrtaeqjta`.

### 2.2 Auth-enabled process-scoped dev (UI Save still off)

```bash
cd ~/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
npm run dev
```

Login as **pure site owner** at:

`http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

Do **not** click Save or Dry-run.

---

## 3. Exact restore packet (do not run now)

### 3.1 Function identity (pre-Secret ON)

```bash
npx -y supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta
```

Require **all** of these for `gosaki-discography-save-dry-run`. Else **STOP** (no Secret ON):

| Field | Required |
| --- | --- |
| STATUS | **ACTIVE** |
| VERSION | **56** (pre-arm metadata checkpoint only) |
| UPDATED_AT (UTC) | **2026-08-15 14:12:36** (Slice A **code** pin) |

Do **not** treat VERSION as code identity. Historical: Slice A **47** · checkpoints **50** / **52** / **54** · live **56** is secret-revision after Save set/unset.

`PRE_ARM_VERSION_GUARD: 56`

`PRE_ARM_UPDATED_AT_PIN: 2026-08-15 14:12:36`

### 3.2 Owner fixture (Secret OFF)

Same IIFE as packet-review §3.3. Require `ownerJwtProbePass=true` (`can_write_site=true` · `is_admin=false` · staging host). Else **STOP**.

### 3.3 Secret OFF confirmation (`discography-999` only)

Same IIFE as packet-review §3.4. PASS: HTTP **403** `save_not_armed`. Do **not** use `discography-003` for this check.

### 3.4 Pre-restore full baseline (Secret OFF)

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LOCK = "2026-08-16T16:47:01.44405+00:00";
  const OLD_LOCK = "2026-07-10T05:59:35.138671+00:00";
  const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
  const DESC_AFTER = DESC_BEFORE + " [CMS Kit staging] Slice B owner Save PoC";
  const COVER_URL =
    "https://" +
    STG +
    ".supabase.co/storage/v1/object/public/site-assets/gosaki/discography/discography-003/cover.jpg";
  const STREAMING_URL =
    "https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja";
  const TRACKS = [
    "白玉Bluse",
    "The Lady Is A Tramp",
    "Honeysuckle Rose",
    "Darn That Dream",
    "The Old Country",
    "The Sweetest Sounds",
    "The Look Of Love",
    "Samba De Cafe Terrasse",
    "I'd Climb The Highest Mountain",
  ];
  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
  const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
  const config = cfgMod.getStagingAuthConfig();
  const url = String(config.supabaseUrl || "").trim();
  const anonKey = String(config.supabaseAnonKey || "").trim();
  if (!url.includes(STG) || url.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }
  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const albums = await client
    .from("discography")
    .select(
      "legacy_id,title,artist,release_date,label,catalog_number,description,cover_image_url,purchase_url,streaming_url,published,sort_order,updated_at",
      { count: "exact" },
    )
    .eq("site_slug", "gosaki-piano")
    .order("legacy_id");
  const tracks = await client
    .from("discography_tracks")
    .select("id", { count: "exact", head: true })
    .eq("site_slug", "gosaki-piano");
  const row = (albums.data || []).find((r) => r.legacy_id === "discography-003");
  const trows = await client
    .from("discography_tracks")
    .select("id,track_number,title")
    .eq("site_slug", "gosaki-piano")
    .eq("discography_legacy_id", "discography-003")
    .order("track_number", { ascending: true });
  const titles = (trows.data || []).map((r) => String(r.title || "").trim());
  function same(a, b) {
    if (a === null || a === undefined) return b === null || b === undefined;
    if (typeof b === "boolean" || typeof b === "number") return a === b;
    return String(a) === String(b);
  }
  const othersOk =
    row &&
    same(row.title, "About Us!!") &&
    same(row.artist, "ごさきりかこTrio") &&
    same(row.release_date, "2019-01-11") &&
    same(row.label, null) &&
    same(row.catalog_number, "GSRT-0001") &&
    same(row.cover_image_url, COVER_URL) &&
    same(row.purchase_url, null) &&
    same(row.streaming_url, STREAMING_URL) &&
    same(row.published, true) &&
    same(row.sort_order, 3);
  const descriptionOk = row && String(row.description) === DESC_AFTER;
  const lockOk = row && String(row.updated_at) === LOCK;
  const notOldLock = row && String(row.updated_at) !== OLD_LOCK;
  const tracksOk = JSON.stringify(titles) === JSON.stringify(TRACKS);
  console.log({
    probe: "slice-b-pre-restore-baseline",
    albums: albums.count,
    tracks: tracks.count,
    descriptionOk: descriptionOk,
    lockOk: lockOk,
    notOldLock: notOldLock,
    othersOk: othersOk,
    tracksOk: tracksOk,
    updated_at: row && row.updated_at,
    pass:
      albums.count === 4 &&
      tracks.count === 34 &&
      descriptionOk &&
      lockOk &&
      notOldLock &&
      othersOk &&
      tracksOk,
  });
})();
```

Require `pass=true`. Else **STOP**.

`FULL_ALBUM_BASELINE_GATE: true`

### 3.5 Flag reset gate (Secret OFF · after Discography page reload)

Reload `/__admin-staging-shell/musician-basic/admin/discography/` (or the current Discography tab). Stay Secret **OFF**. Do **not** assign `window.__SLICE_B_OWNER_RESTORE_FIRED`.

```javascript
console.log({
  probe: "slice-b-restore-flag-reset",
  flagUndefined: typeof window.__SLICE_B_OWNER_RESTORE_FIRED === "undefined",
});
```

Require `flagUndefined === true`. Else **STOP** (reload again; do not paste §3.7; do not Secret ON).

`FLAG_RESET_GATE: true`

### 3.6 Stage §3.7 in DevTools Console (Secret still OFF · only after §3.5 PASS)

Paste §3.7 into the DevTools Console **input field**. Do **not** press Enter. Do **not** leave the snippet only on the clipboard.

`CONSOLE_STAGED_PASTE: true`

### 3.7 Exactly one owner restore POST (full album baseline gate)

```javascript
(async () => {
  const FLAG = "__SLICE_B_OWNER_RESTORE_FIRED";
  if (window[FLAG]) {
    console.log({ abort: "already_fired_no_retry" });
    return;
  }
  window[FLAG] = true;

  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LEGACY = "discography-003";
  const LOCK = "2026-08-16T16:47:01.44405+00:00";
  const OLD_LOCK = "2026-07-10T05:59:35.138671+00:00";
  const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
  const DESC_AFTER = DESC_BEFORE + " [CMS Kit staging] Slice B owner Save PoC";
  const COVER_URL =
    "https://" +
    STG +
    ".supabase.co/storage/v1/object/public/site-assets/gosaki/discography/discography-003/cover.jpg";
  const STREAMING_URL =
    "https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja";
  const TRACKS =
    "白玉Bluse\nThe Lady Is A Tramp\nHoneysuckle Rose\nDarn That Dream\nThe Old Country\nThe Sweetest Sounds\nThe Look Of Love\nSamba De Cafe Terrasse\nI'd Climb The Highest Mountain";
  const FN =
    "https://" + STG + ".supabase.co/functions/v1/gosaki-discography-save-dry-run";

  if (!LOCK || LOCK === OLD_LOCK) {
    console.log({ abort: "restore_lock_not_new" });
    return;
  }

  const EXPECTED = {
    legacy_id: LEGACY,
    title: "About Us!!",
    artist: "ごさきりかこTrio",
    release_date: "2019-01-11",
    label: null,
    catalog_number: "GSRT-0001",
    description: DESC_AFTER,
    cover_image_url: COVER_URL,
    purchase_url: null,
    streaming_url: STREAMING_URL,
    published: true,
    sort_order: 3,
    updated_at: LOCK,
  };

  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
  const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
  const config = cfgMod.getStagingAuthConfig();
  const url = String(config.supabaseUrl || "").trim();
  const anonKey = String(config.supabaseAnonKey || "").trim();
  if (!url || !anonKey) {
    console.log({ abort: "missing_staging_auth_config" });
    return;
  }
  if (!url.includes(STG) || url.includes(PROD) || FN.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }

  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const { data: sessData, error: sessErr } = await client.auth.getSession();
  const token = sessData && sessData.session && sessData.session.access_token;
  if (!token || typeof token !== "string" || sessErr) {
    console.log({ abort: "no_owner_session" });
    return;
  }

  const { data: row, error: rowErr } = await client
    .from("discography")
    .select(
      "legacy_id,title,artist,release_date,label,catalog_number,description,cover_image_url,purchase_url,streaming_url,published,sort_order,updated_at",
    )
    .eq("site_slug", "gosaki-piano")
    .eq("legacy_id", LEGACY)
    .maybeSingle();
  if (rowErr || !row) {
    console.log({ abort: "album_reselect_failed" });
    return;
  }

  function same(a, b) {
    if (a === null || a === undefined) return b === null || b === undefined;
    if (typeof b === "boolean" || typeof b === "number") return a === b;
    return String(a) === String(b);
  }
  const albumFieldsOk =
    same(row.legacy_id, EXPECTED.legacy_id) &&
    same(row.title, EXPECTED.title) &&
    same(row.artist, EXPECTED.artist) &&
    same(row.release_date, EXPECTED.release_date) &&
    same(row.label, EXPECTED.label) &&
    same(row.catalog_number, EXPECTED.catalog_number) &&
    same(row.description, EXPECTED.description) &&
    same(row.cover_image_url, EXPECTED.cover_image_url) &&
    same(row.purchase_url, EXPECTED.purchase_url) &&
    same(row.streaming_url, EXPECTED.streaming_url) &&
    same(row.published, EXPECTED.published) &&
    same(row.sort_order, EXPECTED.sort_order) &&
    same(row.updated_at, EXPECTED.updated_at);
  if (!albumFieldsOk) {
    console.log({ abort: "album_baseline_mismatch", albumFieldsOk: false });
    return;
  }

  const trows = await client
    .from("discography_tracks")
    .select("title,track_number")
    .eq("site_slug", "gosaki-piano")
    .eq("discography_legacy_id", LEGACY)
    .order("track_number", { ascending: true });
  const liveTracks = (trows.data || []).map((r) => String(r.title || "").trim()).join("\n");
  if (liveTracks !== TRACKS) {
    console.log({ abort: "tracks_baseline_changed" });
    return;
  }

  const body = {
    operation: "save",
    approvalId: "gosaki-discography-operational-save",
    siteSlug: "gosaki-piano",
    legacyId: LEGACY,
    expectedBeforeUpdatedAt: LOCK,
    release: {
      title: EXPECTED.title,
      artist: EXPECTED.artist,
      release_date: EXPECTED.release_date,
      label: EXPECTED.label,
      catalog_number: EXPECTED.catalog_number,
      published: EXPECTED.published,
      cover_image_url: COVER_URL,
      purchase_url: EXPECTED.purchase_url,
      streaming_url: STREAMING_URL,
      description: DESC_BEFORE,
    },
    tracksText: TRACKS,
  };
  if (body.legacyId !== "discography-003") {
    console.log({ abort: "legacy_id_not_003" });
    return;
  }
  if (body.expectedBeforeUpdatedAt !== "2026-08-16T16:47:01.44405+00:00") {
    console.log({ abort: "restore_lock_not_newlock" });
    return;
  }
  if (String(body.release.cover_image_url).indexOf("[") >= 0 || String(body.release.streaming_url).indexOf("[") >= 0) {
    console.log({ abort: "markdown_url_literal" });
    return;
  }

  const ac = new AbortController();
  const timer = setTimeout(function () { ac.abort("timeout"); }, 30000);
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
    try {
      json = JSON.parse(await res.text());
    } catch (e) {
      kind = "non_json";
    }
  } catch (e) {
    kind = e === "timeout" || (e && e.name === "AbortError") ? "timeout" : "fetch_failed";
  } finally {
    clearTimeout(timer);
  }

  const cf = json && json.changedFields;
  const changedFieldsOk =
    Array.isArray(cf) && cf.length === 1 && cf[0] === "description";
  const keys = json && typeof json === "object" ? Object.keys(json).sort() : [];
  console.log({
    probe: "slice-b-owner-restore",
    kind: kind,
    status: status,
    reasonCode: json && json.reasonCode,
    ok: json && json.ok,
    didWrite: json && json.didWrite,
    dbWrite: json && json.dbWrite,
    rpc: json && json.rpc,
    rpcKeyPresent: keys.indexOf("rpc") !== -1,
    changedFields: cf,
    changedFieldsOk: changedFieldsOk,
    albumFieldsOk: true,
    updatedAt: json && (json.updated_at || json.updatedAt),
    keys: keys,
  });
})();
```

If `albumFieldsOk` is not true, abort even if Secret is already ON, then **unset** immediately. No POST.

Expected success:

| Field | Value |
| --- | --- |
| HTTP | **200** |
| `ok` | `true` |
| `didWrite` / `dbWrite` | `true` |
| `rpc` | `gosaki_discography_operational_save` |
| `changedFields` | `["description"]` exactly |

Timeout / 5xx / unexpected → **no retry**. Still unset.

### 3.8 Secret ON (staging only · after 2.1–3.6 and §3.7 staged in Console)

```bash
npx -y supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

After ON: do not open/search/copy the doc. Return to Console and press **Enter once** on the already-pasted §3.7. Do not re-paste. No retry.

Do **not** require VERSION **56** after this command. Secret ON may increment VERSION to **57**. That is expected (`POST_ARM_VERSION_FIXED: false`).

Immediately re-list (read-only). Require `UPDATED_AT` still **2026-08-15 14:12:36**. If `UPDATED_AT` changed → **STOP**, unset, no Enter / no POST. Do not STOP on VERSION ≠ 56 after arm.

### 3.9 Immediate Secret unset (any outcome)

```bash
npx -y supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Then repeat §3.3. PASS: `save_not_armed`.

### 3.10 Post-restore SELECT

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LOCK = "2026-08-16T16:47:01.44405+00:00";
  const OLD_LOCK = "2026-07-10T05:59:35.138671+00:00";
  const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
  const COVER_URL =
    "https://" +
    STG +
    ".supabase.co/storage/v1/object/public/site-assets/gosaki/discography/discography-003/cover.jpg";
  const STREAMING_URL =
    "https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja";
  const TRACKS = [
    "白玉Bluse",
    "The Lady Is A Tramp",
    "Honeysuckle Rose",
    "Darn That Dream",
    "The Old Country",
    "The Sweetest Sounds",
    "The Look Of Love",
    "Samba De Cafe Terrasse",
    "I'd Climb The Highest Mountain",
  ];
  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
  const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
  const config = cfgMod.getStagingAuthConfig();
  const url = String(config.supabaseUrl || "").trim();
  const anonKey = String(config.supabaseAnonKey || "").trim();
  if (!url.includes(STG) || url.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }
  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const albums = await client
    .from("discography")
    .select(
      "legacy_id,title,artist,release_date,label,catalog_number,description,cover_image_url,purchase_url,streaming_url,published,sort_order,updated_at",
      { count: "exact" },
    )
    .eq("site_slug", "gosaki-piano")
    .order("legacy_id");
  const tracks = await client
    .from("discography_tracks")
    .select("id", { count: "exact", head: true })
    .eq("site_slug", "gosaki-piano");
  const row = (albums.data || []).find((r) => r.legacy_id === "discography-003");
  const trows = await client
    .from("discography_tracks")
    .select("id,track_number,title")
    .eq("site_slug", "gosaki-piano")
    .eq("discography_legacy_id", "discography-003")
    .order("track_number", { ascending: true });
  const titles = (trows.data || []).map((r) => String(r.title || "").trim());
  function same(a, b) {
    if (a === null || a === undefined) return b === null || b === undefined;
    if (typeof b === "boolean" || typeof b === "number") return a === b;
    return String(a) === String(b);
  }
  const othersOk =
    row &&
    same(row.title, "About Us!!") &&
    same(row.artist, "ごさきりかこTrio") &&
    same(row.release_date, "2019-01-11") &&
    same(row.label, null) &&
    same(row.catalog_number, "GSRT-0001") &&
    same(row.cover_image_url, COVER_URL) &&
    same(row.purchase_url, null) &&
    same(row.streaming_url, STREAMING_URL) &&
    same(row.published, true) &&
    same(row.sort_order, 3);
  const descriptionOk = row && String(row.description) === DESC_BEFORE;
  const lockAdvanced = row && String(row.updated_at) !== LOCK;
  const notRevertedToJuly10 = row && String(row.updated_at) !== OLD_LOCK;
  const tracksOk = JSON.stringify(titles) === JSON.stringify(TRACKS);
  console.log({
    probe: "slice-b-post-restore",
    albums: albums.count,
    tracks: tracks.count,
    descriptionOk: descriptionOk,
    lockAdvanced: lockAdvanced,
    notRevertedToJuly10: notRevertedToJuly10,
    othersOk: othersOk,
    tracksOk: tracksOk,
    restoredLock: row && row.updated_at,
    pass:
      albums.count === 4 &&
      tracks.count === 34 &&
      descriptionOk &&
      lockAdvanced &&
      notRevertedToJuly10 &&
      othersOk &&
      tracksOk,
  });
})();
```

PASS requires restore log `changedFieldsOk=true` **and** this `pass=true`. Record `restoredLock` only.

Do **not** use function VERSION as a post-write success condition.

After unset, re-list (read-only). Require `UPDATED_AT` still **2026-08-15 14:12:36**. VERSION may be 57 or 58 (Secret ON then unset). If `UPDATED_AT` drifted → **STOP**.

---

## 4. Sequence (later execution only)

1. §2.1 PAT + `projects list`
2. §2.2 Auth-enabled `npm run dev` + owner login
3. §3.1 ACTIVE + VERSION **56** + `UPDATED_AT` **2026-08-15 14:12:36**
4. §3.2 owner fixture (`can_write_site=true` · `is_admin=false`)
5. §3.3 Secret OFF `save_not_armed` via `discography-999`
6. §3.4 pre-restore baseline `pass=true`
7. Reload Discography page · §3.5 `flagUndefined === true` else **STOP**
8. §3.6 paste §3.7 into Console input · **no Enter**
9. §3.8 Secret ON · re-list `UPDATED_AT` pin only (VERSION may be 57)
10. Console Enter **once** (`albumFieldsOk` or abort + unset)
11. §3.9 unset immediately · `save_not_armed`
12. §3.10 post-restore · record `restoredLock` · re-list `UPDATED_AT` pin (not VERSION)

No retry. No UI Save. No production ref. No SQL / PostgREST write.

---

## 5. Explicit non-actions (this phase)

- No Secret set/unset · no owner POST · no UI Save · no restore
- No root `.env.local` edit · no `tools/static-to-astro/.env.local` source
- No commit/push unless operator separately requests (stage only if asked)

---

## 6. Next

**STOP.** Re-run §3.4 with corrected lock `2026-08-16T16:47:01.44405+00:00`. Do **not** Secret ON until `lockOk=true` and `pass=true`.

**`discography-site-owner-authz-slice-b-operational-save-restoration-execution`** only after that reconfirm **and** explicit approval.
