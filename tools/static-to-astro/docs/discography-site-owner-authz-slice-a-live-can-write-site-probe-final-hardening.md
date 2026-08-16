# Discography site-owner authz Slice A — live Edge `can_write_site` probe final hardening

- **Phase:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (packet hardened · historical snapshot)**
- **Operator execution recorded (2026-08-16):** `discography-site-owner-authz-slice-a-live-can-write-site-probe-result.md`. Gates below remain the pre-execution packet snapshot.
- **HEAD (baseline):** `7d0434b5ffba905a70136870dbedb7ea77da5dd9`
- **Prior:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight`
- **This phase:** lock two execution-preflight deltas into the operator packet · **no** Secrets mutate · **no** POST · **no** DB write · **no** deploy · **no** commit/push

This file remains the **historical** operator packet snapshot. Live one-shot result: `discography-site-owner-authz-slice-a-live-can-write-site-probe-result.md`. Do **not** re-arm or re-POST. Probe logic / payload / `discography-999` / sentinel lock / arm ON=`set …=true` / arm OFF=`unset` are unchanged.

Deltas vs execution-preflight:

1. Secret ON 直前の **owner fixture recheck**（read-only · browser session）
2. arm OFF verification に **HTTP status 明示**

**Dataset regression fix (2026-08-16, before operator execution):** §3 / §6 must **not** use `document.body.dataset.gosakiSupabaseUrl` / `gosakiSupabaseAnonKey`. That path failed live (`supabaseConfigFound=false`) because musician-basic login does not put URL/anon key on the DOM. Working SoT is the PASS'd owner JWT probe recorded in `discography-site-owner-authz-slice-a-staging-preflight-result.md`: Vite `getStagingAuthConfig()` + `getStagingSupabaseClient()` (same as login). Terminal `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are **not** assumed exported; Vite embeds them in the running `npm run dev` bundle.

Cursor must **not** run Secret ON/OFF, owner POST, or the recheck IIFE. Operator one-shot is already recorded — do **not** re-run.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening
FINAL_HARDENING_COMPLETE: true
OWNER_FIXTURE_RECHECK_ADDED: true
OWNER_FIXTURE_RECHECK_BEFORE_SECRET_ON: true
ARM_OFF_HTTP_STATUS_CAPTURED: true
TARGET_999_LOCKED: true
REAL_LEGACY_ID_PRESENT: false
NO_RETRY_RULE_FIXED: true
SECRET_OFF_METHOD: unset
STAGING_REF_HARD_FIXED: true
DATA_WRITE_REACHABLE: false
RPC_REACHED_EXPECTED: false
PRODUCTION_UNCHANGED: true
READY_FOR_OPERATOR_PROBE: true
KNOWN_DATASET_REGRESSION_FIXED: true
PAST_WORKING_PROBE_REUSED: true
OWNER_FIXTURE_RECHECK_WORKING_PATH: true
OWNER_POST_WORKING_PATH: true
TERMINAL_ENV_ASSUMPTION_VALID: true
CONSOLE_PREPARATION_UNAMBIGUOUS: true
OWNER_POST_PREPARED_BEFORE_SECRET_ON: true
NO_POST_ARM_RESEARCH_OR_COPY: true
COMMIT_READY: true
PROBE_EXECUTED: false
SECRETS_CHANGED: false
ARM_CHANGED: false
REAL_SAVE_EXECUTED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false
OWNER_FIXTURE_RECHECK_EXECUTED: false
STOP_REASONS: none
SECRET_ON_COMMAND: supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
SECRET_OFF_COMMAND: supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
EXPECTED_SAFE_STOP: release_read_failed
UI_CLIENT_WRITE_ARM_OFF: true
OWNER_ADDED_TO_ADMIN_USERS: false
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-execution
```

`READY_FOR_OPERATOR_PROBE: true` means the hardened packet is locked. It does **not** authorize Cursor or an unattended run.

Owner fixture recheck PASS is **not** live Edge `can_write_site` proof. It only gates Secret ON.

---

## 1. Unchanged lock (do not edit)

| Item | Value |
| --- | --- |
| Staging ref | `kmjqppxjdnwwrtaeqjta` |
| Production ref | `vsbvndwuajjhnzpohghh` **forbidden** |
| Function | `gosaki-discography-save-dry-run` |
| VERSION | **47** required (else Secret ON forbidden) |
| Target | `legacyId=discography-999` |
| Sentinel lock | `1970-01-01T00:00:00.000Z` |
| Expected stop | HTTP **403** `release_read_failed` |
| Path | arm ON → payload → owner JWT → `can_write_site` → SELECT 999 → 0 rows → `release_read_failed` → **no** operational RPC → **no** INSERT/UPDATE/DELETE → immediate `unset` |
| Pre / post baseline | albums **4** / tracks **34** / `discography-999=0` |
| Secret ON | `supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta` |
| Secret OFF | `supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta` |
| OFF method | **unset** (not `=false`) |
| `--project-ref` omit | **forbidden** (linked project is production) |
| Owner POST | exactly one · browser session · no JWT copy to terminal |
| UI Save / Dry-run | **forbidden** |
| Retry | **forbidden** |
| `service_role` | **forbidden** |
| owner → `admin_users` | **forbidden** |

Real album ids `discography-001` … `004` must not appear in the owner POST body.

---

## 2. Exact operator packet (hardened · not executed)

Working directory: `~/sariswing-astro`.

Do not print JWT / access_token / refresh_token / anon key / email / user id. Do not run `secrets list`. Do not `env | grep` secrets.

### 0. local / staging env readiness

Local staging shell logged in as **pure site owner** (Vite `npm run dev` — required for Console `import("/src/lib/...")`):

`http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

Do **not** click Save or Dry-run.

Console preparation (do **not** paste §3 and §6 together into DevTools Console):

1. Run **§3 only** while Secret is still OFF. Confirm `ownerJwtProbePass=true` (that is `OWNER_FIXTURE_RECHECK_PASS`).
2. **Before Secret ON**, copy the exact §6 snippet into another window or clipboard so it is ready to paste. Do **not** paste it into DevTools Console yet. Do **not** embed JWT / token / secret values into the snippet.
3. After Secret ON: do **not** open, search, edit, or copy from the doc. Terminal ON → immediately browser Console → paste the already-prepared §6 → Enter **exactly once** → confirm response → immediately terminal unset. No new code edits, no investigation.

Terminal `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are **not** assumed exported. Staging URL/anon key for browser probes come from Vite `getStagingAuthConfig()` (same as login). Do not `source` env files. Do not print values. CLI Secret / `functions list` do not need those vars.

### 1. staging function VERSION 47

```bash
supabase functions list --project-ref kmjqppxjdnwwrtaeqjta
```

Require `gosaki-discography-save-dry-run` ACTIVE · VERSION **47**. Else **STOP** (no Secret ON, no POST).

### 2. SELECT-only pre baseline

Same Vite client as the PASS'd owner JWT probe. Read-only counts. Secret stays OFF.

```javascript
(async () => {
  const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
  const PROD_REF = "vsbvndwuajjhnzpohghh";
  const SITE_SLUG = "gosaki-piano";
  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
  const clientMod = await import("/src/lib/admin/staging-auth/supabase-staging-auth-client.ts");
  const config = cfgMod.getStagingAuthConfig();
  const url = String(config.supabaseUrl || "").trim();
  const anonKey = String(config.supabaseAnonKey || "").trim();
  if (!url || !anonKey) {
    console.log({ abort: "getStagingAuthConfig missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY" });
    return;
  }
  if (url.includes(PROD_REF) || !url.includes(STAGING_REF)) {
    console.log({ abort: "host_not_staging" });
    return;
  }
  const client = clientMod.getStagingSupabaseClient(url, anonKey);
  const albums = await client.from("discography").select("id", { count: "exact", head: true }).eq("site_slug", SITE_SLUG);
  const tracks = await client.from("discography_tracks").select("id", { count: "exact", head: true }).eq("site_slug", SITE_SLUG);
  const d999 = await client.from("discography").select("id", { count: "exact", head: true }).eq("site_slug", SITE_SLUG).eq("legacy_id", "discography-999");
  console.log({
    probe: "slice-a-select-only-baseline",
    albums: albums.count,
    tracks: tracks.count,
    discography999: d999.count,
    pass: albums.count === 4 && tracks.count === 34 && d999.count === 0,
  });
})();
```

Require `albums=4` · `tracks=34` · `discography999=0`. If 999 ≠ 0 → **STOP**.

### 3. owner fixture recheck (read-only · before Secret ON)

Working method = PASS'd corrected owner JWT probe (`discography-site-owner-authz-slice-a-staging-preflight-result.md`). Vite `getStagingAuthConfig` + `getStagingSupabaseClient`. **Not** DOM dataset. **Not** a functions Save. **Not** live Edge proof.

Enter the following IIFE **once**, Secret still OFF. Expected `ownerJwtProbePass=true` (= `OWNER_FIXTURE_RECHECK_PASS`).

If not PASS → **Secret ON forbidden · owner POST forbidden · no retry · STOP**.

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
    siteSlug: null,
    siteStatus: null,
    siteRowCount: null,
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

    if (!url || !anonKey) {
      return fail("getStagingAuthConfig missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY");
    }

    out.productionHostBlocked = url.includes(PROD_REF);
    out.stagingHostOk = url.includes(STAGING_REF) && !out.productionHostBlocked;
    if (out.productionHostBlocked) return fail("production_ref_blocked");
    if (!out.stagingHostOk) return fail("staging_host_mismatch");

    const client = clientMod.getStagingSupabaseClient(url, anonKey);
    const { data: sessData, error: sessErr } = await client.auth.getSession();
    out.sessionPresent = Boolean(sessData?.session) && !sessErr;
    if (!out.sessionPresent) return fail("authenticated_session_missing");

    const { data: siteRows, error: siteErr } = await client
      .from("sites")
      .select("id,site_slug,status")
      .eq("site_slug", SITE_SLUG);

    if (siteErr) return fail("sites_select_failed");
    const rows = Array.isArray(siteRows) ? siteRows : [];
    out.siteRowCount = rows.length;
    out.siteSingletonOk = rows.length === 1;
    if (!out.siteSingletonOk) return fail("sites_not_exact_singleton");

    const site = rows[0];
    out.siteSlug = String(site.site_slug || "");
    out.siteStatus = String(site.status || "");
    const siteId = String(site.id || "").trim();
    if (!siteId) return fail("sites_id_missing");

    const { data: canWrite, error: writeErr } = await client.rpc("can_write_site", {
      p_site_id: siteId,
    });
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
        out.can_write_site !== true
          ? "can_write_site_not_true"
          : out.is_admin !== false
            ? "is_admin_not_false"
            : "owner_fixture_mismatch";
    }

    console.log(out);
    return out;
  } catch (e) {
    return fail("probe_exception");
  }
})();
```

PASS requires all of:

- staging host exact
- `site_slug=gosaki-piano`
- sites singleton `1`
- `can_write_site=true`
- `is_admin=false`

Do not log site UUID / JWT / email / user id. `OWNER_FIXTURE_RECHECK_PASS` := `ownerJwtProbePass === true`.

### 4. Secret OFF command prepared (do not run yet)

```bash
supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Treat OFF as **RESET**, not DB rollback.

### 5. Secret ON (only if §1–§3 PASS)

```bash
supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

No Edge redeploy. UI arm stays off. §6 must already be prepared (clipboard / other window). Then **immediately** paste that prepared snippet once — do not go back to the doc.

### 6. owner browser session — exactly one POST

Same working auth path as §3 (`getStagingAuthConfig` + `getStagingSupabaseClient` + `getSession`). Do **not** copy JWT to terminal. Do **not** use DOM dataset. Do **not** embed JWT / token / secret values in this snippet. Prepare this exact snippet **before Secret ON** (clipboard / other window, not DevTools Console). After Secret ON, paste the prepared snippet and Enter **once** (one-shot flag). Payload / target / lock unchanged.

```javascript
(async () => {
  const FLAG = "__SLICE_A_LIVE_CWS_PROBE_FIRED";
  if (window[FLAG]) {
    console.log({ abort: "already_fired_no_retry" });
    return;
  }
  window[FLAG] = true;

  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const LEGACY = "discography-999";
  const LOCK = "1970-01-01T00:00:00.000Z";
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

  const body = {
    operation: "save",
    approvalId: "gosaki-discography-operational-save",
    siteSlug: "gosaki-piano",
    legacyId: LEGACY,
    expectedBeforeUpdatedAt: LOCK,
    release: {
      title: "Slice A live authz probe",
      artist: "probe",
      release_date: null,
      label: null,
      purchase_url: null,
      description: null,
    },
    tracksText: "Slice A live authz probe track",
  };
  if (body.legacyId !== "discography-999") {
    console.log({ abort: "legacy_id_not_999" });
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
  console.log({
    probe: "slice-a-live-can-write-site",
    kind: kind,
    status: status,
    reasonCode: json && json.reasonCode,
    saveReadiness: json && json.saveReadiness,
    ok: json && json.ok,
    didWrite: json && json.didWrite,
    dbWrite: json && json.dbWrite,
    rpcKeyPresent: keys.indexOf("rpc") !== -1,
    keys: keys,
  });
})();
```

### 7. response check (no retry)

PASS: `kind=ok` · HTTP **403** · `reasonCode=release_read_failed` · `save_not_armed` absent · `rpcKeyPresent=false` · `didWrite/dbWrite=false` · `ok=false`.

Timeout / non_json / fetch_failed / 5xx / 2xx / unexpected reasonCode → **not PASS** · **do not re-POST**.

### 8. immediate Secret unset (any outcome)

```bash
supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

### 9. arm OFF verification (anon Bearer · HTTP status captured)

Same Vite `getStagingAuthConfig` for anon key (not owner JWT, not terminal env, not DOM dataset). Payload / target / staging ref unchanged.

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const FN =
    "https://" + STG + ".supabase.co/functions/v1/gosaki-discography-save-dry-run";
  const cfgMod = await import("/src/lib/admin/staging-auth/staging-auth-config.ts");
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
      release: {
        title: "Slice A live authz probe",
        artist: "probe",
        release_date: null,
        label: null,
        purchase_url: null,
        description: null,
      },
      tracksText: "Slice A live authz probe track",
    }),
  });
  let json = null;
  try {
    json = JSON.parse(await res.text());
  } catch {
    json = null;
  }
  const keys = json && typeof json === "object" ? Object.keys(json).sort() : [];
  console.log({
    probe: "slice-a-arm-off-verification",
    HTTP_STATUS: res.status,
    reasonCode: json && json.reasonCode,
    rpcKeyPresent: keys.indexOf("rpc") !== -1,
  });
})();
```

PASS: `HTTP_STATUS=403` · `reasonCode=save_not_armed` · `rpc` key absent.

This POST is arm-off proof only. Do **not** treat it as owner `can_write_site` proof. Failure here must **not** retry the owner POST.

### 10. SELECT-only post baseline

Repeat §2. Require albums `4` · tracks `34` · `discography999=0`.

### 11. no retry

```txt
exactly one owner POST
timeout / non-JSON / 5xx / unexpected reasonCode / 2xx
→ stop immediately
→ do not retry
→ do not re-POST
→ still run SECRET unset
→ SELECT-only 4/34 and 999=0
→ ask human
```

`NO_RETRY_RULE_FIXED: true`

`DATA_WRITE_REACHABLE: false`

`RPC_REACHED_EXPECTED: false`

---

## 3. Explicit non-execution this phase

- `supabase secrets set` / `unset`
- owner fixture recheck IIFE
- owner POST IIFE
- Edge deploy
- UI Save / Dry-run
- UI arm ON
- owner → `admin_users`
- production
- commit / push

`LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false` until a later execution records `release_read_failed`.

`RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-execution`
