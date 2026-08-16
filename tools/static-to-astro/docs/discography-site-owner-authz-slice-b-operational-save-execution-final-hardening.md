# Discography site-owner authz Slice B — operational Save execution final hardening

- **Phase:** `discography-site-owner-authz-slice-b-operational-save-execution-final-hardening`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (packet hardened · Save not executed)**
- **HEAD:** `8316f26d1f423f134a0189e4f3fcd7a2fdccd8fc`
- **Prior:** `discography-site-owner-authz-slice-b-operational-save-execution-packet-review`
- **Operator SoT:** this file (supersedes packet-review for execution)
- **VERSION guard:** updated 2026-08-16 in `discography-site-owner-authz-slice-b-operational-save-version-guard-update` — pre-arm **ACTIVE + VERSION 50 + UPDATED_AT `2026-08-15 14:12:36`**. Historical Slice A deploy VERSION was **47** (secret revisions, not a new bundle).
- **This phase:** harden the locked Save packet · **no** Secret · **no** POST · **no** DB write · **no** restoration · **no** deploy · **no** production · **no** commit/push by Cursor

Cursor must **not** run Secret / POST / Save / restore / `npm run dev` / PAT export.

Restoration stays **deferred** until after a successful Save records `newLock`. Do **not** mix a post-write lock placeholder into this Save packet.

Staging only: `kmjqppxjdnwwrtaeqjta`. Production `vsbvndwuajjhnzpohghh` **forbidden**.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-b-operational-save-execution-final-hardening
TARGET_RELEASE: discography-003
RAW_URL_LITERALS_CONFIRMED: true
MARKDOWN_URL_LITERAL_PRESENT: false
FULL_ALBUM_BASELINE_GATE: true
ALBUM_FIELDS_MATCH_REQUIRED: true
POST_ONLY_DESCRIPTION_CHANGE_VERIFIED: true
PROCESS_SCOPED_PAT_READINESS_ADDED: true
AUTH_ENABLED_DEV_START_ADDED: true
RESTORATION_DEFERRED_UNTIL_NEW_LOCK: true
TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY: true
READY_FOR_OPERATOR_SAVE: true
SAVE_EXECUTED: false
SECRETS_CHANGED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
CURSOR_EXECUTED_PACKET: false
RESTORATION_IN_SAVE_PACKET: false
DIRECT_SQL_WRITE: false
NO_RETRY_RULE_FIXED: true
SECRET_OFF_METHOD: unset
STAGING_REF_HARD_FIXED: true
VERSION_47_REQUIRED: false
PRE_ARM_VERSION_GUARD: 50
PRE_ARM_UPDATED_AT_PIN: 2026-08-15 14:12:36
POST_ARM_VERSION_FIXED: false
UPDATED_AT_CODE_IDENTITY_PIN: true
ROOT_ENV_LOCAL_EDIT_FORBIDDEN: true
TOOL_ENV_LOCAL_SOURCE_FORBIDDEN: true
SERVICE_ROLE_FORBIDDEN: true
UI_SAVE_FORBIDDEN: true
PRODUCTION_BLOCKED: true
COMMIT_READY: true
STOP_REASONS: none
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-operational-save-execution
DEFERRED_FINDING: discography-musician-basic-live-read-wiring-fix
DEFERRED_RESTORATION: discography-site-owner-authz-slice-b-operational-save-restoration-review
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`READY_FOR_OPERATOR_SAVE: true` means this hardened packet is locked. It does **not** authorize Cursor or this-phase Save.

Required later approval:

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 1. RAW_URL_LITERALS

Packet-review SoT JS already used quoted strings (not Markdown links). Chat paste can autolink `https://...`. This packet builds URLs as **JavaScript string concatenation / quoted strings only**.

| Const | Construction |
| --- | --- |
| `COVER_URL` | `"https://" + STG + ".supabase.co/storage/v1/object/public/site-assets/gosaki/discography/discography-003/cover.jpg"` |
| `STREAMING_URL` | `"https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja"` |

Forbidden in this file: Markdown autolink form (bracket-url then paren-url). Raw strings only.

`RAW_URL_LITERALS_CONFIRMED: true`

`MARKDOWN_URL_LITERAL_PRESENT: false`

---

## 2. Execution readiness (before Secret ON)

Previous phase ended with `SUPABASE_ACCESS_TOKEN` unset and the dev server stopped. Re-establish **before** any Secret ON.

Do **not** edit root `.env.local`. Do **not** `source tools/static-to-astro/.env.local` (`service_role` risk). Do **not** print PAT / anon / JWT.

### 2.1 Process-scoped PAT (value hidden)

```bash
cd ~/sariswing-astro
# paste token at the prompt; it will not echo
read -s SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN
npx -y supabase@2.114.0 projects list
```

Require staging `kmjqppxjdnwwrtaeqjta` visible. Do **not** run secrets against production `vsbvndwuajjhnzpohghh`. Every later secrets/functions command still needs `--project-ref kmjqppxjdnwwrtaeqjta`.

`PROCESS_SCOPED_PAT_READINESS_ADDED: true`

### 2.2 Auth-enabled process-scoped dev (UI Save still off)

URL/anon stay in existing root `.env.local` (Vite reads them). Inline flags below; write dry-run stays **true**; Discography UI Save arm stays unset.

```bash
cd ~/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
npm run dev
```

Then login as **pure site owner** at:

`http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

Do **not** click Save or Dry-run.

Confirm Vite `getStagingAuthConfig()` host contains `kmjqppxjdnwwrtaeqjta` and not `vsbvndwuajjhnzpohghh` (owner fixture snippet below).

`AUTH_ENABLED_DEV_START_ADDED: true`

---

## 3. Exact Save packet (hardened · do not run now)

Working directory: `~/sariswing-astro`.

### 3.1 Function identity (pre-Secret ON)

```bash
npx -y supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta
```

Require **all** of these for `gosaki-discography-save-dry-run`. Else **STOP** (no Secret ON):

| Field | Required |
| --- | --- |
| STATUS | **ACTIVE** |
| VERSION | **50** (pre-arm metadata checkpoint only) |
| UPDATED_AT (UTC) | **2026-08-15 14:12:36** (Slice A **code** pin) |

Do **not** treat VERSION as code identity. `UPDATED_AT` is the primary pin. Historical Slice A deploy VERSION was **47**; live 50 is secret-revision generation.

`PRE_ARM_VERSION_GUARD: 50`

`PRE_ARM_UPDATED_AT_PIN: 2026-08-15 14:12:36`

`UPDATED_AT_CODE_IDENTITY_PIN: true`

### 3.2 Owner fixture (Secret OFF)

Same IIFE as packet-review §3.3. Require `ownerJwtProbePass=true` (`sessionPresent` · `can_write_site=true` · `is_admin=false` · staging host). Else **STOP**.

### 3.3 Secret OFF confirmation (`discography-999` only)

Same IIFE as packet-review §3.4. PASS: HTTP **403** `save_not_armed`. Do **not** use `discography-003` for this check.

### 3.4 Prepare §3.6 in clipboard (Secret still OFF)

Do not paste into Console yet.

### 3.5 Secret ON (staging only · after 2.1–3.3 and §3.6 prepared)

```bash
npx -y supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

After ON: do not open/search/copy the doc. Paste §3.6 once.

Do **not** require VERSION **50** after this command. Secret ON may increment VERSION to **51**. That is expected (`POST_ARM_VERSION_FIXED: false`).

Immediately re-list (read-only). Require `UPDATED_AT` still **2026-08-15 14:12:36**. If `UPDATED_AT` changed → **STOP**, unset, no POST (possible code deploy). Do not STOP on VERSION ≠ 50 after arm.

### 3.6 Exactly one owner POST (full album baseline gate)

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

  const EXPECTED = {
    legacy_id: LEGACY,
    title: "About Us!!",
    artist: "ごさきりかこTrio",
    release_date: "2019-01-11",
    label: null,
    catalog_number: "GSRT-0001",
    description: DESC_BEFORE,
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
      description: DESC_AFTER,
    },
    tracksText: TRACKS,
  };
  if (body.legacyId !== "discography-003") {
    console.log({ abort: "legacy_id_not_003" });
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
    probe: "slice-b-owner-operational-save",
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
| `rpc` | `gosaki_discography_operational_save` |
| `didWrite` / `dbWrite` | `true` |
| `changedFieldsOk` | `true` (`["description"]` exactly) |

Timeout / 5xx / unexpected → **no retry**. Still unset.

`FULL_ALBUM_BASELINE_GATE: true`

`ALBUM_FIELDS_MATCH_REQUIRED: true`

### 3.7 Immediate Secret unset (any outcome)

```bash
npx -y supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Then repeat §3.3. PASS: `save_not_armed`.

### 3.8 Post-write SELECT (description + updated_at only)

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LOCK = "2026-07-10T05:59:35.138671+00:00";
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
  const lockAdvanced = row && String(row.updated_at) !== LOCK;
  const tracksOk = JSON.stringify(titles) === JSON.stringify(TRACKS);
  console.log({
    probe: "slice-b-post-write",
    albums: albums.count,
    tracks: tracks.count,
    descriptionOk: descriptionOk,
    lockAdvanced: lockAdvanced,
    othersOk: othersOk,
    tracksOk: tracksOk,
    newLock: row && row.updated_at,
    pass:
      albums.count === 4 &&
      tracks.count === 34 &&
      descriptionOk &&
      lockAdvanced &&
      othersOk &&
      tracksOk,
  });
})();
```

PASS requires Save log `changedFieldsOk=true` **and** this `pass=true`. Record `newLock` only. Do not restore in this packet.

Do **not** use function VERSION as a post-write success condition.

After unset, re-list (read-only). Require `UPDATED_AT` still **2026-08-15 14:12:36**. VERSION may be 51 or 52 (Secret ON then unset). If `UPDATED_AT` drifted → **STOP** (do not treat Save as fully verified; do not restore in this packet).

`POST_ONLY_DESCRIPTION_CHANGE_VERIFIED: true`

`POST_ARM_VERSION_FIXED: false`

---

## 4. Restoration deferred

Do **not** run restore now. Do **not** put `LOCK_AFTER` / `REPLACE_WITH_POST_WRITE_UPDATED_AT` in the Save IIFE.

After Save PASS + `newLock` recorded, a **separate** review phase will lock the restore packet.

`RESTORATION_DEFERRED_UNTIL_NEW_LOCK: true`

`RESTORATION_IN_SAVE_PACKET: false`

---

## 5. Sequence (later execution only)

1. §2.1 PAT + `projects list`
2. §2.2 Auth-enabled `npm run dev` + owner login
3. §3.1 ACTIVE + VERSION **50** + `UPDATED_AT` **2026-08-15 14:12:36**
4. §3.2 owner fixture
5. §3.3 Secret OFF
6. Prepare §3.6
7. §3.5 Secret ON · re-list `UPDATED_AT` pin only (VERSION may be 51)
8. §3.6 once (`albumFieldsOk` or abort + unset)
9. §3.7 unset immediately
10. §3.8 post-write · record `newLock` · re-list `UPDATED_AT` pin (not VERSION)
11. Restoration = later review (not now)

No retry. No UI Save. No production ref. No SQL / PostgREST write.

---

## 6. Explicit non-actions (this phase)

- No Secret set/unset · no owner POST · no UI Save · no restore
- No root `.env.local` edit · no `tools/static-to-astro/.env.local` source
- No commit/push unless operator separately requests (stage only if asked)

---

## 7. Next

**`discography-site-owner-authz-slice-b-operational-save-execution`** after explicit approval.

Deferred restore: `discography-site-owner-authz-slice-b-operational-save-restoration-review`.
