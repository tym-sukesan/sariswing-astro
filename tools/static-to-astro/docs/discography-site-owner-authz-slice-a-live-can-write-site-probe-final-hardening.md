# Discography site-owner authz Slice A — live Edge `can_write_site` probe final hardening

- **Phase:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (packet hardened · not executed)**
- **HEAD (baseline):** `7d0434b5ffba905a70136870dbedb7ea77da5dd9`
- **Prior:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight`
- **This phase:** lock two execution-preflight deltas into the operator packet · **no** Secrets mutate · **no** POST · **no** DB write · **no** deploy · **no** commit/push

Operator packet SoT for the future one-shot is **this file**. Probe logic / payload / `discography-999` / sentinel lock / arm ON=`set …=true` / arm OFF=`unset` are unchanged.

Deltas vs execution-preflight:

1. Secret ON 直前の **owner fixture recheck**（read-only · browser session）
2. arm OFF verification curl に **HTTP status 明示** (`-w '\nHTTP_STATUS=%{http_code}\n'`)

Cursor must **not** run Secret ON/OFF, owner POST, or the recheck IIFE. Operator execution still needs a separate explicit one-shot approval.

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

Local staging shell logged in as **pure site owner**:

`http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

Do **not** click Save or Dry-run. Open DevTools Console. Paste §3 IIFE **without Enter**. Paste §6 IIFE in a second line / later paste **without Enter**.

```bash
cd ~/sariswing-astro
: "${PUBLIC_SUPABASE_ANON_KEY:?staging anon key missing}"
: "${PUBLIC_SUPABASE_URL:?staging url missing}"
python3 - <<'PY'
import os
u = os.environ.get("PUBLIC_SUPABASE_URL", "")
k = os.environ.get("PUBLIC_SUPABASE_ANON_KEY", "")
assert "kmjqppxjdnwwrtaeqjta" in u, "not staging url"
assert "vsbvndwuajjhnzpohghh" not in u, "production url forbidden"
assert len(k) > 20, "anon key missing"
print("ENV_STAGING_OK")
print("ANON_KEY_PRESENT=true")
PY
```

### 1. staging function VERSION 47

```bash
supabase functions list --project-ref kmjqppxjdnwwrtaeqjta
```

Require `gosaki-discography-save-dry-run` ACTIVE · VERSION **47**. Else **STOP** (no Secret ON, no POST).

### 2. SELECT-only pre baseline

```bash
STG=kmjqppxjdnwwrtaeqjta
BASE="https://${STG}.supabase.co/rest/v1"

count_range () {
  curl -sS -D - -o /dev/null \
    -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Prefer: count=exact" \
    -H "Range: 0-0" \
    "$1" | tr -d '\r' | grep -i '^content-range:'
}

echo "ALBUMS"
count_range "${BASE}/discography?select=id&site_slug=eq.gosaki-piano"

echo "TRACKS"
count_range "${BASE}/discography_tracks?select=id&site_slug=eq.gosaki-piano"

echo "DISC-999"
count_range "${BASE}/discography?select=id&site_slug=eq.gosaki-piano&legacy_id=eq.discography-999"
```

Require `0-0/4` · `0-0/34` · `*/0`. If 999 ≠ `*/0` → **STOP**.

### 3. owner fixture recheck (read-only · before Secret ON)

Browser session reuse (same storage key as the owner POST). **Not** a functions Save. **Not** live Edge proof.

Enter the following IIFE **once**. Expected `OWNER_FIXTURE_RECHECK_PASS: true`.

If not PASS → **Secret ON forbidden · owner POST forbidden · no retry · STOP**.

```javascript
(async () => {
  const STG = "kmjqppxjdnwwrtaeqjta";
  const PROD = "vsbvndwuajjhnzpohghh";
  const SLUG = "gosaki-piano";
  const rest = "https://" + STG + ".supabase.co/rest/v1";

  const supabaseUrl = String(document.body?.dataset?.gosakiSupabaseUrl || "").trim();
  const anonKey = String(document.body?.dataset?.gosakiSupabaseAnonKey || "").trim();
  const stagingHostOk = supabaseUrl.includes(STG) && !supabaseUrl.includes(PROD) && !rest.includes(PROD);
  if (!stagingHostOk) {
    console.log({ OWNER_FIXTURE_RECHECK_PASS: false, abort: "host_not_staging" });
    return;
  }
  if (!anonKey) {
    console.log({ OWNER_FIXTURE_RECHECK_PASS: false, abort: "anon_key_missing_on_page" });
    return;
  }

  let token = null;
  try {
    const parsed = JSON.parse(localStorage.getItem("sb-" + STG + "-auth-token") || "null");
    token =
      (parsed && parsed.access_token) ||
      (parsed && parsed.currentSession && parsed.currentSession.access_token) ||
      null;
  } catch {
    token = null;
  }
  if (!token || typeof token !== "string") {
    console.log({ OWNER_FIXTURE_RECHECK_PASS: false, abort: "no_owner_session" });
    return;
  }

  const headers = {
    apikey: anonKey,
    Authorization: "Bearer " + token,
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: "count=exact",
  };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort("timeout"), 30000);
  let pass = false;
  let abort = null;
  let siteRowCount = -1;
  let siteSlug = null;
  let siteStatus = null;
  let canWrite = null;
  let isAdmin = null;
  try {
    const sitesRes = await fetch(
      rest + "/sites?select=id,site_slug,status&site_slug=eq." + encodeURIComponent(SLUG),
      { method: "GET", headers: headers, signal: ac.signal },
    );
    const sitesJson = await sitesRes.json();
    const rows = Array.isArray(sitesJson) ? sitesJson : [];
    siteRowCount = rows.length;
    const site = rows[0] || null;
    siteSlug = site ? String(site.site_slug || "") : null;
    siteStatus = site ? String(site.status || "") : null;
    const siteId = site ? String(site.id || "").trim() : "";
    const siteSingletonOk =
      sitesRes.ok && siteRowCount === 1 && siteSlug === SLUG && siteStatus === "active" && Boolean(siteId);
    if (!siteSingletonOk) {
      abort = "site_fixture_failed";
    } else {
      const writeRes = await fetch(rest + "/rpc/can_write_site", {
        method: "POST",
        headers: headers,
        signal: ac.signal,
        body: JSON.stringify({ p_site_id: siteId }),
      });
      canWrite = await writeRes.json();
      const adminRes = await fetch(rest + "/rpc/is_admin", {
        method: "POST",
        headers: headers,
        signal: ac.signal,
        body: "{}",
      });
      isAdmin = await adminRes.json();
      if (canWrite === true && isAdmin === false) {
        pass = true;
      } else {
        abort = "authz_fixture_failed";
      }
    }
  } catch (e) {
    abort = e === "timeout" || (e && e.name === "AbortError") ? "timeout" : "fetch_failed";
  } finally {
    clearTimeout(timer);
    token = null;
  }

  console.log({
    probe: "slice-a-owner-fixture-recheck",
    stagingHostOk: true,
    productionHostBlocked: false,
    sessionPresent: true,
    siteSingletonOk: siteRowCount === 1 && siteSlug === SLUG && siteStatus === "active",
    siteRowCount: siteRowCount,
    siteSlug: siteSlug,
    siteStatus: siteStatus,
    can_write_site: canWrite === true,
    is_admin: isAdmin === false ? false : isAdmin === true ? true : null,
    OWNER_FIXTURE_RECHECK_PASS: pass,
    abort: abort,
  });
})();
```

PASS requires all of:

- staging host exact
- `site_slug=gosaki-piano`
- sites singleton `1`
- site status `active`
- `can_write_site(site_id)=true`
- `is_admin()=false`

Do not log site UUID / JWT / email / user id.

### 4. Secret OFF command prepared (do not run yet)

```bash
supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Treat OFF as **RESET**, not DB rollback.

### 5. Secret ON (only if §1–§3 PASS)

```bash
supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
```

No Edge redeploy. UI arm stays off. Then **immediately** §6 once.

### 6. owner browser session — exactly one POST

Do **not** copy JWT to terminal. Enter the following IIFE **once** (one-shot flag). Payload / target / lock unchanged.

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

  const supabaseUrl = String(document.body?.dataset?.gosakiSupabaseUrl || "").trim();
  const anonKey = String(document.body?.dataset?.gosakiSupabaseAnonKey || "").trim();
  if (!supabaseUrl.includes(STG) || supabaseUrl.includes(PROD) || FN.includes(PROD)) {
    console.log({ abort: "host_not_staging" });
    return;
  }
  if (!anonKey) {
    console.log({ abort: "anon_key_missing_on_page" });
    return;
  }

  const storageKey = "sb-" + STG + "-auth-token";
  let token = null;
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
    token =
      (parsed && parsed.access_token) ||
      (parsed && parsed.currentSession && parsed.currentSession.access_token) ||
      null;
  } catch {
    token = null;
  }
  if (!token || typeof token !== "string") {
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
    token = null;
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

Payload / target / staging ref unchanged vs the locked packet. **Only** `-w` added.

```bash
STG=kmjqppxjdnwwrtaeqjta
URL="https://${STG}.supabase.co/functions/v1/gosaki-discography-save-dry-run"

curl -sS --max-time 30 -w '\nHTTP_STATUS=%{http_code}\n' -X POST "$URL" \
  -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "save",
    "approvalId": "gosaki-discography-operational-save",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-999",
    "expectedBeforeUpdatedAt": "1970-01-01T00:00:00.000Z",
    "release": {
      "title": "Slice A live authz probe",
      "artist": "probe",
      "release_date": null,
      "label": null,
      "purchase_url": null,
      "description": null
    },
    "tracksText": "Slice A live authz probe track"
  }'
```

PASS: `HTTP_STATUS=403` · `reasonCode=save_not_armed` · `rpc` key absent.

This POST is arm-off proof only. Do **not** treat it as owner `can_write_site` proof. Failure here must **not** retry the owner POST.

### 10. SELECT-only post baseline

Repeat §2. Require albums `0-0/4` · tracks `0-0/34` · 999 `*/0`.

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
