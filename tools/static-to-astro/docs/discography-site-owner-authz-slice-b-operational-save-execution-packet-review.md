# Discography site-owner authz Slice B — operational Save execution packet review

- **Phase:** `discography-site-owner-authz-slice-b-operational-save-execution-packet-review`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (final audit · superseded for operator execution)**
- **HEAD:** `8316f26d1f423f134a0189e4f3fcd7a2fdccd8fc`
- **Prior:** `discography-site-owner-authz-slice-b-operational-save-preflight` (committed)
- **Operator SoT (execution):** `discography-site-owner-authz-slice-b-operational-save-execution-final-hardening.md` after `discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result` (pre-arm VERSION **52** · Console staged paste). This review’s `PRE_ARM_VERSION_GUARD: 50` is **historical**. Historical Slice A deploy VERSION was **47**.
- **This phase:** present the exact operator packet and audit it · **no** Secret · **no** owner POST · **no** Save · **no** DB write · **no** restoration · **no** deploy · **no** production · **no** commit/push by Cursor

Cursor must **not** run any step below. Operator execution requires a later explicit approval:

```txt
承認します。この操作を1回だけ実行してください。
```

Staging only: `kmjqppxjdnwwrtaeqjta`. Production `vsbvndwuajjhnzpohghh` **forbidden**.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-b-operational-save-execution-packet-review
TARGET_RELEASE: discography-003
LOCK_CANDIDATE: 2026-07-10T05:59:35.138671+00:00
TARGET_LOCK_RECONFIRM_PACKET_READY: true
FULL_BEFORE_SNAPSHOT_READY: true
TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY: true
ONE_SHOT_SAVE_EXACT_PACKET_READY: true
SECRET_RESET_PACKET_READY: true
POST_WRITE_VERIFICATION_READY: true
RESTORATION_EXACT_PACKET_READY: true
RESTORATION_USES_NEW_LOCK: true
DIRECT_SQL_WRITE: false
DIRECT_TABLE_WRITE_USED: false
READY_FOR_OPERATOR_SAVE: true
SAVE_EXECUTED: false
SECRETS_CHANGED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
CURSOR_EXECUTED_PACKET: false
UI_READ_WIRING_IN_SCOPE: false
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
NO_RETRY_RULE_FIXED: true
SECRET_OFF_METHOD: unset
STAGING_REF_HARD_FIXED: true
VERSION_47_REQUIRED: false
PRE_ARM_VERSION_GUARD: 50
PRE_ARM_UPDATED_AT_PIN: 2026-08-15 14:12:36
POST_ARM_VERSION_FIXED: false
UPDATED_AT_CODE_IDENTITY_PIN: true
PRODUCTION_BLOCKED: true
COMMIT_READY: true
STOP_REASONS: none
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-operational-save-execution
DEFERRED_FINDING: discography-musician-basic-live-read-wiring-fix
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`READY_FOR_OPERATOR_SAVE: true` means this packet is locked for a later operator run. It does **not** authorize Cursor or this-phase Save.

---

## 1. Code audit — track DML on description-only

**STOP condition:** if description-only still ran `DELETE`/`INSERT` on `discography_tracks`, mutation scope would be wrong.

### Edge (`handleOperationalDiscographySaveHttp`)

1. Compare trimmed track titles: `tracksChanged = beforeTitles.join("\n") !== afterTitles.join("\n")`.
2. If no release field change **and** `!tracksChanged` → HTTP 422 `no_change` **before** RPC.
3. Description-only → `releaseFieldsChanged` includes `description` → RPC is called.
4. RPC always receives `p_track_titles: afterTitles` (the current 9 titles).
5. Edge does **not** itself DELETE/INSERT tracks.

### RPC (`gosaki_discography_operational_save`)

1. Compare DB titles (`array_agg` by `track_number`, `sort_order`) to `p_track_titles`.
2. `v_tracks_changed := true` **only** if those arrays differ.
3. `UPDATE public.discography` always runs when any editable field changed (here `description`).
4. `DELETE` / `INSERT` `discography_tracks` run **only** `IF v_tracks_changed`.

This packet sends the exact current 9 titles. SELECT-only reconfirm (2026-08-16, this review): `trackTitlesMatch=true`. Therefore:

`TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY: true`

If the Save IIFE aborts on `tracks_baseline_changed`, do **not** POST.

---

## 2. SELECT-only snapshot reconfirm (this review · not Save)

Anon REST · staging host only · no JWT logged.

| Check | Result |
| --- | --- |
| albums | **4** |
| tracks | **34** |
| `discography-999` | **0** |
| 003 `updated_at` | `2026-07-10T05:59:35.138671+00:00` · **match** |
| 003 `description` | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass` · **match** |
| 003 tracks | **9** titles exact match (do not “fix” `白玉Bluse`) |

Operator must still re-SELECT immediately before Secret ON. Mismatch → **STOP**.

`FULL_BEFORE_SNAPSHOT_READY: true`

`TARGET_LOCK_RECONFIRM_PACKET_READY: true`

---

## 3. Exact operator packet (locked · do not run now)

Working directory: `~/sariswing-astro`.

Page (login as pure site owner; do **not** click Save / Dry-run):

`http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

Do not print JWT / PAT / anon key / email / user id. Do not run `secrets list`. Do not `source` env files that contain `service_role`.

CLI: process-scoped `SUPABASE_ACCESS_TOKEN` + `npx supabase@2.114.0`. Omit `--project-ref` **forbidden** (linked project is production).

### 3.0 Constants (all snippets)

| Item | Value |
| --- | --- |
| Staging | `kmjqppxjdnwwrtaeqjta` |
| Production | `vsbvndwuajjhnzpohghh` **forbidden** |
| Function | `gosaki-discography-save-dry-run` |
| VERSION (pre-arm) | **50** required (metadata checkpoint · not code identity) |
| UPDATED_AT (UTC) | **2026-08-15 14:12:36** required (Slice A **code** pin) |
| `legacyId` | `discography-003` |
| Lock candidate | `2026-07-10T05:59:35.138671+00:00` |
| DESC_BEFORE | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass` |
| DESC_AFTER | `後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass [CMS Kit staging] Slice B owner Save PoC` |
| approvalId | `gosaki-discography-operational-save` |

### 3.1 Function identity / host (pre-Secret ON)

```bash
npx supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta
```

Require `gosaki-discography-save-dry-run` **ACTIVE** · VERSION **50** · `UPDATED_AT` **2026-08-15 14:12:36**. Else **STOP**.

Do **not** require VERSION 50 after Secret ON (may become 51). If `UPDATED_AT` drifts from the pin at any point → **STOP**. Historical Slice A deploy VERSION was **47**.

### 3.2 SELECT-only baseline + lock reconfirm (Secret OFF)

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LOCK = "2026-07-10T05:59:35.138671+00:00";
  const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
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
  if (!url || !anonKey) {
    console.log({ abort: "missing_staging_auth_config" });
    return;
  }
  if (!url.includes(STG) || url.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }
  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const albums = await client.from("discography").select("id", { count: "exact", head: true }).eq("site_slug", "gosaki-piano");
  const tracks = await client.from("discography_tracks").select("id", { count: "exact", head: true }).eq("site_slug", "gosaki-piano");
  const d999 = await client.from("discography").select("id", { count: "exact", head: true }).eq("site_slug", "gosaki-piano").eq("legacy_id", "discography-999");
  const row = await client.from("discography").select("legacy_id,title,artist,release_date,label,catalog_number,description,cover_image_url,purchase_url,streaming_url,published,updated_at,sort_order").eq("site_slug", "gosaki-piano").eq("legacy_id", "discography-003").maybeSingle();
  const trows = await client.from("discography_tracks").select("id,track_number,sort_order,title").eq("site_slug", "gosaki-piano").eq("discography_legacy_id", "discography-003").order("track_number", { ascending: true });
  const titles = (trows.data || []).map((r) => String(r.title || "").trim());
  const lockOk = String(row.data && row.data.updated_at) === LOCK;
  const descOk = String(row.data && row.data.description) === DESC_BEFORE;
  const tracksOk = JSON.stringify(titles) === JSON.stringify(TRACKS);
  console.log({
    probe: "slice-b-lock-reconfirm",
    albums: albums.count,
    tracks: tracks.count,
    discography999: d999.count,
    lockOk: lockOk,
    descOk: descOk,
    tracksOk: tracksOk,
    updated_at: row.data && row.data.updated_at,
    pass:
      albums.count === 4 &&
      tracks.count === 34 &&
      d999.count === 0 &&
      lockOk &&
      descOk &&
      tracksOk,
  });
})();
```

Require `pass=true`. Else **STOP** (no Secret ON).

### 3.3 Owner fixture (Secret OFF)

```javascript
(async () => {
  const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
  const PROD_REF = "vsbvndwuajjhnzpohghh";
  const SITE_SLUG = "gosaki-piano";
  const out = {
    probeKind: "owner-jwt-live-select-rpc-only",
    sessionPresent: false,
    stagingHostOk: false,
    productionHostBlocked: false,
    siteSingletonOk: false,
    can_write_site: null,
    is_admin: null,
    ownerJwtProbePass: false,
    stopReason: null,
  };
  const fail = (reason) => {
    out.stopReason = reason;
    console.log(out);
    return out;
  };
  try {
    const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
    const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
    const config = cfgMod.getStagingAuthConfig();
    const url = String(config.supabaseUrl || "").trim();
    const anonKey = String(config.supabaseAnonKey || "").trim();
    if (!url || !anonKey) return fail("missing_staging_auth_config");
    out.productionHostBlocked = url.includes(PROD_REF);
    out.stagingHostOk = url.includes(STAGING_REF) && !out.productionHostBlocked;
    if (out.productionHostBlocked) return fail("production_ref_blocked");
    if (!out.stagingHostOk) return fail("staging_host_mismatch");
    const client = clientMod.getStagingSupabaseClient(url, anonKey);
    const { data: sessData, error: sessErr } = await client.auth.getSession();
    out.sessionPresent = Boolean(sessData && sessData.session) && !sessErr;
    if (!out.sessionPresent) return fail("authenticated_session_missing");
    const { data: siteRows, error: siteErr } = await client.from("sites").select("id,site_slug,status").eq("site_slug", SITE_SLUG);
    if (siteErr) return fail("sites_select_failed");
    const rows = Array.isArray(siteRows) ? siteRows : [];
    out.siteSingletonOk = rows.length === 1;
    if (!out.siteSingletonOk) return fail("sites_not_exact_singleton");
    const siteId = String(rows[0].id || "").trim();
    if (!siteId) return fail("sites_id_missing");
    const { data: canWrite, error: writeErr } = await client.rpc("can_write_site", { p_site_id: siteId });
    if (writeErr) return fail("can_write_site_rpc_failed");
    out.can_write_site = canWrite === true;
    const { data: isAdmin, error: adminErr } = await client.rpc("is_admin");
    if (adminErr) return fail("is_admin_rpc_failed");
    out.is_admin = isAdmin === true;
    out.ownerJwtProbePass =
      out.stagingHostOk &&
      out.sessionPresent &&
      out.siteSingletonOk &&
      out.can_write_site === true &&
      out.is_admin === false;
    if (!out.ownerJwtProbePass) {
      out.stopReason =
        out.can_write_site !== true ? "can_write_site_not_true" : out.is_admin !== false ? "is_admin_not_false" : "owner_fixture_mismatch";
    }
    console.log(out);
    return out;
  } catch (e) {
    return fail("probe_exception");
  }
})();
```

Require `ownerJwtProbePass=true`. Else **STOP**.

### 3.4 Secret OFF confirmation (dummy 999 · no real row)

Do **not** use `discography-003` for this check (if Secret were ON, a 003 mutation POST could write).

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const FN = "https://" + STG + ".supabase.co/functions/v1/gosaki-discography-save-dry-run";
  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
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
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: "Bearer " + anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "save",
      approvalId: "gosaki-discography-operational-save",
      siteSlug: "gosaki-piano",
      legacyId: "discography-999",
      expectedBeforeUpdatedAt: "1970-01-01T00:00:00.000Z",
      release: { title: "arm-off", artist: "probe", release_date: null, label: null, purchase_url: null, description: null },
      tracksText: "arm-off",
    }),
  });
  let json = null;
  try {
    json = JSON.parse(await res.text());
  } catch (e) {
    json = null;
  }
  console.log({
    probe: "slice-b-secret-off",
    HTTP_STATUS: res.status,
    reasonCode: json && json.reasonCode,
  });
})();
```

PASS: `HTTP_STATUS=403` · `reasonCode=save_not_armed`. If `release_read_failed` → Secret still ON → **STOP** (unset first; do not POST 003).

### 3.5 Prepare Save snippet (clipboard · Secret still OFF)

Copy **§3.7** into another window. Do **not** paste into Console yet.

### 3.6 Secret ON (staging only · after 3.1–3.4 PASS)

```bash
npx supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

After ON: do not open/search/copy the doc. Paste §3.7 once.

Do **not** require VERSION **50** after this command (may become **51**). Re-list and require `UPDATED_AT` still **2026-08-15 14:12:36**. If `UPDATED_AT` changed → **STOP**, unset, no POST.

### 3.7 Exactly one owner POST (Save)

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
  if (String(row.description || "") !== DESC_BEFORE) {
    console.log({ abort: "description_baseline_changed" });
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
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch (e) {
      kind = "non_json";
    }
  } catch (e) {
    kind = e === "timeout" || (e && e.name === "AbortError") ? "timeout" : "fetch_failed";
  } finally {
    clearTimeout(timer);
  }

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
    changedFields: json && json.changedFields,
    updatedAt: json && (json.updated_at || json.updatedAt),
    keys: keys,
  });
})();
```

Expected success:

| Field | Value |
| --- | --- |
| HTTP | **200** |
| `ok` | `true` |
| `rpc` | `gosaki_discography_operational_save` |
| `didWrite` | `true` |
| `dbWrite` | `true` |
| `changedFields` | `["description"]` only |

Timeout / 5xx / unexpected → **no retry**. Still unset Secret.

`ONE_SHOT_SAVE_EXACT_PACKET_READY: true`

### 3.8 Immediate Secret unset (any outcome)

```bash
npx supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Then repeat §3.4. PASS: `save_not_armed`.

`SECRET_RESET_PACKET_READY: true`

### 3.9 Post-write SELECT-only

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LOCK = "2026-07-10T05:59:35.138671+00:00";
  const DESC_AFTER =
    "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass [CMS Kit staging] Slice B owner Save PoC";
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
  const albums = await client.from("discography").select("legacy_id,updated_at,description,title", { count: "exact" }).eq("site_slug", "gosaki-piano").order("legacy_id");
  const tracks = await client.from("discography_tracks").select("id", { count: "exact", head: true }).eq("site_slug", "gosaki-piano");
  const row = (albums.data || []).find((r) => r.legacy_id === "discography-003");
  const trows = await client.from("discography_tracks").select("id,track_number,title").eq("site_slug", "gosaki-piano").eq("discography_legacy_id", "discography-003").order("track_number", { ascending: true });
  const titles = (trows.data || []).map((r) => String(r.title || "").trim());
  const unrelated = (albums.data || [])
    .filter((r) => r.legacy_id !== "discography-003")
    .map((r) => ({ legacy_id: r.legacy_id, updated_at: r.updated_at }));
  console.log({
    probe: "slice-b-post-write",
    albums: albums.count,
    tracks: tracks.count,
    descriptionOk: String(row && row.description) === DESC_AFTER,
    lockAdvanced: String(row && row.updated_at) !== LOCK,
    newLock: row && row.updated_at,
    tracksOk: JSON.stringify(titles) === JSON.stringify(TRACKS),
    trackCount003: titles.length,
    unrelated: unrelated,
    pass:
      albums.count === 4 &&
      tracks.count === 34 &&
      String(row && row.description) === DESC_AFTER &&
      String(row && row.updated_at) !== LOCK &&
      JSON.stringify(titles) === JSON.stringify(TRACKS),
  });
})();
```

Record `newLock`. That value is the **only** restore lock. Do not reuse `2026-07-10T05:59:35.138671+00:00`.

`POST_WRITE_VERIFICATION_READY: true`

---

## 4. Restoration (separate step · after proof Save PASS)

Not part of the one-shot Save. New explicit approval required. Direct SQL / PostgREST **forbidden**.

1. Secret still OFF (§3.4).
2. Owner fixture again (§3.3).
3. Prepare §4.1 (clipboard). `LOCK_AFTER` must equal post-write `newLock`.
4. Secret ON (§3.6).
5. Paste §4.1 once.
6. Secret unset (§3.8).
7. SELECT: description === DESC_BEFORE · albums 4 · tracks 34 · 9 titles exact.

### 4.1 Restore POST (uses NEW lock)

Replace `LOCK_AFTER` with the post-write `updated_at` **before** Secret ON. If it equals the old candidate lock → **STOP**.

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
  const LOCK_BEFORE = "2026-07-10T05:59:35.138671+00:00";
  const LOCK_AFTER = "REPLACE_WITH_POST_WRITE_UPDATED_AT";
  const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
  const DESC_AFTER = DESC_BEFORE + " [CMS Kit staging] Slice B owner Save PoC";
  const TRACKS =
    "白玉Bluse\nThe Lady Is A Tramp\nHoneysuckle Rose\nDarn That Dream\nThe Old Country\nThe Sweetest Sounds\nThe Look Of Love\nSamba De Cafe Terrasse\nI'd Climb The Highest Mountain";
  const FN =
    "https://" + STG + ".supabase.co/functions/v1/gosaki-discography-save-dry-run";

  if (!LOCK_AFTER || LOCK_AFTER === "REPLACE_WITH_POST_WRITE_UPDATED_AT" || LOCK_AFTER === LOCK_BEFORE) {
    console.log({ abort: "restore_lock_not_new" });
    return;
  }

  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
  const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
  const config = cfgMod.getStagingAuthConfig();
  const url = String(config.supabaseUrl || "").trim();
  const anonKey = String(config.supabaseAnonKey || "").trim();
  if (!url.includes(STG) || url.includes(PROD) || FN.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }
  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const { data: sessData, error: sessErr } = await client.auth.getSession();
  const token = sessData && sessData.session && sessData.session.access_token;
  if (!token || sessErr) {
    console.log({ abort: "no_owner_session" });
    return;
  }

  const { data: row, error: rowErr } = await client
    .from("discography")
    .select("updated_at,description")
    .eq("site_slug", "gosaki-piano")
    .eq("legacy_id", LEGACY)
    .maybeSingle();
  if (rowErr || !row) {
    console.log({ abort: "restore_reselect_failed" });
    return;
  }
  if (String(row.updated_at) !== LOCK_AFTER) {
    console.log({ abort: "restore_lock_mismatch", current: row.updated_at });
    return;
  }
  if (String(row.description || "") !== DESC_AFTER) {
    console.log({ abort: "restore_description_not_marker" });
    return;
  }

  const body = {
    operation: "save",
    approvalId: "gosaki-discography-operational-save",
    siteSlug: "gosaki-piano",
    legacyId: LEGACY,
    expectedBeforeUpdatedAt: LOCK_AFTER,
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
      description: DESC_BEFORE,
    },
    tracksText: TRACKS,
  };

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
  console.log({
    probe: "slice-b-owner-restore",
    kind: kind,
    status: status,
    reasonCode: json && json.reasonCode,
    ok: json && json.ok,
    didWrite: json && json.didWrite,
    dbWrite: json && json.dbWrite,
    rpc: json && json.rpc,
    changedFields: json && json.changedFields,
    updatedAt: json && (json.updated_at || json.updatedAt),
  });
})();
```

`RESTORATION_EXACT_PACKET_READY: true`

`RESTORATION_USES_NEW_LOCK: true`

`DIRECT_SQL_WRITE: false`

Restore fail → stop · no retry · no SQL · ask human.

---

## 5. Sequence (operator · later)

1. §3.1 ACTIVE + VERSION **50** + `UPDATED_AT` **2026-08-15 14:12:36**
2. §3.2 lock/snapshot `pass=true`
3. §3.3 owner fixture PASS
4. §3.4 Secret OFF `save_not_armed`
5. Prepare §3.7
6. §3.6 Secret ON
7. §3.7 once
8. §3.8 unset immediately
9. §3.9 post-write `pass=true` · record `newLock`
10. Restoration only after new approval + §4

No retry. No UI Save. No `discography-999` in the Save body. No production ref.

---

## 6. Explicit non-actions (this phase)

- Cursor did not run Secret / POST / Save / restore
- No GRANT / RLS / RPC / Edge deploy
- No commit/push unless operator separately requests

---

## 7. Next

**`discography-site-owner-authz-slice-b-operational-save-execution`** after:

```txt
承認します。この操作を1回だけ実行してください。
```
